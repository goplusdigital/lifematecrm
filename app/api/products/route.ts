import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const runtime = 'nodejs'

type ProductRow = {
  id: number
  productId: number
  categoryId: number | null
  sku: string
  name: string
  productName: string
  soldQuantity: number
  attributes: unknown
  price: string | number
  image: string | null
}

const getS3Bucket = () =>
  (process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || process.env.NEXT_PUBLIC_S3_BUCKET || '').trim()

const getS3Region = () =>
  (process.env.S3_REGION || process.env.AWS_REGION || 'ap-southeast-1').trim()

const getS3Endpoint = () =>
  (process.env.S3_ENDPOINT || process.env.AWS_S3_ENDPOINT || '').trim()

const getSignedUrlExpiresIn = () => {
  const parsed = Number(process.env.S3_SIGNED_URL_EXPIRES_IN || 3600)
  if (!Number.isFinite(parsed) || parsed <= 0) return 3600
  return Math.min(parsed, 604800)
}

const createS3Client = () => {
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY
  const sessionToken = process.env.AWS_SESSION_TOKEN
  const endpoint = getS3Endpoint()

  const baseConfig = {
    region: getS3Region(),
    ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
  }

  if (accessKeyId && secretAccessKey) {
    return new S3Client({
      ...baseConfig,
      credentials: { accessKeyId, secretAccessKey, sessionToken },
    })
  }

  return new S3Client(baseConfig)
}

const getAssetBaseUrl = () =>
  (
    process.env.S3_PUBLIC_URL ||
    process.env.S3_PUBLIC_BASE_URL ||
    process.env.S3_BASE_URL ||
    process.env.AWS_S3_BASE_URL ||
    process.env.NEXT_PUBLIC_S3_BASE_URL ||
    process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
    ''
  ).trim()

const toAbsoluteImageUrl = (image: string | null) => {
  if (!image) return null
  if (/^https?:\/\//i.test(image)) return image

  const baseUrl = getAssetBaseUrl()
  if (!baseUrl) return image

  const cleanBase = baseUrl.replace(/\/+$/, '')
  const cleanPath = image.replace(/^\/+/, '')
  return `${cleanBase}/${cleanPath}`
}

const toSignedOrAbsoluteImageUrl = async (
  image: string | null,
  s3Client: S3Client,
  s3Bucket: string,
  expiresIn: number
) => {
  if (!image) return null
  if (/^https?:\/\//i.test(image)) return image

  const key = image.replace(/^\/+/, '')

  if (s3Bucket) {
    try {
      const command = new GetObjectCommand({ Bucket: s3Bucket, Key: key })
      return await getSignedUrl(s3Client, command, { expiresIn })
    } catch {
      // fall through to absolute URL
    }
  }

  return toAbsoluteImageUrl(image)
}

export async function GET(request: NextRequest) {
  const categoryIdParam = request.nextUrl.searchParams.get('categoryId')
  const parsedCategoryId = Number(categoryIdParam)
  const hasCategoryFilter = Number.isFinite(parsedCategoryId) && parsedCategoryId > 0

  try {
    const result = await pool.query(
      `
      SELECT
          pv.id,
          p.id AS "productId",
          p."categoryId" AS "categoryId",
          pv.sku,
          pv.name,
          pv.attributes,
          pv.price,
          p.name AS "productName",
          COALESCE(
            (
              SELECT SUM(order_items.quantity)::int
              FROM order_items
              WHERE order_items."variantId" = pv.id
            ),
            0
          ) AS "soldQuantity",
          COALESCE(
            NULLIF(pv.attributes::jsonb ->> 'imageKey', ''),
            (
              SELECT pi.url
              FROM product_images pi
              WHERE pi."productId" = p.id
              ORDER BY pi.id
              LIMIT 1
            )
          ) AS image
      FROM product_variants pv
      JOIN products p ON p.id = pv."productId"
      WHERE p.slug IS NOT NULL AND p.slug <> ''
        ${hasCategoryFilter ? 'AND p."categoryId" = $1' : ''}
      ORDER BY p.id, pv.id
      `,
      hasCategoryFilter ? [parsedCategoryId] : []
    )

    const s3Bucket = getS3Bucket()
    const expiresIn = getSignedUrlExpiresIn()
    const s3Client = createS3Client()

    const data = await Promise.all(
      (result.rows as ProductRow[]).map(async (row) => ({
        ...row,
        image: await toSignedOrAbsoluteImageUrl(row.image, s3Client, s3Bucket, expiresIn),
      }))
    )

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Failed to fetch products:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
