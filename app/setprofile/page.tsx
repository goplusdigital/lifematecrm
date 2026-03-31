"use server"

import RegisterForm from "./register"
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { redirect } from 'next/navigation'


export default async function Register() {
  const token = (await cookies()).get('token')?.value
  console.log('token', token);

  // check is registered
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/profile`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  })

  if(res.ok) {
    const data = await res.json();
    console.log('profile data', data);
    if(data.exists) {
      redirect('/privilege')
    } else {
      console.log('not registered, show register form');
      // not registered, show register form
    }
  } else {
    console.log('failed to fetch profile', await res.text());
  }

  if (!token) return null

  const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
  const { payload } = await jwtVerify(token, secret)

  const phone = payload.phone_no
  return (
    <RegisterForm phone={phone} token={token} />
  );
}
