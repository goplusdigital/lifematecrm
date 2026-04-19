'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import ContentLoader from 'react-content-loader'

type SessionUser = {
    member_code: string
    member_name: string
    member_phone: string
}

interface ClaimInfo {
    order_no: string
    receipt_no?: string | null
    customer_phone: string | null
    customer_name: string | null
    points_to_claim: number
    order_date: string
    user?: SessionUser | null
    days_remaining: number
}

interface ClaimResult {
    member_code: string
    member_name: string
    points_earned: number
    new_balance: number
    message: string
}

function LoadingSpinner() {
    return (
        <div className="w-full max-w-full bg-white rounded-lg p-6">
            <ContentLoader
                speed={2}
                width="100%"
                height={400}
                backgroundColor="#f3f3f3"
                foregroundColor="#ecebeb"
            >
                <rect x="0" y="0" rx="4" ry="4" width="100%" height="40" />
                <rect x="0" y="60" rx="4" ry="4" width="100%" height="20" />
                <rect x="0" y="90" rx="4" ry="4" width="100%" height="20" />
                <rect x="0" y="150" rx="4" ry="4" width="100%" height="200" />
                <rect x="0" y="360" rx="4" ry="4" width="100%" height="40" />
            </ContentLoader>
        </div>
    )
}

const normalizePhone = (phone?: string | null) => {
    if (!phone) return ''
    const digits = phone.replace(/\D/g, '')
    if (!digits) return ''
    if (digits.startsWith('66')) return `+${digits}`
    if (digits.startsWith('0')) return `+66${digits.slice(1)}`
    return `+${digits}`
}

