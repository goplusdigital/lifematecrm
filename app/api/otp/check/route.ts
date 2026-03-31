// /app/api/otp/check/route.ts
import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { hashOTP } from '@/lib/otp'
import { signToken } from '@/lib/jwt'

export async function POST(req: Request) {
  try {
    const { phone_no, ref_code, otp } = await req.json()

    if (!phone_no || !ref_code || !otp) {
      return NextResponse.json({ error: 'missing params' }, { status: 400 })
    }

    let phone_no_string = phone_no as string
    if (phone_no_string.startsWith('0')) {
      phone_no_string = '+66' + phone_no_string.slice(1)
    }

    if (!phone_no_string) {
      return NextResponse.json({ error: 'phone_no required' }, { status: 400 })
    }

    const result : any = await pool.query(
      `SELECT * FROM sms_otp
       WHERE phone_no = $1
       AND ref_code = $2
       AND is_used = false
       AND expired_at > now()
       LIMIT 1`,
      [phone_no_string, ref_code]
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'OTP not found or expired' }, { status: 400 })
    }

    const record = result.rows[0]

    // ❌ เกิน attempt
    if (record.attempt_count >= record.max_attempt) {
      return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })
    }

    const input_hash = hashOTP(otp)

    if (input_hash !== record.otp_hash) {
      // เพิ่ม attempt
      await pool.query(
        `UPDATE sms_otp 
         SET attempt_count = attempt_count + 1
         WHERE id = $1`,
        [record.id]
      )

      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 })
    }

    // ✅ success → mark used
    await pool.query(
      `UPDATE sms_otp 
       SET is_used = true 
       WHERE id = $1`,
      [record.id]
    )

    

    const token = await signToken({ phone_no: phone_no_string });
    const res = NextResponse.json({ success: true, token });
    res.cookies.set("token", token, {
      httpOnly: true,
      // secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 180, // 180 days
    });

    return res;
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}