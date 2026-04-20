import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const runtime = 'nodejs'

type RawVariant = {
  id: number
  productId: number
  sku: string
  barcode: string | null
  name: string
  attributes: unknown
  price: string | number
}

const getS3Bucket = () => {
  return (
    process.env.S3_BUCKET ||
    process.env.AWS_S3_BUCKET ||
    process.env.NEXT_PUBLIC_S3_BUCKET ||
    ''
  ).trim()
}

const getS3Region = () => {
  return (process.env.S3_REGION || process.env.AWS_REGION || 'ap-southeast-1').trim()
}

const getS3Endpoint = () => {
  return (process.env.S3_ENDPOINT || process.env.AWS_S3_ENDPOINT || '').trim()
}

const getSignedUrlExpiresIn = () => {
  const parsed = Number(process.env.S3_SIGNED_URL_EXPIRES_IN || 3600)
  if (!Number.isFinite(parsed) || parsed <= 0) return 3600
  return Math.min(parsed, 604800)
}

const getAssetBaseUrl = () => {
  return (
    process.env.S3_PUBLIC_URL ||
    process.env.S3_PUBLIC_BASE_URL ||
    process.env.S3_BASE_URL ||
    process.env.AWS_S3_BASE_URL ||
    process.env.NEXT_PUBLIC_S3_BASE_URL ||
    process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
    ''
  ).trim()
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
      credentials: {
        accessKeyId,
        secretAccessKey,
        sessionToken,
      },
    })
  }

  return new S3Client(baseConfig)
}

const normalizeKeyFromUrl = (input: string) => {
  const value = input.trim()

  const publicBaseUrl = getAssetBaseUrl().replace(/\/+$/, '')
  if (publicBaseUrl && value.startsWith(publicBaseUrl + '/')) {
    return value.slice(publicBaseUrl.length + 1)
  }

  if (/^https?:\/\//i.test(value)) {
    return null
  }

  return value.replace(/^\/+/, '')
}