export default function ClaimPointsPage() {
    const params = useParams()
    const orderNo = params?.orderNo as string

    const [claimInfo, setClaimInfo] = useState<ClaimInfo | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [sessionUser, setSessionUser] = useState<SessionUser | null>(null)
    const [phoneInput, setPhoneInput] = useState('')
    const [refCode, setRefCode] = useState('')
    const [otpInput, setOtpInput] = useState('')
    const [resendCooldown, setResendCooldown] = useState(0)
    const [otpExpiresIn, setOtpExpiresIn] = useState(0)
    const [isLockedDown, setIsLockedDown] = useState(false)
    const [otpSending, setOtpSending] = useState(false)
    const [otpChecking, setOtpChecking] = useState(false)
    const [needsRegister, setNeedsRegister] = useState(false)

    const [fullname, setFullname] = useState('')
    const [email, setEmail] = useState('')
    const [dob, setDob] = useState('')
    const [gender, setGender] = useState<'male' | 'female' | 'no-specific'>('no-specific')
    const [registering, setRegistering] = useState(false)

    const [claiming, setClaiming] = useState(false)
    const [claimSuccess, setClaimSuccess] = useState<ClaimResult | null>(null)

    useEffect(() => {
        if (resendCooldown <= 0 && otpExpiresIn <= 0) return

        const timer = setInterval(() => {
            setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0))
            setOtpExpiresIn((prev) => (prev > 0 ? prev - 1 : 0))
        }, 1000)

        return () => clearInterval(timer)
    }, [resendCooldown, otpExpiresIn])

    useEffect(() => {
        if (resendCooldown === 0 && isLockedDown) {
            setIsLockedDown(false)
            setError(null)
        }
    }, [resendCooldown, isLockedDown])

    const formatSeconds = (seconds: number) => {
        const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
        const ss = String(seconds % 60).padStart(2, '0')
        return `${mm}:${ss}`
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date)
    }

    const setRateLimitMessage = (retryAfterSec: number, fallbackMessage?: string) => {
        const normalizedRetry = retryAfterSec > 0 ? retryAfterSec : 60
        setResendCooldown(normalizedRetry)

        const lockdown = normalizedRetry > 60
        setIsLockedDown(lockdown)

        // For rate-limit/lockdown, show feedback via button countdown only.
        setError(null)
    }

    useEffect(() => {
        const fetchClaimInfo = async () => {
            try {
                setLoading(true)
                setError(null)

                const response = await fetch(`/api/orders/${orderNo}/claim-info`)
                const result = await response.json()

                if (!response.ok) {
                    setError(result.message || result.error || 'ไม่สามารถดึงข้อมูลได้')
                    setClaimInfo(null)
                    return
                }

                if (result.success && result.data) {
                    setClaimInfo(result.data)
                    setSessionUser(result.data.user || null)
                    setPhoneInput(result.data.user?.member_phone || result.data.customer_phone || '')
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
            } finally {
                setLoading(false)
            }
        }

        if (orderNo) {
            fetchClaimInfo()
        }
    }, [orderNo])

    const runClaim = async () => {
        try {
            setClaiming(true)
            setError(null)

            const response = await fetch('/api/points/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderNo }),
            })

            const result = await response.json()

            if (!response.ok) {
                setError(result.error || 'เกิดข้อผิดพลาดขณะรับคะแนน')
                return false
            }

            setClaimSuccess(result.data)
            return true
        } catch (err) {
            setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดขณะรับคะแนน')
            return false
        } finally {
            setClaiming(false)
        }
    }

    const handleSendOtp = async () => {
        const normalized = normalizePhone(phoneInput)
        if (!normalized) {
            setError('กรุณาใส่หมายเลขโทรศัพท์ให้ถูกต้อง')
            return
        }

        try {
            setOtpSending(true)
            setError(null)

            const response = await fetch('/api/otp/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone_no: normalized }),
            })

            const result = await response.json()

            if (!response.ok) {
                const retryAfter = Number(result.retry_after_sec || 0)
                const rawMessage = String(result.error || '').toLowerCase()

                if (response.status === 429 || rawMessage.includes('too many')) {
                    setRateLimitMessage(retryAfter)
                } else {
                    setError(result.error || 'ส่ง OTP ไม่สำเร็จ')
                }
                return
            }

            setRefCode(result.ref_code)
            setOtpInput('')
            setNeedsRegister(false)
            setIsLockedDown(false)
            setResendCooldown(60)
            setOtpExpiresIn(5 * 60)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'ส่ง OTP ไม่สำเร็จ')
        } finally {
            setOtpSending(false)
        }
    }

    const handleResendOtp = async () => {
        if (resendCooldown > 0 || otpSending) return
        await handleSendOtp()
    }

    const handleVerifyOtp = async () => {
        if (otpExpiresIn <= 0) {
            setError('OTP หมดอายุแล้ว กรุณาขอ OTP ใหม่')
            return
        }

        if (!/^\d{6}$/.test(otpInput)) {
            setError('กรุณากรอกรหัส OTP 6 หลัก (ตัวเลขเท่านั้น)')
            return
        }

        try {
            setOtpChecking(true)
            setError(null)

            const normalized = normalizePhone(phoneInput)
            const verifyResponse = await fetch('/api/otp/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone_no: normalized,
                    ref_code: refCode,
                    otp: otpInput,
                }),
            })

            const verifyResult = await verifyResponse.json()

            if (!verifyResponse.ok) {
                setError(verifyResult.error || 'OTP ไม่ถูกต้อง')
                return
            }

            const profileResponse = await fetch('/api/profile', { method: 'GET' })
            const profileResult = await profileResponse.json()

            if (profileResponse.ok && profileResult.exists) {
                const user: SessionUser = {
                    member_code: profileResult.member_code,
                    member_name: profileResult.fullname || '-',
                    member_phone: normalized,
                }
                setSessionUser(user)
                setNeedsRegister(false)
                await runClaim()
                return
            }

            setNeedsRegister(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'ตรวจสอบ OTP ไม่สำเร็จ')
        } finally {
            setOtpChecking(false)
        }
    }

    const handleRegisterAndClaim = async () => {
        if (!fullname.trim()) {
            setError('กรุณากรอกชื่อ-สกุล')
            return
        }

        try {
            setRegistering(true)
            setError(null)

            const normalized = normalizePhone(phoneInput)
            const registerResponse = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullname: fullname.trim(),
                    email: email.trim() || null,
                    dob: dob || null,
                    gender,
                    phone_no: normalized,
                }),
            })

            const registerResult = await registerResponse.json()
            if (!registerResponse.ok) {
                setError(registerResult.error || 'สมัครสมาชิกไม่สำเร็จ')
                return
            }

            setSessionUser({
                member_code: registerResult.member_code || '-',
                member_name: fullname.trim(),
                member_phone: normalized,
            })

            await runClaim()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'สมัครสมาชิกไม่สำเร็จ')
        } finally {
            setRegistering(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <LoadingSpinner />
            </div>
        )
    }

    if (error && !claimInfo) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="w-full max-w-full bg-white rounded-lg p-8 shadow-md">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2 font-prompt">ไม่สามารถรับคะแนนได้</h2>
                        <p className="text-gray-600 mb-6 font-prompt text-lg">{error}</p>
                        <a
                            href="/"
                            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-prompt hover:bg-blue-700 transition"
                        >
                            กลับหน้าแรก
                        </a>
                    </div>
                </div>
            </div>
        )
    }

    if (claimSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 font-prompt">
                <div className="w-full max-w-full mx-auto">
                    <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-t-2xl p-6 text-white text-center">
                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden border-4 border-green-500">
                            <Image src="/logo.jpg" alt="Logo" width={48} height={48} className="w-full h-full object-cover" />
                        </div>
                        <h1 className="text-2xl font-bold">ยืนยันการรับคะแนนสำเร็จ</h1>
                    </div>

                    <div className="bg-white shadow-lg rounded-b-2xl p-6 space-y-6">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-gray-800 mb-2">{claimSuccess.message}</h2>
                        </div>

                        <div className="bg-green-50 rounded-lg p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">ชื่อสมาชิก</span>
                                <span className="font-bold text-gray-800">{claimSuccess.member_name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">รหัสสมาชิก</span>
                                <span className="font-bold text-gray-800">{claimSuccess.member_code}</span>
                            </div>
                            <div className="border-t border-green-200 pt-4 flex items-center justify-between">
                                <span className="text-gray-600">คะแนนที่ได้รับ</span>
                                <span className="text-2xl font-bold text-green-600">+{claimSuccess.points_earned}</span>
                            </div>
                            <div className="bg-white border-2 border-green-200 rounded p-3 flex items-center justify-between">
                                <span className="text-gray-600">คะแนนรวมทั้งสิ้น</span>
                                <span className="text-3xl font-bold text-green-700">{claimSuccess.new_balance}</span>
                            </div>
                        </div>

                        <a
                            href="/"
                            className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition text-center"
                        >
                            กลับหน้าแรก
                        </a>
                    </div>
                </div>
            </div>
        )
    }

    if (!claimInfo) return null

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 font-prompt">
            <div className="w-full max-w-full mx-auto">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl p-6 text-white text-center">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden border-4 border-blue-500">
                        <Image src="/logo.jpg" alt="Logo" width={48} height={48} className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-2xl font-bold">รับคะแนนจากการซื้อ</h1>
                    <p className="text-blue-100 mt-1">Lifematewellness</p>
                </div>

                <div className="bg-white shadow-lg rounded-b-2xl p-6 space-y-6">
                    <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-gray-500 text-sm">เลขที่{claimInfo.receipt_no ? `ใบกำกับภาษีอย่างย่อ` : 'ใบเสร็จ'}</p>
                                <p className="text-xs font-bold text-gray-800">{claimInfo.receipt_no || claimInfo.order_no}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-500 text-sm">วันที่</p>
                                <p className="text-xs text-gray-800">{formatDate(claimInfo.order_date)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-6 border-2 border-amber-200 text-center">
                        <p className="text-gray-600 text-sm mb-2">คะแนนที่จะได้รับ</p>
                        <p className="text-5xl font-bold text-amber-600 mb-2">{claimInfo.points_to_claim}</p>
                        <p className="text-gray-600 text-sm">คะแนน</p>
                        <div className="mt-4 text-xs text-gray-500">เหลือเวลา {claimInfo.days_remaining} วัน</div>
                    </div>

                    {error && !isLockedDown && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                            <p className="text-red-700 font-bold">เกิดข้อผิดพลาด</p>
                            <p className="text-red-600 text-sm mt-1">{error}</p>
                        </div>
                    )}

                    {sessionUser ? (
                        <div className="space-y-4">
                            <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-600">
                                <p className="text-gray-500 text-sm mb-3 font-semibold">ข้อมูลสมาชิก</p>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">ชื่อ</span>
                                        <span className="font-bold text-gray-800">{sessionUser.member_name}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">รหัสสมาชิก</span>
                                        <span className="font-bold text-gray-800">{sessionUser.member_code}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">เบอร์โทร</span>
                                        <span className="font-bold text-gray-800">{sessionUser.member_phone}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={runClaim}
                                disabled={claiming}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {claiming ? 'กำลังรับคะแนน...' : 'รับคะแนน'}
                            </button>
                        </div>
                    ) : !refCode ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">หมายเลขโทรศัพท์</label>
                                <input
                                    type="tel"
                                    placeholder="กรุณาใส่หมายเลขโทรศัพท์เพื่อรับ OTP"
                                    value={phoneInput}
                                    onChange={(e) => {
                                        setPhoneInput(e.target.value)
                                        setError(null)
                                    }}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    disabled={otpSending}
                                />
                            </div>
                            <button
                                onClick={handleSendOtp}
                                disabled={otpSending || !phoneInput.trim() || resendCooldown > 0}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50"
                            >
                                {otpSending ? 'กำลังส่ง OTP...' : resendCooldown > 0 ? `ส่งใหม่ได้ใน ${formatSeconds(resendCooldown)}` : 'ส่ง OTP เพื่อรับคะแนน'}
                            </button>

                        </div>
                    ) : needsRegister ? (
                        <div className="space-y-4">
                            <p className="text-gray-700 font-semibold">ยังไม่เป็นสมาชิก กรุณากรอกข้อมูลสมัครสมาชิก</p>

                            <input
                                type="text"
                                placeholder="ชื่อ-สกุล *"
                                value={fullname}
                                onChange={(e) => setFullname(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                            <input
                                type="email"
                                placeholder="อีเมล์ (ไม่บังคับ)"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                            <input
                                type="date"
                                value={dob}
                                onChange={(e) => setDob(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />

                            <div>
                                <p className="text-gray-700 font-semibold mb-2">เพศ</p>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2">
                                        <input type="radio" name="gender" value="male" checked={gender === 'male'} onChange={() => setGender('male')} />
                                        ชาย
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="radio" name="gender" value="female" checked={gender === 'female'} onChange={() => setGender('female')} />
                                        หญิง
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="radio" name="gender" value="no-specific" checked={gender === 'no-specific'} onChange={() => setGender('no-specific')} />
                                        ไม่ระบุ
                                    </label>
                                </div>
                            </div>

                            <button
                                onClick={handleRegisterAndClaim}
                                disabled={registering || !fullname.trim()}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50"
                            >
                                {registering ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิกและรับคะแนน'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600 text-sm text-gray-700">
                                ส่ง OTP ไปที่ {normalizePhone(phoneInput)} (Ref: {refCode})
                            </div>



                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                placeholder="กรอกรหัส OTP 6 หลัก"
                                value={otpInput}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                                    setOtpInput(value)
                                    setError(null)
                                }}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-center text-xl tracking-[0.3em]"
                                disabled={otpChecking || otpExpiresIn <= 0}
                            />

                            <div className="flex items-center justify-between text-sm">
                                <span className={otpExpiresIn > 0 ? 'text-gray-600' : 'text-red-600 font-semibold'}>
                                    {/* OTP หมดอายุใน {formatSeconds(otpExpiresIn)} */}
                                </span>
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={otpSending || resendCooldown > 0}
                                    className="text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed font-semibold"
                                >
                                    {resendCooldown > 0 ? `ขอ OTP ใหม่ได้ใน ${formatSeconds(resendCooldown)}` : 'ขอ OTP ใหม่'}
                                </button>
                            </div>

                            <button
                                onClick={handleVerifyOtp}
                                disabled={otpChecking || otpInput.length !== 6 || otpExpiresIn <= 0}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50"
                            >
                                {otpChecking ? 'กำลังตรวจสอบ OTP...' : 'ยืนยัน OTP'}
                            </button>
                        </div>
                    )}


                </div>
            </div>
        </div>
    )
}
