import { pool } from '@/lib/db'
import { NextResponse, NextRequest } from 'next/server'

interface OrderItem {
  name: string
  quantity: number
  unit_price: number
}

interface CreateOrderRequest {
  order_no: string
  member_code?: string
  member_phone?: string
  customer_name?: string
  items: OrderItem[]
  subtotal: number
  tax?: number
  discount_amount?: number
  total_amount: number
  points_earned: number
  payment_method?: string
  payment_status?: string
  notes?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json()

    // Validate required fields
    if (!body.order_no || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'order_no and items are required' },
        { status: 400 }
      )
    }

    // Calculate item totals
    const itemsWithTotals = body.items.map(item => ({
      ...item,
      total: item.quantity * item.unit_price
    }))

    // Prepare query
    const query = `
      INSERT INTO orders (
        order_no,
        member_code,
        member_phone,
        customer_name,
        items,
        subtotal,
        tax,
        discount_amount,
        total_amount,
        points_earned,
        payment_method,
        payment_status,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `

    const values = [
      body.order_no,
      body.member_code || null,
      body.member_phone || null,
      body.customer_name || null,
      JSON.stringify(itemsWithTotals),
      body.subtotal,
      body.tax || 0,
      body.discount_amount || 0,
      body.total_amount,
      body.points_earned,
      body.payment_method || null,
      body.payment_status || 'completed',
      body.notes || null
    ]

    const result = await pool.query(query, values)

    // If order has member_code, update member points and create points history
    if (body.member_code && body.points_earned > 0) {
      // Update member points
      await pool.query(
        `UPDATE members SET member_point = member_point + $1 WHERE member_code = $2`,
        [body.points_earned, body.member_code]
      )

      // Create points history record
      await pool.query(
        `INSERT INTO member_points_history (member_code, order_no, points_delta, points_type, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [body.member_code, body.order_no, body.points_earned, 'purchase', `Order ${body.order_no}`]
      )
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

// GET list of orders (with pagination)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const query = `
      SELECT 
        id,
        order_no,
        member_code,
        member_phone,
        customer_name,
        total_amount,
        points_earned,
        payment_status,
        created_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `

    const result = await pool.query(query, [limit, offset])

    // Get total count
    const countResult = await pool.query('SELECT COUNT(*) FROM orders')
    const total = parseInt(countResult.rows[0].count)

    return NextResponse.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
