import { pool } from '@/lib/db'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
/**
 * GET /api/orders/[orderNo]/claim-info
 * 
 * Check if an order is eligible for claiming points (guest-accessible)
 * 
 * Conditions:
 * - Order must NOT have memberCode
 * - Order must be less than 7 days old
 * - Order must not already be claimed in point_logs
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { orderNo: string } }
) {
    try {
        const { orderNo } = await params
        const token: any = (await cookies()).get('token')?.value
        let authToken: any = token;


        if (!orderNo) {
            return NextResponse.json(
                { error: 'เลขที่ใบเสร็จจำเป็นต้องระบุ' },
                { status: 400 }
            )
        }

        // Get order details
        const orderQuery = `
      SELECT 
        id,
        "orderNo",
                "receiptNo",
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
                { success: false, reason: 'not_found' },
                { status: 404 }
            )
        }

        const order = orderResult.rows[0]

        // Check 1: Must NOT have memberCode
        if (order.memberCode) {
            return NextResponse.json(
                {
                    success: false,
                    reason: 'already_linked',
                    message: 'ออเดอร์นี้ลิงค์กับสมาชิกแล้ว ไม่สามารถรับคะแนนผ่านระบบ claim ได้'
                },
                { status: 400 }
            )
        }

        // Check 2: Order must be less than 7 days old
        const createdDate = new Date(order.createdAt)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        if (createdDate < sevenDaysAgo) {
            return NextResponse.json(
                {
                    success: false,
                    reason: 'expired',
                    message: 'ออเดอร์นี้เกิน 7 วัน ไม่สามารถรับคะแนนได้'
                },
                { status: 400 }
            )
        }

        // Check 3: Order must not already be claimed
        const claimCheckQuery = `
      SELECT id FROM point_logs 
      WHERE "refType" = 'order' AND "refId" = $1
      LIMIT 1
    `

        const claimCheckResult = await pool.query(claimCheckQuery, [orderNo])

        if (claimCheckResult.rows.length > 0) {
            return NextResponse.json(
                {
                    success: false,
                    reason: 'already_claimed',
                    message: 'คะแนนจากออเดอร์นี้ได้มีการรับไปแล้ว'
                },
                { status: 400 }
            )
        }

        // if authToken is present, we can also check if the requester is the owner of the order (matching phone number) and include that info in the response
        let user = null
        let payload = null
        if (authToken) {
            try {
                const result = await jwtVerify(authToken || token, secret)
                payload = result.payload
                if (payload) {
                    const tokenPhone = payload.phone_no as string
                    if (tokenPhone) {
                        user = await pool.query(
                            `SELECT member_code, member_name, member_phone FROM members WHERE member_phone = $1 LIMIT 1`,
                            [tokenPhone]
                        ).then(res => res.rows[0] || null)
                    }
                }
            } catch {
                user = null
            }
        }



        // All checks passed - order is eligible
        return NextResponse.json({
            success: true,
            data: {
                order_no: order.orderNo,
                receipt_no: order.receiptNo,
                customer_phone: order.customerPhone,
                customer_name: order.customerName,
                points_to_claim: Number(order.pointEarned),
                order_date: order.createdAt,
                user,
                days_remaining: Math.ceil((createdDate.getTime() + 7 * 24 * 60 * 60 * 1000 - new Date().getTime()) / (24 * 60 * 60 * 1000))
            }
        })
    } catch (error) {
        console.error('Error checking claim info:', error)
        return NextResponse.json(
            { error: 'ไม่สามารถตรวจสอบได้' },
            { status: 500 }
        )
    }
}
