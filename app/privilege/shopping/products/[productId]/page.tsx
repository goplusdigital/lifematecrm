"use client"

import { useEffect, useMemo, useState } from 'react'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'

type ProductDetailResponse = {
  success: boolean
  data?: {
    product: {
      id: number
      name: string
      slug: string
      description: string | null
      categoriesName: string | null
    }
    variants: Array<{
      id: number
      name: string
      price: number
      soldQuantity: number
      imageUrls: string[]
    }>
    images: string[]
    priceRange: {
      min: number
      max: number
    }
  }
  error?: string
}

type ProductSearchItem = {
  productId: number
  productName: string
  slug: string
  variantId: number
  image: string | null
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('th-TH').format(price)
}

const formatSold = (quantity: number) => {
  return new Intl.NumberFormat('th-TH').format(Number(quantity || 0))
}

export default function ProductDetailPage() {
  const params = useParams<{ productId: string }>()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [productData, setProductData] = useState<ProductDetailResponse['data']>()
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ProductSearchItem[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  const fallbackProductId = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean)
    return parts.length > 0 ? parts[parts.length - 1] : ''
  }, [pathname])

  const productId = useMemo(() => {
    if (params && typeof params.productId === 'string' && params.productId.trim()) {
      return params.productId
    }
    return fallbackProductId
  }, [params, fallbackProductId])

  const selectedVariantIdParam = searchParams.get('variant')
  const selectedVariantId = useMemo(() => {
    if (!selectedVariantIdParam) return null
    const parsed = Number(selectedVariantIdParam)
    if (!Number.isFinite(parsed) || parsed <= 0) return null
    return parsed
  }, [selectedVariantIdParam])

  useEffect(() => {
    if (!productId) return

    const fetchProductDetail = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/products/${encodeURIComponent(productId)}`)
        const json: ProductDetailResponse = await response.json()

        if (!response.ok || !json.success || !json.data) {
          setError(json.error || 'ไม่สามารถโหลดข้อมูลสินค้าได้')
          return
        }

        setProductData(json.data)
      } catch (fetchError) {
        console.error('Failed to fetch product detail:', fetchError)
        setError('ไม่สามารถโหลดข้อมูลสินค้าได้')
      } finally {
        setLoading(false)
      }
    }

    fetchProductDetail()
  }, [productId])

  useEffect(() => {
    const trimmed = searchQuery.trim()

    if (trimmed.length < 2) {
      setSearchResults([])
      setSearchLoading(false)
      return
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      try {
        setSearchLoading(true)
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        })
        const json = await response.json()
        if (!response.ok || !json?.success || !Array.isArray(json?.data)) {
          setSearchResults([])
          return
        }
        setSearchResults(json.data)
      } catch (searchError) {
        if ((searchError as Error).name !== 'AbortError') {
          console.error('Failed to search products:', searchError)
        }
      } finally {
        setSearchLoading(false)
      }
    }, 250)

    return () => {
      controller.abort()
      window.clearTimeout(timeoutId)
    }
  }, [searchQuery])

  const selectedVariant = useMemo(() => {
    if (!productData || !selectedVariantId) return null
    return productData.variants.find((variant) => variant.id === selectedVariantId) || null
  }, [productData, selectedVariantId])

  const displayImages = useMemo(() => {
    if (!productData) return []

    // Always show all product-level and variant-level images.
    const allVariantImages = productData.variants.flatMap((variant) => variant.imageUrls)
    return [...new Set([...productData.images, ...allVariantImages])]
  }, [productData])

  useEffect(() => {
    if (!displayImages.length) {
      setActiveImageIndex(0)
      return
    }

    if (selectedVariant && selectedVariant.imageUrls.length > 0) {
      const focusIndex = displayImages.findIndex((image) => selectedVariant.imageUrls.includes(image))
      setActiveImageIndex(focusIndex >= 0 ? focusIndex : 0)
      return
    }

    setActiveImageIndex(0)
  }, [selectedVariant, displayImages])

  const displayPrice = useMemo(() => {
    if (!productData) return '-'

    if (selectedVariant) {
      return `฿ ${formatPrice(Number(selectedVariant.price))}`
    }

    if (productData.priceRange.min === productData.priceRange.max) {
      return `฿ ${formatPrice(productData.priceRange.min)}`
    }

    return `฿ ${formatPrice(productData.priceRange.min)} - ฿ ${formatPrice(productData.priceRange.max)}`
  }, [productData, selectedVariant])

  const discountPercent = useMemo(() => {
    if (!productData || selectedVariant) return null
    const { min, max } = productData.priceRange
    if (!max || max <= min) return null
    return Math.round(((max - min) / max) * 100)
  }, [productData, selectedVariant])

  const displaySoldQuantity = useMemo(() => {
    if (!productData) return 0
    if (selectedVariant) return Number(selectedVariant.soldQuantity || 0)
    return productData.variants.reduce((sum, variant) => sum + Number(variant.soldQuantity || 0), 0)
  }, [productData, selectedVariant])

  const onSelectVariant = (variantId: number) => {
    const paramsValue = new URLSearchParams(searchParams.toString())

    if (selectedVariantId === variantId) {
      paramsValue.delete('variant')
    } else {
      paramsValue.set('variant', String(variantId))
    }

    const nextQuery = paramsValue.toString()
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
  }

  const onBack = () => {
    router.push('/privilege/shopping')
  }

  const onPickSearchItem = (item: ProductSearchItem) => {
    setShowSearchResults(false)
    setSearchQuery('')
    router.push(`/privilege/shopping/products/${item.productId}?variant=${item.variantId}`)
  }

  const topBar = (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="max-w-md mx-auto px-3 py-2">
        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-700"
            aria-label="ย้อนกลับ"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onFocus={() => setShowSearchResults(true)}
              onBlur={() => window.setTimeout(() => setShowSearchResults(false), 120)}
              placeholder="ค้นหาสินค้า"
              className="w-full h-10 rounded-full border border-gray-200 bg-[#f7f7f7] px-4 text-sm text-gray-800 focus:outline-none focus:border-[#ee4d2d]"
            />

            {showSearchResults && (searchLoading || searchResults.length > 0 || searchQuery.trim().length >= 2) && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-40">
                {searchLoading ? (
                  <div className="px-4 py-3 text-sm text-gray-500">กำลังค้นหา...</div>
                ) : searchResults.length > 0 ? (
                  <ul className="max-h-72 overflow-y-auto">
                    {searchResults.map((item) => (
                      <li key={`${item.productId}-${item.variantId}`}>
                        <button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => onPickSearchItem(item)}
                          className="w-full px-3 py-2 flex items-center gap-3 hover:bg-[#fff5f2]"
                        >
                          <span className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {item.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                            ) : (
                              <span className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No Img</span>
                            )}
                          </span>
                          <span className="text-left min-w-0">
                            <span className="block text-sm text-gray-800 line-clamp-1">{item.productName}</span>
                            <span className="block text-xs text-gray-400 line-clamp-1">/{item.slug}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500">ไม่พบสินค้า</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="bg-[#E8E8E8] min-h-screen font-prompt">
        {topBar}
        <div className="p-5">
          <div className="bg-white rounded-2xl p-6 text-center text-gray-600">กำลังโหลดข้อมูลสินค้า...</div>
        </div>
      </div>
    )
  }

  if (error || !productData) {
    return (
      <div className="bg-[#E8E8E8] min-h-screen font-prompt">
        {topBar}
        <div className="p-5">
          <div className="bg-white rounded-2xl p-6 text-center text-red-500">{error || 'ไม่พบสินค้า'}</div>
        </div>
      </div>
    )
  }

  const activeImage = displayImages[activeImageIndex] || null

  return (
    <div className="bg-[#f5f5f5] min-h-screen font-prompt pb-40">
      {topBar}
      <div className="bg-white mb-2">
        <div className="w-full aspect-square overflow-hidden bg-gray-100">
          {activeImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={activeImage} alt={productData.product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">ไม่มีรูปสินค้า</div>
          )}
        </div>

        {displayImages.length > 1 && (
          <div className="px-3 py-3 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {displayImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  className={`w-16 h-16 rounded-md overflow-hidden border-2 flex-shrink-0 ${
                    index === activeImageIndex ? 'border-[#ee4d2d]' : 'border-gray-200'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt={`${productData.product.name}-${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white px-4 py-4 mb-2">
        <h1 className="text-lg font-semibold text-gray-800 leading-snug mb-2">{productData.product.name}</h1>

        <div className="flex items-center gap-2 mb-2">
          <p className="text-[#ee4d2d] text-2xl font-bold">{displayPrice}</p>
          {discountPercent && (
            <span className="text-xs font-semibold px-2 py-1 rounded bg-[#fff1ee] text-[#ee4d2d]">
              ลด {discountPercent}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>⭐⭐⭐⭐⭐ 5.0 คะแนนรีวิว</span>
          <span>ขายแล้ว {formatSold(displaySoldQuantity)}</span>
          {productData.product.categoriesName && <span>{productData.product.categoriesName}</span>}
        </div>
      </div>

      <div className="bg-white px-4 py-4 mb-2">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">ตัวเลือกสินค้า</h2>
        <div className="flex flex-wrap gap-2">
          {productData.variants.map((variant) => {
            const isSelected = selectedVariantId === variant.id
            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => onSelectVariant(variant.id)}
                className={`px-3 py-2 rounded-md border text-sm transition-colors ${
                  isSelected
                    ? 'bg-[#fff1ee] border-[#ee4d2d] text-[#ee4d2d]'
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                {variant.name}
              </button>
            )
          })}
        </div>
      </div>

      {productData.product.description && (
        <div className="bg-white px-4 py-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-2">รายละเอียดสินค้า</h2>
          <div
            className="text-gray-700 text-sm leading-relaxed space-y-2 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
            dangerouslySetInnerHTML={{ __html: productData.product.description }}
          />
        </div>
      )}

      <div className="fixed bottom-[80px] left-0 right-0 bg-white border-t border-gray-200 p-3 z-10">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-2">
          <a
            href="https://shopee.co.th/lifematewellness#product_list"
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-1 flex items-center justify-center rounded-lg border border-[#ee4d2d] bg-white py-2"
          >
            <img src="/shopee-logo.png" alt="Shopee" className="h-7 w-7 object-contain" />
          </a>
          <button
            type="button"
            disabled
            className="col-span-1 rounded-lg border border-gray-300 text-gray-400 font-semibold text-sm py-3 cursor-not-allowed"
          >
            ใส่รถเข็น
          </button>
          <button
            type="button"
            disabled
            className="col-span-2 rounded-lg bg-gray-300 text-gray-400 font-semibold text-sm py-3 cursor-not-allowed"
          >
            ซื้อสินค้า
          </button>
        </div>
      </div>
    </div>
  )
}
