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
    `SELECT member_code, member_point, created_at FROM members WHERE member_phone = $1 LIMIT 1`,
    [phoneNo],
  );
  if (memberRes.rowCount === 0) return null;

  return {
    memberCode: memberRes.rows[0].member_code as string,
    memberPoint: Number(memberRes.rows[0].member_point ?? 0),
    createdAt: memberRes.rows[0].created_at ? new Date(String(memberRes.rows[0].created_at)) : null,
  };
}

export async function GET(req: Request) {
  try {
    const member = await resolveMember(req);
    if (!member) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const now = new Date();

    const couponsRes = await pool.query(
      `
      WITH claim_counts AS (
        SELECT coupon_id, member_code, COUNT(*)::int AS claimed_count
        FROM coupon_claims
        WHERE member_code = $1
        GROUP BY coupon_id, member_code
      )
      SELECT
        c.id,
        c.name,
        c.description,
        c.reward_type,
        c.discount_amount,
        c.redeem_variant_id,
        c.points_required,
        c.claim_start_at,
        c.claim_end_at,
        c.use_start_at,
        c.use_end_at,
        c.code_mode,
        c.fixed_code,
        c.require_new_member_same_day,
        c.max_per_member,
        c.is_active,
        COALESCE(cc.claimed_count, 0) AS claimed_count
      FROM coupons c
      LEFT JOIN claim_counts cc
        ON cc.coupon_id = c.id AND cc.member_code = $1
      WHERE c.is_active = TRUE
      ORDER BY c.created_at DESC
      LIMIT 200
      `,
      [member.memberCode],
    );

    const data = couponsRes.rows.map((row: Record<string, unknown>) => {
      const get = (key: string) => (row as Record<string, unknown>)[key];
      const asNum = (value: unknown) => (typeof value === "number" ? value : Number(value ?? 0));
      const claimedCount = asNum(get("claimed_count"));
      const maxPerMember = asNum(get("max_per_member"));
      const pointsRequired = asNum(get("points_required"));
      const claimStartAtRaw = get("claim_start_at");
      const claimEndAtRaw = get("claim_end_at");
      const claimStartAt = claimStartAtRaw ? new Date(String(claimStartAtRaw)) : null;
      const claimEndAt = claimEndAtRaw ? new Date(String(claimEndAtRaw)) : null;

      const withinClaimWindow =
        (!claimStartAt || claimStartAt <= now) && (!claimEndAt || claimEndAt >= now);

      let canClaim = withinClaimWindow;
      let disabledReason: string | null = null;
      if (!withinClaimWindow) {
        canClaim = false;
        disabledReason = "ยังไม่อยู่ในช่วงเวลาแลกคูปอง";
      } else if (get("require_new_member_same_day") === true) {
        const memberCreatedAt = member.createdAt;
        if (!memberCreatedAt) {
          canClaim = false;
          disabledReason = "เฉพาะลูกค้าใหม่ภายในวันนี้เท่านั้น";
        } else {
          const isSameDay =
            memberCreatedAt.getFullYear() === now.getFullYear() &&
            memberCreatedAt.getMonth() === now.getMonth() &&
            memberCreatedAt.getDate() === now.getDate();
          if (!isSameDay) {
            canClaim = false;
            disabledReason = "เฉพาะลูกค้าใหม่ภายในวันนี้เท่านั้น";
          }
        }
      } else if (maxPerMember > 0 && claimedCount >= maxPerMember) {
        canClaim = false;
        disabledReason = "รับครบตามจำนวนที่กำหนดแล้ว";
      } else if (pointsRequired > 0 && member.memberPoint < pointsRequired) {
        canClaim = false;
        disabledReason = "คะแนนไม่เพียงพอ";
      }

      return {
        id: asNum(get("id")),
        name: String(get("name") ?? ""),
        description: String(get("description") ?? ""),
        rewardType: String(get("reward_type") ?? "DISCOUNT_AMOUNT"),
        discountAmount: asNum(get("discount_amount")),
        redeemVariantId: get("redeem_variant_id") ? asNum(get("redeem_variant_id")) : null,
        pointsRequired,
        claimStartAt: claimStartAtRaw ? new Date(String(claimStartAtRaw)).toISOString() : null,
        claimEndAt: claimEndAtRaw ? new Date(String(claimEndAtRaw)).toISOString() : null,
        useStartAt: get("use_start_at") ? new Date(String(get("use_start_at"))).toISOString() : null,
        useEndAt: get("use_end_at") ? new Date(String(get("use_end_at"))).toISOString() : null,
        codeMode: String(get("code_mode") ?? "FIXED"),
        fixedCode: String(get("fixed_code") ?? ""),
        requireNewMemberSameDay: Boolean(get("require_new_member_same_day")),
        maxPerMember,
        claimedCount,
        canClaim,
        disabledReason,
      };
    });

    return NextResponse.json({ data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
