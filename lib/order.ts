import { pool } from '@/lib/db'

export interface OrderItem {
  name: string
  quantity: number
  unit_price: number
}

export interface CreateOrderInput {
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

/**
 * Create a new order and update member points
 */
export async function createOrder(orderData: CreateOrderInput) {
  try {
    const itemsWithTotals = orderData.items.map(item => ({
      ...item,
      total: item.quantity * item.unit_price
    }))

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
      orderData.order_no,
      orderData.member_code || null,
      orderData.member_phone || null,
      orderData.customer_name || null,
      JSON.stringify(itemsWithTotals),
      orderData.subtotal,
      orderData.tax || 0,
      orderData.discount_amount || 0,
      orderData.total_amount,
      orderData.points_earned,
      orderData.payment_method || null,
      orderData.payment_status || 'completed',
      orderData.notes || null
    ]

    const result = await pool.query(query, values)
    const order = result.rows[0]

    // Update member points if applicable
    if (orderData.member_code && orderData.points_earned > 0) {
      await pool.query(
        `UPDATE members SET member_point = member_point + $1 WHERE member_code = $2`,
        [orderData.points_earned, orderData.member_code]
      )

      // Record points history
      await pool.query(
        `INSERT INTO member_points_history (member_code, order_no, points_delta, points_type, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderData.member_code, orderData.order_no, orderData.points_earned, 'purchase', `Order ${orderData.order_no}`]
      )
    }

    return order
  } catch (error) {
    console.error('Error creating order:', error)
    throw error
  }
}

/**
 * Get order by order number
 */
export async function getOrderByNumber(orderNo: string) {
  try {
    const query = `
      SELECT 
        id,
        order_no,
        member_code,
        member_phone,
        customer_name,
        items,
        subtotal,
        tax,
        total_amount,
        points_earned,
        discount_amount,
        payment_method,
        payment_status,
        notes,
        created_at,
        updated_at
      FROM orders
      WHERE order_no = $1
    `

    const result = await pool.query(query, [orderNo])
    return result.rows[0] || null
  } catch (error) {
    console.error('Error fetching order:', error)
    throw error
  }
}

/**
 * Get member points history
 */
export async function getMemberPointsHistory(memberCode: string, limit: number = 50) {
  try {
    const query = `
      SELECT 
        id,
        member_code,
        order_no,
        points_delta,
        points_type,
        description,
        created_at
      FROM member_points_history
      WHERE member_code = $1
      ORDER BY created_at DESC
      LIMIT $2
    `

    const result = await pool.query(query, [memberCode, limit])
    return result.rows
  } catch (error) {
    console.error('Error fetching points history:', error)
    throw error
  }
}

/**
 * Calculate points based on amount (example: 1 point per 100 THB)
 */
export function calculatePoints(amount: number, pointsPerBaht: number = 0.01): number {
  return Math.floor(amount * pointsPerBaht)
}
