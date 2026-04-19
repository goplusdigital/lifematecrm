/**
 * Test Data Generator for Orders
 * 
 * Note: Run the SQL schema first (lib/db-schema.sql)
 * Then you can use this file to seed test data
 */

import { createOrder } from '@/lib/order'

const testOrders = [
  {
    order_no: 'W6PJYJ-2604003-000033',
    member_code: '12345678',
    member_phone: '0812345678',
    customer_name: 'นายประเทศ สุขภาพ',
    items: [
      { name: 'ผลิตภัณฑ์หลักร่างกาย', quantity: 2, unit_price: 1500 },
      { name: 'ผลิตภัณฑ์บำรุงเหงือก', quantity: 1, unit_price: 800 },
      { name: 'วิตามิน C 1000mg', quantity: 1, unit_price: 350 }
    ],
    subtotal: 4150,
    tax: 290.5,
    discount_amount: 0,
    total_amount: 4440.5,
    points_earned: 44,
    payment_method: 'Cash',
    payment_status: 'completed',
    notes: 'Thank you for your purchase'
  },
  {
    order_no: 'W6PJYJ-2604003-000034',
    member_code: '87654321',
    member_phone: '0887654321',
    customer_name: 'นางสาวดร.พัชรา วัฒนสุข',
    items: [
      { name: 'ผลิตภัณฑ์หลักร่างกาย', quantity: 1, unit_price: 1500 },
      { name: 'ครีมบำรุงหน้า', quantity: 2, unit_price: 600 }
    ],
    subtotal: 2700,
    tax: 189,
    discount_amount: 100,
    total_amount: 2789,
    points_earned: 28,
    payment_method: 'Credit Card',
    payment_status: 'completed',
    notes: null
  }
]

/**
 * Seed test data to database
 * Usage: node --loader ts-node/esm scripts/seed-orders.ts
 */
async function seedTestData() {
  try {
    console.log('🌱 Starting to seed test data...')

    for (const order of testOrders) {
      try {
        console.log(`Creating order: ${order.order_no}`)
        const result = await createOrder(order)
        console.log(`✅ Order created successfully: ${result.order_no}`)
      } catch (error) {
        console.error(`❌ Failed to create order ${order.order_no}:`, error)
      }
    }

    console.log('🎉 Test data seeding completed!')
  } catch (error) {
    console.error('Error seeding data:', error)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTestData().then(() => process.exit(0))
}

export { seedTestData, testOrders }
