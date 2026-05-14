// /proxy.ts
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { publicUrl } from './lib/publicUrl'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

async function checkMemberExists(req: NextRequest, phone_no: string): Promise<boolean> {
  const origin = req.nextUrl.origin
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
  const protocol = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(':', '')

  const tryRequest = async (baseUrl: string) => {
    const res = await fetch(`${baseUrl}/api/me`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_no }),
    })

    if (!res.ok) {
      return false
    }

    const data = await res.json()
    return !!data.exists
  }

  try {
    return await tryRequest(origin)
  } catch (err: any) {
    const isTlsPacketError =
      err?.cause?.code === 'ERR_SSL_PACKET_LENGTH_TOO_LONG' ||
      String(err?.message || '').toLowerCase().includes('fetch failed')

    if (!isTlsPacketError || !host || protocol !== 'https') {
      throw err
    }

    return await tryRequest(`http://${host}`)
  }
}

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  // skip all image, api, _next, favicon.ico
  if (pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico') {
    return NextResponse.next()
  }
  // skip all public routes except /privilege and /setprofile
   if (
    pathname === '/login' ||
    pathname === '/about' ||
    pathname === '/contact'
  ) {
    return NextResponse.next()
  }
  // skip all jpg, png, svg, etc
  if (pathname.match(/\.(jpg|jpeg|png|svg|gif|ico|webp|avif|bmp|tiff|tif)$/)) {
    return NextResponse.next()
  }
  // 🔥 กัน loop ก่อน
  if (
    pathname === '/setprofile' ||
    pathname.startsWith('/privilege') ||
    pathname.startsWith('/receipt') ||
    pathname.startsWith('/claim') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  const token = req.cookies.get('token')?.value

  // ❌ ไม่มี token → ปล่อยผ่าน
  if (!token) {
    if(pathname.startsWith('/privilege') || pathname.startsWith('/setprofile')) {
      return NextResponse.redirect(publicUrl(req, '/'))
    }
    return NextResponse.next()
  }

  try {
    const { payload } = await jwtVerify(token, secret)

    const phone_no = payload.phone_no as string

    if (!phone_no) {
      return NextResponse.redirect(publicUrl(req, '/setprofile'))
    }

    const exists = await checkMemberExists(req, phone_no)

    if (exists) {
        // skip if url starts with /privilege or /setprofile
        if (pathname.startsWith('/privilege')) {
            return NextResponse.next()
        }
      return NextResponse.redirect(publicUrl(req, '/privilege'))
    } else {
      return NextResponse.redirect(publicUrl(req, '/setprofile'))
    }

  } catch (err: any) {
    console.error(err)
    const res = NextResponse.redirect(publicUrl(req, '/'))
    res.cookies.delete('token')
    return res
  }
}
