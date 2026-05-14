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
      SELECT id, status, activation_expires_at
      FROM coupon_claims
      WHERE id = $1 AND member_code = $2
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

    if (claim.status === "ACTIVATED" && claim.activation_expires_at) {
      const expiresAt = new Date(claim.activation_expires_at);
      if (expiresAt < now) {
        await client.query(`UPDATE coupon_claims SET status = 'EXPIRED' WHERE id = $1`, [claimId]);
        await client.query("COMMIT");
        return NextResponse.json({ error: "coupon expired" }, { status: 400 });
      }
    }

    if (claim.status !== "ACTIVATED") {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "coupon is not activated" }, { status: 400 });
    }

    const updateRes = await client.query(
      `
      UPDATE coupon_claims
      SET status = 'USED',
          used_at = $1
      WHERE id = $2
      RETURNING id, status, used_at
      `,
      [now, claimId],
    );

    await client.query("COMMIT");

    const row = updateRes.rows[0];
    return NextResponse.json({
      success: true,
      data: { id: String(row.id), status: row.status, usedAt: new Date(row.used_at).toISOString() },
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
