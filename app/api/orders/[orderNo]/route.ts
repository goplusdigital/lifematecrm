
import { pool } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const normalizePhone = (phone?: string | null) => {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('66')) return `+${digits}`
  if (digits.startsWith('0')) return `+66${digits.slice(1)}`
  return `+${digits}`
}

export async function GET(
  request: NextRequest,
  { params }: { params: { orderNo: string } }
) {
  try {
    const { orderNo } = await params

    if (!orderNo) {
      return NextResponse.json(
        { error: 'เลขที่ใบเสร็จจำเป็นต้องระบุ' },
        { status: 400 }
      )
    }

    // Get order details from orders table
    const orderQuery = `
      SELECT 
        id,
        "orderNo",
        "memberCode",
        "customerPhone",
        "customerName",
        "totalAmount",
        "totalTax",
        "totalDiscount",
        status,
        "pointEarned",
        "createdAt",
        "updatedAt",
        "receiptNo"
      FROM orders
      WHERE "orderNo" = $1
    `

    const orderResult = await pool.query(orderQuery, [orderNo])

    if (orderResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'ไม่พบใบเสร็จ' },
        { status: 404 }
      )
    }

    const order = orderResult.rows[0]

    // Owner check: only the owner can view the order, otherwise return 404.
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'ไม่พบใบเสร็จ' }, { status: 404 })
    }

    let tokenPhone = ''
    try {
      const { verifyToken } = await import('@/lib/jwt')
      const payload = await verifyToken(token)
      tokenPhone = normalizePhone((payload?.phone_no as string | undefined) || null)
    } catch {
      tokenPhone = ''
    }

    if (!tokenPhone) {
      return NextResponse.json({ error: 'ไม่พบใบเสร็จ' }, { status: 404 })
    }

    let isOwner = false
    const orderPhone = normalizePhone(order.customerPhone as string | null)
    if (orderPhone && tokenPhone === orderPhone) {
      isOwner = true
    }

    if (!isOwner && order.memberCode) {
      const ownerResult = await pool.query(
        `SELECT member_phone FROM members WHERE member_code = $1 LIMIT 1`,
        [order.memberCode]
      )
      if (ownerResult.rows.length > 0) {
        const memberPhone = normalizePhone(ownerResult.rows[0].member_phone as string | null)
        if (memberPhone && tokenPhone === memberPhone) {
          isOwner = true
        }
      }
    }

    if (!isOwner) {
      return NextResponse.json({ error: 'ไม่พบใบเสร็จ' }, { status: 404 })
    }

    // Get order items
    const itemsQuery = `
      SELECT 
        id,
        "displayName",
        "productName",
        "variantName",
        quantity,
        price,
        "taxAmount",
        "subTotal",
        total
      FROM order_items
      WHERE "orderId" = $1
      ORDER BY id ASC
    `

    const itemsResult = await pool.query(itemsQuery, [order.id])
    const items = itemsResult.rows.map(item => ({
      name: item.displayName || item.productName,
      variantName: item.variantName,
      quantity: item.quantity,
      unit_price: Number(item.price),
      tax_amount: Number(item.taxAmount),
      subtotal: Number(item.subTotal),
      total: Number(item.total)
    }))

    const pointsEarned = Number(order.pointEarned) || 0

    // Get member details if memberCode exists
    let memberDetails = null
    if (order.memberCode) {
      const memberQuery = `
        SELECT 
          member_code,
          member_name,
          member_phone,
          member_point,
          member_email
        FROM members
        WHERE member_code = $1
      `
      const memberResult = await pool.query(memberQuery, [order.memberCode])
      if (memberResult.rows.length > 0) {
        memberDetails = memberResult.rows[0]
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        order: {
          order_no: order.orderNo,
          member_code: order.memberCode,
          member_phone: order.customerPhone,
          customer_name: order.customerName,
          items,
          subtotal: Number(order.totalAmount) - Number(order.totalDiscount) - Number(order.totalTax),
          tax: Number(order.totalTax),
          total_amount: Number(order.totalAmount),
          points_earned: pointsEarned,
          discount_amount: Number(order.totalDiscount),
          payment_status: order.status,
          receipt_no: order.receiptNo,
          created_at: order.createdAt,
          updated_at: order.updatedAt
        },
        member: memberDetails
      }
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'ไม่สามารถดึงข้อมูลใบเสร็จ' },
      { status: 500 }
    )
  }
}
