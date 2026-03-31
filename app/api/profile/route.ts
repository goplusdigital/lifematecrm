import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { pool } from '@/lib/db'
import { formatDateLocal, generateMemberCode } from '@/lib/helper'
import { signToken } from '@/lib/jwt'
import { access } from 'fs'
const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const token = (await cookies()).get('token')?.value
    let authToken : any;
    
    // 👉 ถ้าใช้ Authorization header แทน ก็อ่านจาก req.headers.get('Authorization') มาแทน
    const authHeader = req.headers.get('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const tokenFromHeader = authHeader.substring(7)
      if (tokenFromHeader) {
        authToken = tokenFromHeader
      }
    }
    console.log('token from cookie', token);
    console.log('token from header', authToken);

    if (!token && !authToken) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    // if (authToken != token) {
    //     return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    // }
    // ✅ 2. verify JWT
    let payload: any
    try {
      const result = await jwtVerify(authToken, secret)
      payload = result.payload
    } catch (err) {
      return NextResponse.json({ error: 'invalid token' }, { status: 401 })
    }

    // ✅ 3. ดึงข้อมูลจาก token
    const phone_no = payload.phone_no as string

    if (!phone_no) {
      return NextResponse.json({ error: 'invalid payload' }, { status: 401 })
    }

    const result: any = await pool.query(
      `SELECT * FROM members WHERE member_phone = $1 LIMIT 1`,
      [phone_no]
    )

    return NextResponse.json({
      exists: result.rowCount > 0,
      fullname : result.rowCount > 0 ? result.rows[0].member_name : null,
      email : result.rowCount > 0 ? result.rows[0].member_email : null,
      dob : result.rowCount > 0 ? formatDateLocal(new Date(result.rows[0].member_dob)) : null,
      dobString : result.rowCount > 0 ? result.rows[0].member_dob.toISOString() : null,
      gender : result.rowCount > 0 ? result.rows[0].member_gender : null,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ exists: false }, { status: 500 })
  }
}