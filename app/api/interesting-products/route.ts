import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import dns from 'node:dns'
import https from 'node:https'

export const runtime = 'nodejs'

type ProductRow = {
  id: number
  productId: number
  sku: string
  name: string
  productName: string
  attributes: unknown
  price: string | number
  image: string | null
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

const getS3LookupIp = () => {
  return (process.env.S3_LOOKUP_IP || '').trim()
}

const getS3LookupHost = (endpoint: string) => {
  const configuredHost = (process.env.S3_LOOKUP_HOST || '').trim().toLowerCase()
  if (configuredHost) return configuredHost

  if (endpoint) {
    try {
      return new URL(endpoint).hostname.toLowerCase()
    } catch {
      // fall through to default host
    }
  }

  return 's3.goplus.co.th'
}

const createS3RequestHandler = (endpoint: string) => {
  const forcedIp = getS3LookupIp()
  if (!forcedIp) return undefined

  const forcedHost = getS3LookupHost(endpoint)
  const httpsAgent = new https.Agent({
    lookup: (hostname, options, callback) => {
      if (hostname.toLowerCase() === forcedHost) {
        if (typeof options === 'object' && options?.all) {
          callback(null, [{ address: forcedIp, family: 4 }])
          return
        }

        callback(null, forcedIp, 4)
        return
      }

      dns.lookup(hostname, options as never, callback as never)
    },
  })

  return new NodeHttpHandler({ httpsAgent })
}

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
  const requestHandler = createS3RequestHandler(endpoint)

  const baseConfig = {
    region: getS3Region(),
    ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    ...(requestHandler ? { requestHandler } : {}),
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
      const command = new GetObjectCommand({
        Bucket: s3Bucket,
        Key: key,
      })
      return await getSignedUrl(s3Client, command, { expiresIn })
    } catch (error) {
      console.error('Failed to sign S3 image URL:', error)
    }
  }

  return toAbsoluteImageUrl(image)
}

export async function GET() {
  try {
    const result = await pool.query(
      `
      SELECT
          pv.id,
          p.id AS "productId",
          pv.sku,
          pv.name,
          pv.attributes,
          pv.price,
          p.name AS "productName",
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
      JOIN products p
          ON p.id = pv."productId"
      ORDER BY RANDOM()
      LIMIT 8
      `
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

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error fetching interesting products:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch interesting products' },
      { status: 500 }
    )
  }
}
