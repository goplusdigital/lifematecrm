// /app/api/otp/request/route.ts
import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { generateOTP, hashOTP,generateRefCode } from '@/lib/otp'
import { QueryResult } from 'pg'
import { sendSMS } from '@/lib/ais'

export async function POST(req: Request) {
  try {
    const { phone_no } = await req.json()
    //replace first 0 with +66
    let phone_no_string = phone_no as string
    if (phone_no_string.startsWith('0')) {
      phone_no_string = '+66' + phone_no_string.slice(1)
    }

    if (!phone_no_string) {
      return NextResponse.json({ error: 'phone_no required' }, { status: 400 })
    }

    // ⛔ rate limit (60 วิ)
    const recent : any = await pool.query(
      `SELECT 1 FROM sms_otp 
       WHERE phone_no = $1 
       AND created_at > now() - interval '60 seconds'`,
      [phone_no_string]
    )

    if (recent.rowCount > 0) {
      return NextResponse.json({ error: 'Too many requests' , 'ref_code': null }, { status: 429 })
    }

    // 🔢 generate OTP
    const otp = generateOTP(6)
    const otp_hash = hashOTP(otp)

    const ref_code = generateRefCode(6)

    // 🧹 ลบ OTP เก่าที่ยังไม่ใช้
    await pool.query(
      `DELETE FROM sms_otp 
       WHERE phone_no = $1 AND is_used = false`,
      [phone_no_string]
    )

    // 💾 insert
    await pool.query(
      `INSERT INTO sms_otp 
       (phone_no, ref_code, otp_hash, expired_at)
       VALUES ($1, $2, $3, now() + interval '5 minutes')`,
      [phone_no_string, ref_code, otp_hash]
    )

    // 📲 send SMS
    await sendSMS({
      phone: phone_no_string,
      message: `Your OTP is ${otp} (Ref: ${ref_code}). It will expire in 5 minutes.`,
    })

    return NextResponse.json({
      success: true,
      ref_code,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}