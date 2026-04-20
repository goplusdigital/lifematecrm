"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

type Product = {
  id: number
  sku: string
  name: string
  productId: number
  categoryId: number | null
  productName: string
  price: string | number
  soldQuantity: number
  image: string | null
}

type Category = {
  id: number
  name: string
  itemCount: number
}

type ProductSearchItem = {
  productId: number
  productName: string
  slug: string
  variantId: number
  image: string | null
}

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center bg-[#f5f5f5] m-0 p-8 relative h-dvh w-full">
    <svg width="118" height="100" viewBox="0 0 118 100" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="14" y="0.5" width="100" height="100" rx="50" fill="#EDF0F2"></rect><g filter="url(#filter0_d_22565_144151)"><rect x="6" y="13.5" width="74" height="21" rx="4" fill="white"></rect></g><rect x="9" y="16.5" width="15" height="15" rx="2" fill="#EDF0F2"></rect><rect x="29" y="18.5" width="42" height="4" rx="2" fill="#EDF0F2"></rect><rect x="29" y="25.5" width="22" height="4" rx="2" fill="#EDF0F2"></rect><g filter="url(#filter1_d_22565_144151)"><rect x="50" y="39.5" width="74" height="21" rx="4" fill="white"></rect></g><rect x="53" y="42.5" width="15" height="15" rx="2" fill="#EDF0F2"></rect><rect x="73" y="44.5" width="42" height="4" rx="2" fill="#EDF0F2"></rect><rect x="73" y="51.5" width="22" height="4" rx="2" fill="#EDF0F2"></rect><g filter="url(#filter2_d_22565_144151)"><rect x="14" y="69.5" width="74" height="21" rx="4" fill="white"></rect></g><rect x="17" y="72.5" width="15" height="15" rx="2" fill="#EDF0F2"></rect><rect x="37" y="74.5" width="42" height="4" rx="2" fill="#EDF0F2"></rect><rect x="37" y="81.5" width="22" height="4" rx="2" fill="#EDF0F2"></rect><path d="M98.6368 13.9684C97.955 13.7858 97.5239 13.088 97.798 12.4375C97.9461 12.0863 98.1201 11.7614 98.3201 11.4629C98.7317 10.8486 99.2261 10.3554 99.8034 9.98309C100.396 9.61494 101.044 9.37698 101.748 9.26922C102.468 9.16557 103.219 9.21872 104.003 9.42868C104.694 9.61394 105.305 9.88465 105.836 10.2408C106.366 10.597 106.789 11.015 107.105 11.4949C107.436 11.9789 107.643 12.5284 107.726 13.1432C107.823 13.7622 107.777 14.4251 107.588 15.1318C107.464 15.5928 107.286 15.9814 107.053 16.2977C106.84 16.6028 106.596 16.8669 106.322 17.0899C106.068 17.3017 105.787 17.4899 105.479 17.6545C105.187 17.8232 104.905 17.9863 104.632 18.1437C104.379 18.2899 104.127 18.4285 103.878 18.5593C103.633 18.6748 103.405 18.8195 103.194 18.9935C102.987 19.152 102.802 19.3496 102.64 19.586C102.482 19.8072 102.36 20.0791 102.273 20.4017C102.106 21.0254 101.465 21.3955 100.841 21.2284L100.738 21.2006C100.057 21.0181 99.6525 20.3182 99.8349 19.6372L99.8565 19.5566C99.9831 19.1459 100.153 18.788 100.367 18.4829C100.6 18.1666 100.843 17.9025 101.098 17.6907C101.371 17.4677 101.649 17.2621 101.93 17.0739C102.226 16.8898 102.511 16.719 102.783 16.5616C102.998 16.4378 103.222 16.3085 103.455 16.1735C103.705 16.0427 103.937 15.8826 104.152 15.6933C104.383 15.5081 104.579 15.2973 104.742 15.0608C104.919 14.8284 105.039 14.5642 105.102 14.2682C105.198 13.6023 105.102 13.0412 104.812 12.5849C104.542 12.1174 104.069 11.793 103.393 11.6119C102.932 11.4884 102.516 11.4756 102.144 11.5735C101.776 11.6561 101.443 11.8222 101.146 12.0718C100.848 12.3215 100.598 12.6414 100.395 13.0315C100.386 13.0486 100.377 13.0657 100.368 13.083C100.035 13.7269 99.3368 14.156 98.6368 13.9684ZM100.537 22.0856C101.339 22.3005 101.815 23.1247 101.6 23.9266C101.385 24.7284 100.561 25.2043 99.7594 24.9895L99.6672 24.9647C98.8653 24.7499 98.3894 23.9257 98.6043 23.1238C98.8192 22.3219 99.6434 21.8461 100.445 22.0609L100.537 22.0856Z" fill="#C9CED0"></path><path d="M20.4115 48.6607C19.6559 48.896 18.8293 48.493 18.6995 47.7123C18.6293 47.2907 18.5996 46.8786 18.6104 46.4759C18.6325 45.6472 18.8056 44.8835 19.1297 44.1848C19.4708 43.4809 19.9427 42.867 20.5454 42.3431C21.165 41.8139 21.9091 41.414 22.7775 41.1436C23.5437 40.905 24.2848 40.7956 25.0008 40.8154C25.7167 40.8353 26.3682 40.9779 26.9552 41.2434C27.5592 41.5036 28.0844 41.9004 28.5307 42.4338C28.994 42.962 29.3477 43.6177 29.5916 44.4009C29.7507 44.9117 29.8146 45.3868 29.7833 45.8262C29.7637 46.2432 29.691 46.6394 29.5651 47.0148C29.4509 47.3679 29.2974 47.7146 29.1045 48.0549C28.9286 48.3898 28.7586 48.7136 28.5945 49.0262C28.4421 49.3165 28.287 49.5983 28.1293 49.8715C27.9662 50.1278 27.8367 50.4016 27.7407 50.693C27.6393 50.9674 27.5827 51.2652 27.5707 51.5865C27.5533 51.8907 27.6004 52.2216 27.7117 52.5792C27.927 53.2704 27.5411 54.0052 26.85 54.2205L26.735 54.2562C25.9804 54.4913 25.1781 54.07 24.9431 53.3154L24.9152 53.226C24.7891 52.7609 24.7358 52.3199 24.7553 51.9029C24.7866 51.4635 24.8593 51.0673 24.9735 50.7142C25.0994 50.3388 25.2391 49.9777 25.3927 49.6311C25.5632 49.2791 25.7306 48.9468 25.8947 48.6342C26.0237 48.3886 26.1585 48.1318 26.2992 47.8638C26.457 47.5905 26.5812 47.2997 26.6719 46.9913C26.7797 46.6775 26.8396 46.36 26.8516 46.0387C26.8806 45.7122 26.8363 45.3898 26.7185 45.0715C26.4106 44.3829 25.9829 43.9091 25.4352 43.65C24.8993 43.3686 24.2568 43.3446 23.5076 43.5779C22.9968 43.737 22.5944 43.9744 22.3004 44.2901C22.0012 44.5887 21.7854 44.9454 21.6531 45.3602C21.5208 45.775 21.4751 46.2282 21.5161 46.7197C21.5177 46.7413 21.5195 46.763 21.5214 46.7847C21.5919 47.5942 21.1873 48.4191 20.4115 48.6607ZM27.0756 55.2149C27.9643 54.9381 28.909 55.4342 29.1858 56.3228C29.4625 57.2115 28.9665 58.1562 28.0778 58.433L27.9756 58.4648C27.087 58.7416 26.1422 58.2455 25.8655 57.3569C25.5887 56.4682 26.0848 55.5234 26.9734 55.2467L27.0756 55.2149Z" fill="#C9CED0"></path><path fillRule="evenodd" clipRule="evenodd" d="M108.098 82.196C105.575 84.1792 102.421 85.3571 99 85.3571C90.7157 85.3571 84 78.4495 84 69.9286C84 61.4076 90.7157 54.5 99 54.5C107.284 54.5 114 61.4076 114 69.9286C114 73.4474 112.855 76.6911 110.927 79.2868L118.414 86.9882C119.195 87.7916 119.195 89.0941 118.414 89.8975C117.633 90.7008 116.367 90.7008 115.586 89.8975L108.098 82.196ZM110 69.9286C110 76.1773 105.075 81.2429 99 81.2429C92.9249 81.2429 88 76.1773 88 69.9286C88 63.6799 92.9249 58.6143 99 58.6143C105.075 58.6143 110 63.6799 110 69.9286Z" fill="#C9CED0"></path><defs><filter id="filter0_d_22565_144151" x="0" y="9.5" width="86" height="33" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"></feColorMatrix><feOffset dy="2"></feOffset><feGaussianBlur stdDeviation="3"></feGaussianBlur><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"></feColorMatrix><feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_22565_144151"></feBlend><feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_22565_144151" result="shape"></feBlend></filter><filter id="filter1_d_22565_144151" x="44" y="35.5" width="86" height="33" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"></feColorMatrix><feOffset dy="2"></feOffset><feGaussianBlur stdDeviation="3"></feGaussianBlur><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"></feColorMatrix><feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_22565_144151"></feBlend><feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_22565_144151" result="shape"></feBlend></filter><filter id="filter2_d_22565_144151" x="8" y="65.5" width="86" height="33" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"></feColorMatrix><feOffset dy="2"></feOffset><feGaussianBlur stdDeviation="3"></feGaussianBlur><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"></feColorMatrix><feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_22565_144151"></feBlend><feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_22565_144151" result="shape"></feBlend></filter></defs></svg>
    <p className="text-sm font-prompt text-gray-700">ยังไม่มีสินค้าในร้าน</p>
  </div>
)

