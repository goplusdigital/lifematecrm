import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify, type JWTPayload } from 'jose'
import { pool } from '@/lib/db'
import { generateMemberCode } from '@/lib/helper'
import { signToken } from '@/lib/jwt'
import {
    isDateWithinWindow,
    isNowWithinWindow,
    parseWelcomePointSignupConfig,
    welcomeSignupTxId,
    WELCOME_POINT_SIGNUP_REF_TYPE,
    WELCOME_POINT_SIGNUP_SETTING_KEY,
} from '@/lib/welcomePoints'
const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

type RegisterRequestBody = {
    fullname?: unknown
    email?: unknown
    dob?: unknown
    phone_no?: unknown
    gender?: unknown
}

type IdRow = {
    id: string | number
}

type MemberRow = {
    id: string | number
    member_code: string
    created_at: string | Date
}

type SettingRow = {
    value: unknown
}

type MemberPointRow = {
    member_point: string | number
}

  
export const runtime = 'nodejs'

export async function POST(req: Request) {
    try {
        // ✅ 1. อ่าน token จาก cookie
        let token = (await cookies()).get('token')?.value
        const authHeader = req.headers.get('Authorization')
        if (!token && authHeader?.startsWith('Bearer ')) {
            token = authHeader.substring(7)
        }
        if (!token) {
            return NextResponse.json({ error: 'unauthorized', errorCode: 'UNAUTHORIZED' }, { status: 401 })
        }
        // ✅ 2. verify JWT
        let payload: JWTPayload
        try {
            const result = await jwtVerify(token, secret)
            payload = result.payload
        } catch {
            return NextResponse.json({ error: 'invalid token', errorCode: 'INVALID_TOKEN' }, { status: 401 })
        }

        // ✅ 3. ดึงข้อมูลจาก token
        const phone_no = typeof payload.phone_no === 'string' ? payload.phone_no : null

        if (!phone_no) {
            return NextResponse.json({ error: 'invalid payload', errorCode: 'INVALID_PAYLOAD' }, { status: 401 })
        }

        // ✅ 4. รับ body
        const body = (await req.json()) as RegisterRequestBody
        const member_name = typeof body.fullname === 'string' ? body.fullname.trim() : ''
        const member_email = typeof body.email === 'string' && body.email.trim() ? body.email.trim() : null
        const member_dob = typeof body.dob === 'string' && body.dob.trim() ? body.dob.trim() : null
        const body_phone_no = typeof body.phone_no === 'string' ? body.phone_no : null
        const member_gender = typeof body.gender === 'string' && body.gender.trim() ? body.gender.trim() : null

        if (!member_name || String(member_name).trim().length === 0) {
            return NextResponse.json({ error: 'fullname required', errorCode: 'FULLNAME_REQUIRED' }, { status: 400 })
        }

        if (phone_no !== body_phone_no) {
            return NextResponse.json({ error: 'phone number mismatch', errorCode: 'PHONE_MISMATCH' }, { status: 400 })
        }

        // 👉 validate เพิ่มเองได้

        // ✅ 5. save DB (+ welcome points for brand-new signup)
        const client = await pool.connect()
        let memberId: string | number | null = null
        let memberCode = ''
        try {
            await client.query('BEGIN')

            const existing = await client.query<IdRow>(
                `SELECT id FROM members WHERE member_phone = $1 LIMIT 1`,
                [phone_no]
            )

            // check email ซ้ำ
            if (member_email) {
                const existingEmail = await client.query<IdRow>(
                    `SELECT id FROM members WHERE member_email = $1 AND member_phone != $2 LIMIT 1`,
                    [member_email, phone_no]
                )
                if ((existingEmail.rowCount ?? 0) > 0) {
                    await client.query('ROLLBACK')
                    return NextResponse.json({ error: 'email already exists', errorCode: 'EMAIL_ALREADY_EXISTS' }, { status: 400 })
                }
            }

            const isNewSignup = (existing.rowCount ?? 0) === 0

            if (!isNewSignup) {
                await client.query(
                    `UPDATE members SET member_name = $1, member_email = $2, member_dob = $3, member_gender = $4, updated_at = NOW() WHERE member_phone = $5`,
                    [member_name, member_email, member_dob, member_gender, phone_no]
                )
            } else {
                const member_code = await generateMemberCode() // สร้าง member_code แบบสุ่ม
                await client.query(
                    `INSERT INTO members (member_code, member_phone, member_name, member_email, member_dob, member_gender) VALUES ($1, $2, $3, $4, $5, $6)`,
                    [member_code, phone_no, member_name, member_email, member_dob, member_gender]
                )
            }

            const memberResult = await client.query<MemberRow>(
                `SELECT id, member_code, created_at FROM members WHERE member_phone = $1 LIMIT 1`,
                [phone_no]
            )

            const member = memberResult.rows[0]
            if (!member) {
                throw new Error('member not found after registration')
            }
            memberId = member.id
            memberCode = member.member_code

            const welcomePointSavepoint = 'welcome_point_signup'
            await client.query(`SAVEPOINT ${welcomePointSavepoint}`)
            try {
                const settingRow = await client.query<SettingRow>(
                    `SELECT value FROM settings WHERE key = $1 LIMIT 1`,
                    [WELCOME_POINT_SIGNUP_SETTING_KEY]
                )
                const rawValue = settingRow?.rows?.[0]?.value ?? null
                const config = parseWelcomePointSignupConfig(rawValue)
                const now = new Date()
                const memberCreatedAt = member.created_at ? new Date(member.created_at) : now

                if (
                    config &&
                    config.enabled &&
                    config.points > 0 &&
                    isNowWithinWindow(now, config.startAt, config.endAt) &&
                    isDateWithinWindow(memberCreatedAt, config.startAt, config.endAt)
                ) {
                    const txId = welcomeSignupTxId(String(memberCode))

                    // Idempotent grant: insert log with deterministic txId; only increment member points if insert succeeds.
                    const insertLog = await client.query(
                        `INSERT INTO point_logs ("txId", type, amount, "remainingAmount", "expiresAt", "refType", "refId", reason, "memberCode", balance)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                         ON CONFLICT ("txId") DO NOTHING`,
                        [
                            txId,
                            'earn',
                            config.points,
                            config.points,
                            new Date(now.getTime() + config.expiresInDays * 24 * 60 * 60 * 1000),
                            WELCOME_POINT_SIGNUP_REF_TYPE,
                            String(memberCode),
                            isNewSignup ? 'welcome' : 'welcome_backfill',
                            String(memberCode),
                            0,
                        ]
                    )

                    if ((insertLog.rowCount ?? 0) > 0) {
                        const updated = await client.query<MemberPointRow>(
                            `UPDATE members
                             SET member_point = member_point + $1, updated_at = NOW()
                             WHERE member_code = $2
                             RETURNING member_point`,
                            [config.points, String(memberCode)]
                        )
                        const newBalance = Number(updated.rows?.[0]?.member_point ?? 0)
                        await client.query(
                            `UPDATE point_logs SET balance = $1 WHERE "txId" = $2`,
                            [newBalance, txId]
                        )
                    }
                }
                await client.query(`RELEASE SAVEPOINT ${welcomePointSavepoint}`)
            } catch (err) {
                await client.query(`ROLLBACK TO SAVEPOINT ${welcomePointSavepoint}`)
                await client.query(`RELEASE SAVEPOINT ${welcomePointSavepoint}`)
                // Registration must still succeed even if welcome points is misconfigured/unavailable.
                console.error('welcome points error', err)
            }

            await client.query('COMMIT')
        } catch (err) {
            await client.query('ROLLBACK')
            throw err
        } finally {
            client.release()
        }

        // ✅ 6. สร้าง JWT ใหม่ (ถ้าต้องการเปลี่ยน payload)
        const newPayload = {
            phone_no,
            member_id: memberId,
            member_code: memberCode,
        }

        const newToken = await signToken(newPayload)

        // ตั้ง cookie ใหม่
        const response = NextResponse.json({
            success: true,
            phone_no,
            member_id: memberId,
            member_code: memberCode,
            access_token: newToken,
        })
        response.cookies.set("token", newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: "/",
            maxAge: 60 * 60 * 24 * 180, // 180 days
        });

        return response;

    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'internal error', errorCode: 'INTERNAL_ERROR' }, { status: 500 })
    }
}
