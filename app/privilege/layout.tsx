"use server"

import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { redirect } from 'next/navigation'
import LoadFail from './fail'
import { AuthProvider } from './authcontext'



export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    const token = (await cookies()).get('token')?.value

    // check is registered
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/profile`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    })

    if (res.ok) {
        const data = await res.json();
        console.log('profile data', data);
        if (!data.exists) {
            await fetch('/api/logout', {
                method: 'POST',
            })
            redirect('/');
        }
    } else {
        return <LoadFail />
    }

    if (!token) return null

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    const phone = payload.phone_no
    return <AuthProvider user={{ phone }} token={token}>{children}</AuthProvider>
}
