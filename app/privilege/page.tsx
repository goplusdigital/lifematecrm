"use client"


import Image from "next/image";
import Link from "next/link";
import { useAuth } from "./authcontext"
import { Badge, Progress } from "flowbite-react";
import { useEffect, useMemo, useState } from "react";

type InterestingProduct = {
  id: number
  sku: string
  name: string
  productId: number
  productName: string
  price: string | number
  image: string | null
}

export default function Privilege() {
  const { user } = useAuth()
  const [products, setProducts] = useState<InterestingProduct[]>([])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/interesting-products')
        const json = await response.json()
        if (json?.success && Array.isArray(json.data)) {
          setProducts(json.data)
        }
      } catch (error) {
        console.error('Failed to load interesting products:', error)
      }
    }

    fetchProducts()
  }, [])

  const topProducts = useMemo(() => products.slice(0, 6), [products])

  const formatPrice = (price: string | number) => {
    const value = Number(price || 0)
    return new Intl.NumberFormat('th-TH').format(value)
  }

  console.log(user)
  return (
    <>
      <div className="flex-1 flex flex-row items-start justify-start p-5 pb-10 gap-4 bg-[#0093e8] relative">
        {/* logo circle center - start */}
        <div className="w-16 h-16 rounded-full bg-[#f4f6f7] flex items-center justify-center shadow-md overflow-hidden border-4 border-gray-200">
          <Image src="/logo.jpg" alt="Logo" width={48} height={48} className='w-full h-full object-cover' />
        </div>
        {/* logo circle center - end */}
        {/* Name of Merchant */}
        <div>
          <h1 className="text-2xl font-bold font-prompt text-white mt-2">
            Lifematewellness
          </h1>
          <p className="text-white  font-prompt">สิทธิพิเศษสำหรับสมาชิก</p>
        </div>
        {/* Phone number */}


      </div>
      <div className="w-full relative mb-35">
        <div className="absolute w-full -top-10 left-0 px-5">
          <div className="flex flex-col w-full text-gray-800 font-prompt bg-[#ffffff] px-4 py-6 rounded-lg shadow-md ">
            <div className="flex flex-row w-full justify-between mb-2">
              <div className="flex flex-col">
                <span className="font-bold text-lg">{user?.fullname || '-'}</span>
              </div>
              <div className="flex flex-row justify-end vertical-center">
                <svg className="w-6 h-6 text-[#a3870a]" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M359.6 118.2C348.8 116 337.5 114.9 326.1 114.6L326.1 96.4C404.2 98.6 472.2 140.4 510.7 203L494.9 212.1C488.8 202.4 482.2 193.3 474.7 185L456.7 200.5C430.7 170.9 395.3 149.8 354.8 142.1L359.6 118.2zM125.4 386.4L148.4 378.7C142 360.4 138.4 340.5 138.4 320C138.4 299.5 141.7 279.6 148.1 261.3L125.4 253.6C129 242.8 133.7 232.3 139 222.6L123.2 213.5C106 245 96.1 281.5 96.1 320C96.1 358.5 106.1 395 123.2 426.6L139 417.5C133.7 407.5 129.3 397.2 125.4 386.4zM285.1 498C244.7 490 209.3 468.9 183.2 439.3L165.2 455.1C157.7 446.5 150.8 437.4 145 427.7L129 437.1C167.5 499.4 235.8 541.4 313.9 543.7L313.9 525.4C302.6 525.1 291.2 523.7 280.4 521.8L285.1 498zM165.3 184.9L183.3 200.4C209.3 170.8 244.7 149.7 285.2 142L280.5 118.2C291.3 116 302.6 114.9 314 114.6L314 96.4C235.9 98.6 167.9 140.4 129.4 203L145.2 212.1C151.2 202.4 157.8 193.2 165.3 184.9zM474.7 455.1L456.7 439.3C430.7 468.9 395.3 490 354.8 498L359.5 521.8C348.7 523.7 337.4 525.1 326 525.4L326 543.7C404.1 541.5 472.4 499.4 510.9 437.1L494.8 427.7C489.1 437.4 482.2 446.5 474.7 455.1zM72 320C72 183 183 72 320 72C457 72 568 183 568 320C568 457 457 568 320 568C183 568 72 457 72 320zM555.8 320C555.8 189.8 450.2 84.2 320 84.2C189.8 84.2 84.2 189.8 84.2 320C84.2 450.2 189.8 555.8 320 555.8C450.2 555.8 555.8 450.2 555.8 320zM516.8 213.4L501 222.5C506.3 232.2 511 242.7 514.6 253.5L491.9 261.2C498.3 279.5 501.6 299.4 501.6 319.9C501.6 340.4 498 360.3 491.6 378.6L514.6 386.3C510.7 397.1 506.3 407.3 501 417.3L516.8 426.4C534 395 543.9 358.5 543.9 320C543.9 281.5 534 245 516.8 213.4zM333.8 391.1C350.1 387.8 364.2 379.5 374.5 367.6L425.7 412.4C437.6 398.8 447 383.1 452.8 365.6L388.6 343.5C391.1 336 392.5 328.3 392.5 320C392.5 311.7 391.1 303.9 388.6 296.5L453.1 274.4C447 257 437.6 241.2 425.7 227.6L374.5 272.4C364.3 260.5 350.1 251.9 333.8 248.6L347.1 182.2C338.5 180.3 329.4 179.4 320 179.4C310.6 179.4 301.5 180.2 292.9 182.2L306.2 248.6C289.9 251.9 275.8 260.5 265.5 272.4L214.3 227.6C202.4 241.2 193 256.9 186.9 274.4L251.4 296.5C248.9 304 247.5 311.7 247.5 320C247.5 328.3 248.9 336.1 251.4 343.5L187.2 365.6C193 383 202.4 398.8 214.3 412.4L265.5 367.6C275.7 379.5 289.9 387.8 306.2 391.1L292.9 457.8C301.5 459.5 310.6 460.6 320 460.6C329.4 460.6 338.5 459.5 347.1 457.8L333.8 391.1z" /></svg>
                <span className="font-bold text-lg">{user?.member_point || '0'}</span>
              </div>
            </div>

            <div className="flex flex-row w-full justify-between text-gray-400 mb-2">
              <div className="flex flex-col">
                <span className="text-md">{user?.phone_no || '-'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-md">คะแนน</span>
              </div>
            </div>

            <div className="mb-4">
              <Progress progress={100} />
            </div>

            <div className="flex flex-row w-full justify-between text-gray-400">
              <div className="flex flex-col">
                <span className="text-md">คุณอยู่ระดับสมาชิกสูงสุดแล้ว!</span>
              </div>
              <div className="flex flex-col">
                <span className="text-md">
                  <Badge color="gray" className="py-1 px-3">Member</Badge>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 px-2 pb-24 pt-2 bg-[#f5f5f5]">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-lg font-bold font-prompt text-gray-800">สินค้าที่น่าสนใจ</h2>
          <Link href="/privilege/shopping" className="inline-flex items-center gap-1 font-prompt text-sm font-semibold text-[#ee4d2d] hover:underline">
            <span>สินค้าทั้งหมด</span>
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M7.22 4.47a.75.75 0 011.06 0l4.999 5a.75.75 0 010 1.06l-5 5a.75.75 0 11-1.06-1.06L11.69 10 7.22 5.53a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {topProducts.map((item) => {
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
                </div>
              </span>
            </Link>
            )
          })}

          {topProducts.length === 0 && (
            <div className="bg-[#ffffff] p-4 rounded-lg shadow-md col-span-2 text-center">
              <p className="text-gray-600 font-prompt text-sm">ยังไม่มีสินค้าที่น่าสนใจ</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
