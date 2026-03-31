import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ success: true })

  // 🔥 ลบ cookie
  res.cookies.set('token', '', {
    httpOnly: true,
    secure: true,
    path: '/',
    maxAge: 0, // สำคัญ
  })

  return res
}