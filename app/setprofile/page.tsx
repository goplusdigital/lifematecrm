"use server"

import RegisterForm from "./register"
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { redirect } from 'next/navigation'
import { getServerBaseUrl } from '@/lib/server-base-url'

// ✅ Server Action for cookie deletion
export async function deleteCookie() {
  // (await cookies()).delete('token')
}

export default async function Register() {
  const token = (await cookies()).get('token')?.value

  if (!token) return null

  let profileExists = false
  const baseUrl = await getServerBaseUrl()

  // check is registered
  try {

    const res = await fetch(`${baseUrl}/api/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (res.ok) {
      const data = await res.json();
      if (data.exists) {
        profileExists = true
      } else {
        // not registered, show register form
      }
    } else {
      // delete cookie
      await deleteCookie();
      return null
    }

  } catch (err) {
    await deleteCookie();
    console.error('error fetching profile', err);
    return null
  }

  if (profileExists) {
    redirect('/privilege')
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
  let payload: any
  try {
    const verified = await jwtVerify(token, secret)
    payload = verified.payload
  } catch {
    await deleteCookie()
    return null
  }

  const phone = payload.phone_no
  return (
    <RegisterForm phone={phone} token={token} />
  );
}
