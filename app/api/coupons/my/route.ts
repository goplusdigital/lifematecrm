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
    `SELECT member_code, member_point FROM members WHERE member_phone = $1 LIMIT 1`,
    [phoneNo],
  );
  if (memberRes.rowCount === 0) return null;

  return {
    memberCode: memberRes.rows[0].member_code as string,
    memberPoint: Number(memberRes.rows[0].member_point ?? 0),
  };
}

export async function GET(req: Request) {
  try {
    const member = await resolveMember(req);
    if (!member) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    await pool.query(
      `
      UPDATE coupon_claims
      SET status = 'EXPIRED'
      WHERE member_code = $1
        AND status = 'ACTIVATED'
        AND activation_expires_at IS NOT NULL
        AND activation_expires_at < now()
      `,
      [member.memberCode],
    );

    const claimsRes = await pool.query(
      `
      SELECT
        cc.id,
        cc.coupon_id,
        cc.code,
        cc.status,
        cc.claimed_at,
        cc.activated_at,
        cc.activation_expires_at,
        cc.used_at,
        c.name,
        c.description,
        c.reward_type,
        c.discount_amount,
        c.redeem_variant_id,
        c.points_required,
        c.use_start_at,
        c.use_end_at,
        c.code_mode
      FROM coupon_claims cc
      JOIN coupons c ON c.id = cc.coupon_id
      WHERE cc.member_code = $1
      ORDER BY cc.claimed_at DESC
      LIMIT 200
      `,
      [member.memberCode],
    );

    const data = claimsRes.rows.map((row: Record<string, unknown>) => {
      const get = (key: string) => (row as Record<string, unknown>)[key];
      const asNum = (value: unknown) => (typeof value === "number" ? value : Number(value ?? 0));
      const asIso = (value: unknown) => (value ? new Date(String(value)).toISOString() : null);

      return {
        id: String(get("id") ?? ""),
        couponId: asNum(get("coupon_id")),
        code: String(get("code") ?? ""),
        status: String(get("status") ?? "CLAIMED"),
        claimedAt: asIso(get("claimed_at")),
        activatedAt: asIso(get("activated_at")),
        activationExpiresAt: asIso(get("activation_expires_at")),
        usedAt: asIso(get("used_at")),
      coupon: {
        id: asNum(get("coupon_id")),
        name: String(get("name") ?? ""),
        description: String(get("description") ?? ""),
        rewardType: String(get("reward_type") ?? "DISCOUNT_AMOUNT"),
        discountAmount: asNum(get("discount_amount")),
        redeemVariantId: get("redeem_variant_id") ? asNum(get("redeem_variant_id")) : null,
        pointsRequired: asNum(get("points_required")),
        useStartAt: asIso(get("use_start_at")),
        useEndAt: asIso(get("use_end_at")),
        codeMode: String(get("code_mode") ?? "FIXED"),
      },
      };
    });

    return NextResponse.json({ data, memberPoint: member.memberPoint });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
