import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

function parseExpirationTime(expiresIn: string | number): number {
  if (typeof expiresIn === 'number') {
    return Math.floor(Date.now() / 1000) + expiresIn;
  }

  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid expiration time format: ${expiresIn}`);
  }

  const [, value, unit] = match;
  const seconds = parseInt(value, 10);
  
  let totalSeconds = seconds;
  switch (unit) {
    case 's':
      totalSeconds = seconds;
      break;
    case 'm':
      totalSeconds = seconds * 60;
      break;
    case 'h':
      totalSeconds = seconds * 60 * 60;
      break;
    case 'd':
      totalSeconds = seconds * 60 * 60 * 24;
      break;
  }

  return Math.floor(Date.now() / 1000) + totalSeconds;
}

export async function signToken(payload: any, expiresIn: string = '7d') {
  const expirationTime = parseExpirationTime(expiresIn);
  
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expirationTime)
    .sign(secret);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}