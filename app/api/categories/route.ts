import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export const runtime = 'nodejs'

type CategoryRow = {
  id: number
  name: string
  itemCount: number
}

export async function GET() {
  try {
    const result = await pool.query(
      `
      SELECT
        categories."id",
        categories."name",
        COUNT(product_variants."id")::int AS "itemCount"
      FROM categories
      JOIN products
        ON products."categoryId" = categories."id"
       AND products.slug IS NOT NULL
       AND products.slug <> ''
      JOIN product_variants
        ON product_variants."productId" = products."id"
      GROUP BY categories."id", categories."name"
      ORDER BY categories."name" ASC
      `
    )

    const rows = result.rows as CategoryRow[]
    const totalCount = rows.reduce((sum, row) => sum + Number(row.itemCount || 0), 0)

    return NextResponse.json({
      success: true,
      data: rows,
      meta: {
        totalCount,
      },
    })
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}