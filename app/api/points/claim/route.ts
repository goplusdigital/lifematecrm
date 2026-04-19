import { pool } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { verifyToken } from '@/lib/jwt'

const normalizePhone = (phone?: string | null) => {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('66')) return `+${digits}`
  if (digits.startsWith('0')) return `+66${digits.slice(1)}`
  return `+${digits}`
}

/**
 * POST /api/points/claim
 * 
 * Claim points for an order without memberCode
 * 
 * Request body:
 * {
 *   "orderNo": "W6PJYJ-2604003-000028",
 *   "phone_no": "0805649964" (or "+66805649964")
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderNo, phone_no } = body

    if (!orderNo) {
      return NextResponse.json(
        { error: 'orderNo จำเป็นต้องระบุ' },
        { status: 400 }
      )
    }

    let phoneFromToken = ''
    const token = request.cookies.get('token')?.value
    if (token) {
      const payload = await verifyToken(token)
      phoneFromToken = normalizePhone((payload?.phone_no as string | undefined) || null)
    }

    const normalizedPhone = normalizePhone((phone_no as string | undefined) || null)
    const claimPhone = phoneFromToken

    if (!claimPhone) {
      return NextResponse.json(
        { error: 'ต้องยืนยัน OTP ก่อนรับคะแนน' },
        { status: 400 }
      )
    }

    if (normalizedPhone && phoneFromToken && normalizedPhone !== phoneFromToken) {
      return NextResponse.json(
        { error: 'เบอร์โทรศัพท์ไม่ตรงกับ session ที่ยืนยัน OTP' },
        { status: 400 }
      )
    }

    // Get order details
    const orderQuery = `
      SELECT 
        id,
        "orderNo",
        "memberCode",
        "customerPhone",
        "customerName",
        "totalAmount",
        "pointEarned",
        "createdAt"
      FROM orders
      WHERE "orderNo" = $1
    `

    const orderResult = await pool.query(orderQuery, [orderNo])

    if (orderResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'ไม่พบออเดอร์' },
        { status: 404 }
      )
    }

    const order = orderResult.rows[0]

    // Validate eligibility
    if (order.memberCode) {
      return NextResponse.json(
        { error: 'ออเดอร์นี้ลิงค์กับสมาชิกแล้ว' },
        { status: 400 }
      )
    }

    // Check 7 days expiry
    const createdDate = new Date(order.createdAt)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    if (createdDate < sevenDaysAgo) {
      return NextResponse.json(
        { error: 'ระยะเวลารับคะแนนหมดแล้ว' },
        { status: 400 }
      )
    }

    // Check already claimed
    const claimCheckQuery = `
      SELECT id FROM point_logs 
      WHERE "refType" = 'order' AND "refId" = $1
      LIMIT 1
    `

    const claimCheckResult = await pool.query(claimCheckQuery, [orderNo])

    if (claimCheckResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'ได้รับคะแนนจากออเดอร์นี้แล้ว' },
        { status: 400 }
      )
    }

    // Find member by phone number
    const memberQuery = `
      SELECT 
        member_code,
        member_name,
        member_phone,
        member_point
      FROM members
      WHERE member_phone = $1
      LIMIT 1
    `

    const memberByPhone = await pool.query(memberQuery, [claimPhone])

    if (memberByPhone.rows.length === 0) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลสมาชิก กรุณาลงทะเบียนก่อน' },
        { status: 404 }
      )
    }

    const member = memberByPhone.rows[0]
    const pointsToEarn = Number(order.pointEarned) || 0
    const newBalance = Number(member.member_point) + pointsToEarn

    // Start transaction-like operations
    try {
      // 1. Create point_logs entry
      const txId = uuidv4()
      const expiresAt = new Date()
      expiresAt.setFullYear(expiresAt.getFullYear() + 1) // 1 year expiry

      const pointLogQuery = `
        INSERT INTO point_logs 
        ("txId", "type", amount, "remainingAmount", "expiresAt", "refType", "refId", reason, "createdAt", "memberCode", balance)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `

      await pool.query(pointLogQuery, [
        txId,
        'earn',
        pointsToEarn,
        pointsToEarn,
        expiresAt,
        'order',
        orderNo,
        'Claim from order',
        new Date(),
        member.member_code,
        newBalance
      ])

      // 2. Update member_point
      const updateMemberQuery = `
        UPDATE members
        SET member_point = member_point + $1
        WHERE member_code = $2
      `

      await pool.query(updateMemberQuery, [pointsToEarn, member.member_code])

      return NextResponse.json({
        success: true,
        data: {
          member_code: member.member_code,
          member_name: member.member_name,
          points_earned: pointsToEarn,
          new_balance: newBalance,
          message: `รับคะแนนสำเร็จ ${pointsToEarn} คะแนน`
        }
      })
    } catch (txError) {
      console.error('Transaction error:', txError)
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error claiming points:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}
