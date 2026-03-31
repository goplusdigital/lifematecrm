// /middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // 🔥 กัน loop ก่อน
  if (
    pathname === '/setprofile' ||
    pathname === '/privilege' ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  const token = req.cookies.get('token')?.value

  // ❌ ไม่มี token → ปล่อยผ่าน
  if (!token) {
    return NextResponse.next()
  }

  try {
    const { payload } = await jwtVerify(token, secret)

    const phone_no = payload.phone_no as string

    if (!phone_no) {
      return NextResponse.redirect(new URL('/setprofile', req.url))
    }

    // 🔥 call API check member
    const res = await fetch(`${req.nextUrl.origin}/api/me`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_no }),
    })

    if (!res.ok) {
      return NextResponse.redirect(new URL('/setprofile', req.url))
    }

    const data = await res.json()

    if (data.exists) {
      return NextResponse.redirect(new URL('/privilege', req.url))
    } else {
      return NextResponse.redirect(new URL('/setprofile', req.url))
    }

  } catch (err) {
    console.error(err)
    return NextResponse.redirect(new URL('/setprofile', req.url))
  }
}