const toAbsoluteImageUrl = (image: string | null) => {
  if (!image) return null
  if (/^https?:\/\//i.test(image)) return image

  const baseUrl = getAssetBaseUrl()
  if (!baseUrl) return image

  const cleanBase = baseUrl.replace(/\/+$/, '')
  const cleanPath = image.replace(/^\/+/, '')
  return `${cleanBase}/${cleanPath}`
}

const resolveImageUrl = async (
  image: string,
  s3Client: S3Client,
  s3Bucket: string,
  expiresIn: number
) => {
  const key = normalizeKeyFromUrl(image)

  if (key && s3Bucket) {
    try {
      const command = new GetObjectCommand({
        Bucket: s3Bucket,
        Key: key,
      })
      return await getSignedUrl(s3Client, command, { expiresIn })
    } catch (error) {
      console.error('Failed to sign image URL:', error)
    }
  }

  return toAbsoluteImageUrl(image)
}

const parseAttributes = (attributes: unknown): Record<string, unknown> => {
  if (!attributes) return {}
  if (typeof attributes === 'object') return attributes as Record<string, unknown>

  if (typeof attributes === 'string') {
    try {
      return JSON.parse(attributes) as Record<string, unknown>
    } catch {
      return {}
    }
  }

  return {}
}

const extractVariantImageKeys = (attributes: Record<string, unknown>) => {
  const candidates: string[] = []

  const single = attributes.imageKey
  if (typeof single === 'string' && single.trim()) {
    candidates.push(single.trim())
  }

  const array = attributes.imageKeys
  if (Array.isArray(array)) {
    array.forEach((item) => {
      if (typeof item === 'string' && item.trim()) {
        candidates.push(item.trim())
      }
    })
  }

  const images = attributes.images
  if (Array.isArray(images)) {
    images.forEach((item) => {
      if (typeof item === 'string' && item.trim()) {
        candidates.push(item.trim())
      }
    })
  }

  return [...new Set(candidates)]
}

const signDescriptionImageUrls = async (
  description: string | null,
  s3Client: S3Client,
  s3Bucket: string,
  expiresIn: number
) => {
  if (!description) return description

  const srcRegex = /src=(['"])(\.\.\/\.\.\/files\/[^'"\s>]+)\1/g
  const matches = [...description.matchAll(srcRegex)]
  if (!matches.length) return description

  const uniquePaths = [...new Set(matches.map((match) => match[2]))]
  const signedMap = new Map<string, string | null>()

  await Promise.all(
    uniquePaths.map(async (rawPath) => {
      const s3Key = rawPath.replace(/^\.\.\/\.\.\/files\//, '')
      const signedUrl = await resolveImageUrl(s3Key, s3Client, s3Bucket, expiresIn)
      signedMap.set(rawPath, signedUrl)
    })
  )

  return description.replace(srcRegex, (full, quote, rawPath) => {
    const signedUrl = signedMap.get(rawPath)
    if (!signedUrl) return full
    return `src=${quote}${signedUrl}${quote}`
  })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId: productIdParam } = await params
    const productId = Number(productIdParam)

    if (!Number.isFinite(productId) || productId <= 0) {
      return NextResponse.json({ success: false, error: 'Product id is required' }, { status: 400 })
    }

    const productResult = await pool.query(
      `
      SELECT
        products."id",
        products."name",
        products.slug,
        products.description,
        products.status,
        categories."name" as "categoriesName",
        categories.slug as "categoriesSlug",
        categories.image as "categoriesImage"
      FROM products
      LEFT JOIN categories ON categories."id" = products."categoryId"
      WHERE products."id" = $1
      LIMIT 1
      `,
      [productId]
    )

    if (productResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    const product = productResult.rows[0]

    const variantsResult = await pool.query(
      `
      SELECT
        product_variants."id",
        product_variants."productId",
        product_variants.sku,
        product_variants.barcode,
        product_variants."name",
        product_variants."attributes",
        product_variants.price
      FROM product_variants
      WHERE product_variants."productId" = $1
      ORDER BY product_variants.id ASC
      `,
      [product.id]
    )

    const imagesResult = await pool.query(
      `
      SELECT
        product_images."id",
        product_images."productId",
        product_images.url
      FROM product_images
      WHERE product_images."productId" = $1
      ORDER BY product_images.id ASC
      `,
      [product.id]
    )

    const s3Client = createS3Client()
    const s3Bucket = getS3Bucket()
    const expiresIn = getSignedUrlExpiresIn()

    const productImages = await Promise.all(
      imagesResult.rows
        .map((row) => row.url as string | null)
        .filter((url): url is string => Boolean(url))
        .map((url) => resolveImageUrl(url, s3Client, s3Bucket, expiresIn))
    )

    const signedDescription = await signDescriptionImageUrls(
      (product.description as string | null) || null,
      s3Client,
      s3Bucket,
      expiresIn
    )

    const variants = await Promise.all(
      (variantsResult.rows as RawVariant[]).map(async (variant) => {
        const attributes = parseAttributes(variant.attributes)
        const imageKeys = extractVariantImageKeys(attributes)

        const imageUrls = await Promise.all(
          imageKeys.map((key) => resolveImageUrl(key, s3Client, s3Bucket, expiresIn))
        )

        return {
          ...variant,
          attributes,
          price: Number(variant.price),
          imageUrls,
        }
      })
    )

    const prices = variants.map((variant) => Number(variant.price)).filter((price) => Number.isFinite(price))
    const minPrice = prices.length ? Math.min(...prices) : 0
    const maxPrice = prices.length ? Math.max(...prices) : 0

    return NextResponse.json({
      success: true,
      data: {
        product: {
          ...product,
          description: signedDescription,
        },
        variants,
        images: productImages,
        priceRange: {
          min: minPrice,
          max: maxPrice,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching product detail:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product detail' },
      { status: 500 }
    )
  }
}
