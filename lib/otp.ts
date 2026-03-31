// /lib/otp.ts
import crypto from 'crypto'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

export function generateRefCode(length = 6) {
  const bytes = crypto.randomBytes(length)
  let result = ''

  for (let i = 0; i < length; i++) {
    result += CHARS[bytes[i] % CHARS.length]
  }

  return result
}

export function generateOTP(length = 6) {
  return Math.floor(10 ** (length - 1) + Math.random() * 9 * 10 ** (length - 1)).toString()
}

export function hashOTP(otp: string) {
  return crypto.createHash('sha256').update(otp).digest('hex')
}