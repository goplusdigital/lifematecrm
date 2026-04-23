import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ success: true })

  // 🔥 ลบ cookie
  res.cookies.set('token', '', {
    httpOnly: true,
    // secure: true,
    path: '/',
    maxAge: 0, // สำคัญ
  })

  return res
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const next = searchParams.get('next') || '/'
  const res = NextResponse.redirect(new URL(next, req.url))

  res.cookies.set('token', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  })

  return res
}