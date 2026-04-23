"use server"

import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { redirect } from 'next/navigation'
import LoadFail from '../../privilege/fail'
import { AuthProvider } from '../../privilege/authcontext'
import Menubar from '../../privilege/menubar'
import { getServerBaseUrl } from '@/lib/server-base-url'


export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const token = (await cookies()).get('token')?.value
    let data : any = {}
    const baseUrl = await getServerBaseUrl()
    // check is registered
    const res = await fetch(`${baseUrl}/api/profile`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    })

    if (res.ok) {
         data = await res.json();
        console.log('profile data', data);
        if (!data.exists) {
            await fetch(`${baseUrl}/api/logout`, {
                method: 'POST',
            })
            redirect('/');
        }
    } else {
        return <LoadFail />
    }

    if (!token) return null

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    let payload: any
    try {
        const verified = await jwtVerify(token, secret)
        payload = verified.payload
    } catch {
        const cookieStore = await cookies()
        cookieStore.delete('token')
        redirect('/')
    }
    let user = { ...data, phone_no: payload.phone_no }
    const setUser = (userData: any) => {
        user = { ...user, ...userData }
    }
    

    return <AuthProvider user={user} token={token}>
        <div className="flex flex-col h-dvh w-full overflow-hidden bg-[#E8E8E8] justify-start vertical-top">
            <main className="flex-1 overflow-y-auto text-gray-600 font-prompt text-xs leading-relaxed">
                <div className="space-y-4">
                    {children}
                </div>
            </main>
            <Menubar />
        </div>
    </AuthProvider>
}