export default function Shopping() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [totalCategoryCount, setTotalCategoryCount] = useState(0)
  const [activeCategoryId, setActiveCategoryId] = useState<number | 'all'>('all')
  const [loaded, setLoaded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ProductSearchItem[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const query = activeCategoryId === 'all' ? '' : `?categoryId=${activeCategoryId}`
        const response = await fetch(`/api/products${query}`)
        const json = await response.json()
        if (json?.success && Array.isArray(json.data)) {
          setProducts(json.data)
        }
      } catch (error) {
        console.error('Failed to load products:', error)
      } finally {
        setLoaded(true)
      }
    }
    fetchProducts()
  }, [activeCategoryId])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        const json = await response.json()
        if (json?.success && Array.isArray(json.data)) {
          setCategories(json.data)
          setTotalCategoryCount(Number(json?.meta?.totalCount || 0))
        }
      } catch (error) {
        console.error('Failed to load categories:', error)
      }
    }

    fetchCategories()
  }, [])

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

  const onPickSearchItem = (item: ProductSearchItem) => {
    setShowSearchResults(false)
    setSearchQuery('')
    router.push(`/privilege/shopping/products/${item.productId}?variant=${item.variantId}`)
  }

  const formatSold = (quantity: number) => {
    const value = Number(quantity || 0)
    return `${new Intl.NumberFormat('th-TH').format(value)} sold`
  }

  const topSearchBar = (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="max-w-md mx-auto px-3 py-2.5">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ee4d2d]"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onFocus={() => setShowSearchResults(true)}
            onBlur={() => window.setTimeout(() => setShowSearchResults(false), 120)}
            placeholder="ค้นหาสินค้า"
            className="w-full h-10 rounded-md border border-gray-200 bg-[#f7f7f7] pl-9 pr-3 text-sm text-gray-800 focus:outline-none focus:border-[#ee4d2d]"
          />

          {showSearchResults && (searchLoading || searchResults.length > 0 || searchQuery.trim().length >= 2) && (
            <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden z-40">
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
  )

  const formatPrice = (price: string | number) => {
    const value = Number(price || 0)
    return new Intl.NumberFormat('th-TH').format(value)
  }

  const chipClassName = (isActive: boolean) =>
    isActive
      ? 'whitespace-nowrap px-3 py-1.5 rounded-full bg-[#fff1ee] text-[#ee4d2d] text-xs font-semibold border border-[#ffd9cf]'
      : 'whitespace-nowrap px-3 py-1.5 rounded-full bg-[#f5f5f5] text-gray-500 text-xs border border-transparent'

  if (!loaded) {
    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        {topSearchBar}
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <p className="text-sm font-prompt text-gray-400">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        {topSearchBar}
        <EmptyState />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {topSearchBar}
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <div className="max-w-md mx-auto">
          <div className="text-gray-800 font-prompt text-sm font-semibold">ช้อปดีลเด็ดทุกวัน</div>
          <div className="text-gray-500 font-prompt text-xs mt-1">สินค้าทั้งหมด {products.length} รายการ</div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            <button type="button" onClick={() => setActiveCategoryId('all')} className={chipClassName(activeCategoryId === 'all')}>
              ทั้งหมด ({new Intl.NumberFormat('th-TH').format(totalCategoryCount)})
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategoryId(category.id)}
                className={chipClassName(activeCategoryId === category.id)}
              >
                {category.name} ({new Intl.NumberFormat('th-TH').format(category.itemCount)})
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 px-2 pb-24 pt-2 bg-[#f5f5f5]">
        <div className="grid grid-cols-2 gap-2">
          {products.map((item) => {
            const canNavigate = Boolean(item.productId) && Boolean(item.id)
            const productHref = canNavigate
              ? `/privilege/shopping/products/${item.productId}?variant=${item.id}`
              : '#'

            return (
              <Link
                key={item.id}
                href={productHref}
                className="bg-white border border-[#f0f0f0] rounded-sm overflow-hidden block"
                aria-disabled={!canNavigate}
              >
                <span className="block w-full aspect-square overflow-hidden bg-gray-100">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt={item.name || item.productName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-prompt">
                      ไม่มีรูปสินค้า
                    </span>
                  )}
                </span>
                <span className="block px-2.5 py-2.5 font-prompt">
                  <div className="flex items-center gap-1 mb-1.5">
                    <span className="text-[10px] font-semibold uppercase px-1 py-[1px] rounded bg-[#fff1ee] text-[#ee4d2d]">Mall</span>
                    <span className="text-[10px] text-gray-400">Lifemate</span>
                  </div>
                  <p className="text-gray-800 text-[13px] leading-5 line-clamp-2 min-h-[2.5rem]">{item.productName}</p>
                  <p className="text-gray-500 text-xs line-clamp-1 mt-0.5 mb-1">{item.name}</p>
                  <div className="flex items-end justify-between mt-1">
                    <p className="text-[#ee4d2d] font-semibold text-base">฿ {formatPrice(item.price)}</p>
                    <span className="text-[10px] text-gray-400">{formatSold(item.soldQuantity)}</span>
                  </div>
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
