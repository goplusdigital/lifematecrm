// /app/api/auth/me/route.ts
import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { phone_no } = await req.json()

    if (!phone_no) {
      return NextResponse.json({ exists: false }, { status: 400 })
    }

    const result : any = await pool.query(
      `SELECT id FROM members WHERE member_phone = $1 LIMIT 1`,
      [phone_no]
    )

    return NextResponse.json({
      exists: result.rowCount > 0,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ exists: false }, { status: 500 })
  }
}