import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { pool } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

async function resolveMember(req: Request) {
  const cookieToken = (await cookies()).get("token")?.value;
  const authHeader = req.headers.get("Authorization");
  const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
  const token = headerToken && headerToken !== "undefined" ? headerToken : cookieToken;
  if (!token) return null;

  let payload: Record<string, unknown>;
  try {
    const result = await jwtVerify(token, secret);
    payload = result.payload as Record<string, unknown>;
  } catch {
    return null;
  }

  const phoneNo = typeof payload.phone_no === "string" ? payload.phone_no : undefined;
  if (!phoneNo) return null;

  return { phoneNo };
}

function randomSuffix(length = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export async function POST(req: Request) {
  const client = await pool.connect();
  try {
    const memberAuth = await resolveMember(req);
    if (!memberAuth) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const couponId = Number(body.coupon_id ?? body.couponId ?? 0);
    if (!couponId || !Number.isFinite(couponId)) {
      return NextResponse.json({ error: "coupon_id required" }, { status: 400 });
    }

    await client.query("BEGIN");

    const memberRes = await client.query(
      `SELECT member_code, member_point, created_at FROM members WHERE member_phone = $1 LIMIT 1 FOR UPDATE`,
      [memberAuth.phoneNo],
    );
    if (memberRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "member not found" }, { status: 404 });
    }

    const memberCode = memberRes.rows[0].member_code as string;
    const memberPoint = Number(memberRes.rows[0].member_point ?? 0);
    const memberCreatedAt = memberRes.rows[0].created_at ? new Date(String(memberRes.rows[0].created_at)) : null;

    const couponRes = await client.query(
      `
      SELECT *
      FROM coupons
      WHERE id = $1 AND is_active = TRUE
      LIMIT 1
      FOR UPDATE
      `,
      [couponId],
    );
    if (couponRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "coupon not found" }, { status: 404 });
    }

    const coupon = couponRes.rows[0];
    const now = new Date();
    const claimStartAt = coupon.claim_start_at ? new Date(coupon.claim_start_at) : null;
    const claimEndAt = coupon.claim_end_at ? new Date(coupon.claim_end_at) : null;
    const withinClaimWindow =
      (!claimStartAt || claimStartAt <= now) && (!claimEndAt || claimEndAt >= now);
    if (!withinClaimWindow) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "not in claim window" }, { status: 400 });
    }

    if (coupon.require_new_member_same_day === true) {
      const isSameDay =
        memberCreatedAt &&
        memberCreatedAt.getFullYear() === now.getFullYear() &&
        memberCreatedAt.getMonth() === now.getMonth() &&
        memberCreatedAt.getDate() === now.getDate();
      if (!isSameDay) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "new customer only" }, { status: 400 });
      }
    }

    const maxPerMember = Number(coupon.max_per_member ?? 0);
    if (maxPerMember > 0) {
      const countRes = await client.query(
        `SELECT COUNT(*)::int AS c FROM coupon_claims WHERE coupon_id = $1 AND member_code = $2`,
        [couponId, memberCode],
      );
      const claimedCount = Number(countRes.rows[0]?.c ?? 0);
      if (claimedCount >= maxPerMember) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "claim limit reached" }, { status: 400 });
      }
    }

    const pointsRequired = Number(coupon.points_required ?? 0);
    if (pointsRequired > 0 && memberPoint < pointsRequired) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "insufficient points" }, { status: 400 });
    }

    const codeMode = coupon.code_mode as "FIXED" | "RANDOM_PER_USER";
    const fixedCode = (coupon.fixed_code ?? "") as string;
    if (codeMode === "FIXED" && !fixedCode.trim()) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "coupon code not configured" }, { status: 400 });
    }

    const initialCode = codeMode === "FIXED" ? fixedCode.trim() : "PENDING";

    const claimInsert = await client.query(
      `
      INSERT INTO coupon_claims (coupon_id, member_code, code, status, claimed_at)
      VALUES ($1, $2, $3, 'CLAIMED', now())
      RETURNING id
      `,
      [couponId, memberCode, initialCode],
    );

    const claimId = String(claimInsert.rows[0].id);
    let claimCode = initialCode;
    if (codeMode === "RANDOM_PER_USER") {
      claimCode = `C${couponId}-${claimId}-${randomSuffix(6)}`;
      await client.query(`UPDATE coupon_claims SET code = $1 WHERE id = $2`, [claimCode, claimId]);
    }

    if (pointsRequired > 0) {
      const newBalance = memberPoint - pointsRequired;
      const txId = uuidv4();
      await client.query(
        `
        INSERT INTO point_logs
        ("txId", "type", amount, "remainingAmount", "expiresAt", "refType", "refId", reason, "createdAt", "memberCode", balance)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `,
        [
          txId,
          "spend",
          pointsRequired,
          0,
          null,
          "coupon",
          String(couponId),
          `Claim coupon ${coupon.name ?? ""}`.trim(),
          new Date(),
          memberCode,
          newBalance,
        ],
      );

      await client.query(`UPDATE members SET member_point = member_point - $1 WHERE member_code = $2`, [
        pointsRequired,
        memberCode,
      ]);
    }

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      data: {
        claimId,
        couponId,
        memberCode,
        code: claimCode,
        codeMode,
        claimedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error(err);
    try {
      await client.query("ROLLBACK");
    } catch {}
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  } finally {
    client.release();
  }
}
