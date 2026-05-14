import type { NextRequest } from 'next/server'

function firstHeaderValue(value: string | null): string | undefined {
  if (!value) return undefined
  return value.split(',')[0]?.trim() || undefined
}

export function getPublicOrigin(req: NextRequest): string {
  const forwardedProto = firstHeaderValue(req.headers.get('x-forwarded-proto'))
  const forwardedHost = firstHeaderValue(req.headers.get('x-forwarded-host'))
  const host = forwardedHost ?? firstHeaderValue(req.headers.get('host')) ?? req.nextUrl.host

  const proto =
    forwardedProto === 'https' || forwardedProto === 'http'
      ? forwardedProto
      : req.nextUrl.protocol.replace(':', '')

  return `${proto}://${host}`
}

export function publicUrl(req: NextRequest, path: string): URL {
  return new URL(path, getPublicOrigin(req))
}

