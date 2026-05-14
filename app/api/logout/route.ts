import { NextRequest, NextResponse } from 'next/server'
import { publicUrl } from '@/lib/publicUrl'

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

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const next = searchParams.get('next') || '/'
  const redirectUrl = next.startsWith('http://') || next.startsWith('https://') ? next : publicUrl(req, next)
  const res = NextResponse.redirect(redirectUrl)

  res.cookies.set('token', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  })

  return res
}
