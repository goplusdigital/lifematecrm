import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { pool } from "@/lib/db";

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

  const memberRes = await pool.query(
    `SELECT member_code FROM members WHERE member_phone = $1 LIMIT 1`,
    [phoneNo],
  );
  if (memberRes.rowCount === 0) return null;

  return { memberCode: memberRes.rows[0].member_code as string };
}

export async function POST(req: Request) {
  const client = await pool.connect();
  try {
    const member = await resolveMember(req);
    if (!member) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json();
    const claimId = String(body.claim_id ?? body.claimId ?? "");
    if (!claimId) return NextResponse.json({ error: "claim_id required" }, { status: 400 });

    await client.query("BEGIN");

    const claimRes = await client.query(
      `
      SELECT cc.*, c.use_start_at, c.use_end_at, c.name
      FROM coupon_claims cc
      JOIN coupons c ON c.id = cc.coupon_id
      WHERE cc.id = $1 AND cc.member_code = $2
      LIMIT 1
      FOR UPDATE
      `,
      [claimId, member.memberCode],
    );
    if (claimRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "claim not found" }, { status: 404 });
    }

    const claim = claimRes.rows[0];
    const now = new Date();

    const useStartAt = claim.use_start_at ? new Date(claim.use_start_at) : null;
    const useEndAt = claim.use_end_at ? new Date(claim.use_end_at) : null;
    const withinUseWindow = (!useStartAt || useStartAt <= now) && (!useEndAt || useEndAt >= now);
    if (!withinUseWindow) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "not in use window" }, { status: 400 });
    }

    if (claim.status === "USED") {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "already used" }, { status: 400 });
    }

    if (claim.status === "ACTIVATED") {
      await client.query("COMMIT");
      return NextResponse.json({
        success: true,
        data: {
          id: String(claim.id),
          couponId: Number(claim.coupon_id),
          code: claim.code,
          status: claim.status,
          activatedAt: claim.activated_at ? new Date(claim.activated_at).toISOString() : null,
          activationExpiresAt: claim.activation_expires_at ? new Date(claim.activation_expires_at).toISOString() : null,
        },
      });
    }

    if (claim.status !== "CLAIMED") {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }

    const activationExpiresAt = new Date(now.getTime() + 30 * 60 * 1000);

    const updateRes = await client.query(
      `
      UPDATE coupon_claims
      SET status = 'ACTIVATED',
          activated_at = $1,
          activation_expires_at = $2
      WHERE id = $3
      RETURNING id, coupon_id, code, status, activated_at, activation_expires_at
      `,
      [now, activationExpiresAt, claimId],
    );

    await client.query("COMMIT");

    const row = updateRes.rows[0];
    return NextResponse.json({
      success: true,
      data: {
        id: String(row.id),
        couponId: Number(row.coupon_id),
        code: row.code,
        status: row.status,
        activatedAt: row.activated_at ? new Date(row.activated_at).toISOString() : null,
        activationExpiresAt: row.activation_expires_at ? new Date(row.activation_expires_at).toISOString() : null,
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
