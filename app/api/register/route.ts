import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { pool } from '@/lib/db'
import { generateMemberCode } from '@/lib/helper'
import { signToken } from '@/lib/jwt'
import { access } from 'fs'
const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

  
export async function POST(req: Request) {
    try {
        // ✅ 1. อ่าน token จาก cookie
        const token = (await cookies()).get('token')?.value
        let auhtToken;
        if (!token) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        }
        // 👉 ถ้าใช้ Authorization header แทน ก็อ่านจาก req.headers.get('Authorization') มาแทน
        const authHeader = req.headers.get('Authorization')
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const tokenFromHeader = authHeader.substring(7)
            if (tokenFromHeader) {
                auhtToken = tokenFromHeader
            }
        }

        // if (auhtToken != token) {
        //     return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        // }
        // ✅ 2. verify JWT
        let payload: any
        try {
            const result = await jwtVerify(token, secret)
            payload = result.payload
        } catch (err) {
            return NextResponse.json({ error: 'invalid token' }, { status: 401 })
        }

        // ✅ 3. ดึงข้อมูลจาก token
        const phone_no = payload.phone_no as string

        if (!phone_no) {
            return NextResponse.json({ error: 'invalid payload' }, { status: 401 })
        }

        // ✅ 4. รับ body
        const body = await req.json()

        const { fullname: member_name, email : member_email, dob: member_dob, phone_no: body_phone_no, gender: member_gender } = body

        if (phone_no !== body_phone_no) {
            return NextResponse.json({ error: 'phone number mismatch' }, { status: 400 })
        }

        // 👉 validate เพิ่มเองได้

        // ✅ 5. save DB


        // check email ซ้ำ
        if (member_email) {
            const existingEmail: any = await pool.query(
                `SELECT id FROM members WHERE member_email = $1 LIMIT 1`,
                [member_email]
            )
            if (existingEmail.rowCount > 0) {
                return NextResponse.json({ error: 'email already exists' }, { status: 400 })
            }
        }
        const existing: any = await pool.query(
            `SELECT id FROM members WHERE member_phone = $1 LIMIT 1`,
            [phone_no]
        )
        if (existing.rowCount > 0) {
            await pool.query(
                `UPDATE members SET member_name = $1, member_email = $2, member_dob = $3, member_gender = $4 WHERE member_phone = $5`,
                [member_name, member_email, member_dob, member_gender, phone_no]
            )
        } else {
            const member_code = await generateMemberCode() // สร้าง member_code แบบสุ่ม
            await pool.query(
                `INSERT INTO members (member_code, member_phone, member_name, member_email, member_dob, member_gender) VALUES ($1, $2, $3, $4, $5, $6)`,
                [member_code, phone_no, member_name, member_email, member_dob, member_gender]
            )
        }

        const memberResult: any = await pool.query(
            `SELECT id FROM members WHERE member_phone = $1 LIMIT 1`,
            [phone_no]
        )

        const memberId = memberResult.rows[0].id;
        const memberCode = memberResult.rows[0].member_code;

        // ✅ 6. สร้าง JWT ใหม่ (ถ้าต้องการเปลี่ยน payload)
        const newPayload = {
            phone_no,
            member_id: memberId,
            member_code: memberCode,
        }

        const newToken = await signToken(newPayload)

        // ตั้ง cookie ใหม่
        const response = NextResponse.json({
            success: true,
            phone_no,
            access_token: newToken,
        })
        response.cookies.set("token", newToken, {
            httpOnly: true,
            secure: true,
            path: "/",
            maxAge: 60 * 60 * 24 * 180, // 180 days
        });

        return response;

    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'internal error' }, { status: 500 })
    }
}