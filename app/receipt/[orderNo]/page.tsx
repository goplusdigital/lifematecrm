'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import ContentLoader from 'react-content-loader'

interface OrderItem {
    name: string
    variantName?: string
    quantity: number
    unit_price: number
    total: number,
    
}

interface Order {
    order_no: string
    member_code: string | null
    member_phone: string | null
    customer_name: string | null
    items: OrderItem[]
    subtotal: number
    tax: number
    total_amount: number
    points_earned: number
    discount_amount: number
    payment_method: string
    payment_status: string
    notes: string | null
    created_at: string
    updated_at: string
    receipt_no?: string | null
}

interface Member {
    member_code: string
    member_name: string
    member_phone: string
    member_point: number
    member_email: string
}

interface ApiResponse {
    success: boolean
    data: {
        order: Order
        member: Member | null
    }
}

function ReceiptLoader() {
    return (
        <div className="w-full max-w-2xl bg-white rounded-lg p-6">
            <ContentLoader
                speed={2}
                width="100%"
                height={400}
                backgroundColor="#f3f3f3"
                foregroundColor="#ecebeb"
            >
                <rect x="0" y="0" rx="4" ry="4" width="100%" height="40" />
                <rect x="0" y="60" rx="4" ry="4" width="100%" height="20" />
                <rect x="0" y="90" rx="4" ry="4" width="100%" height="20" />
                <rect x="0" y="150" rx="4" ry="4" width="100%" height="200" />
                <rect x="0" y="360" rx="4" ry="4" width="100%" height="40" />
            </ContentLoader>
        </div>
    )
}

export default function ReceiptPage() {
    const params = useParams()
    const orderNo = params?.orderNo as string
    const [order, setOrder] = useState<Order | null>(null)
    const [member, setMember] = useState<Member | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                setLoading(true)
                setError(null)

                const response = await fetch(`/api/orders/${orderNo}`)
                const result: ApiResponse = await response.json()

                if (!response.ok) {
                    throw new Error('Failed to fetch order')
                }

                setOrder(result.data.order)
                setMember(result.data.member)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred')
            } finally {
                setLoading(false)
            }
        }

        if (orderNo) {
            fetchOrder()
        }
    }, [orderNo])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <ReceiptLoader />
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="w-full max-w-2xl bg-white rounded-lg p-8 shadow-md">
                    <div className="text-center">
                        <svg
                            className="w-16 h-16 text-red-500 mx-auto mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4v2m0 0v2m0-12v-2m0 0v-2m0 12h2m-2 0h-2m8 0h2m-2 0h-2"
                            />
                        </svg>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2 font-prompt">
                            ไม่พบการสั่งซื้อ
                        </h2>
                        <p className="text-gray-600 mb-4 font-prompt">{error}</p>
                        <a
                            href="/"
                            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-prompt hover:bg-blue-700 transition"
                        >
                            กลับหน้าแรก
                        </a>
                    </div>
                </div>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-gray-600 font-prompt">ไม่พบข้อมูลการสั่งซื้อ</p>
                </div>
            </div>
        )
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date)
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
        }).format(amount)
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 font-prompt">
            <div className="w-full mx-auto">
                {/* Header with Logo */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl p-6 text-white text-center">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden border-4 border-blue-500">
                        <Image
                            src="/logo.jpg"
                            alt="Logo"
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <h1 className="text-2xl font-bold">{order.receipt_no ? `ใบกำกับภาษีอย่างย่อ` : 'ใบเสร็จรับเงิน'}</h1>
                    <p className="text-blue-100 mt-1">Lifematewellness</p>
                </div>

                {/* Receipt Content */}
                <div className="bg-white shadow-lg rounded-b-2xl p-6 space-y-6">
                    {/* Order Number and Date */}
                    <div className="border-b-2 border-gray-200 pb-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-gray-500 text-sm">เลขที่{order.receipt_no ? `ใบกำกับภาษีอย่างย่อ` : 'ใบเสร็จ'}</p>
                                <p className="text-xs font-bold text-gray-800">{order.receipt_no || order.order_no}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-500 text-sm">วันที่</p>
                                <p className="text-xs text-gray-800">{formatDate(order.created_at)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Customer Information */}


                    {/* Items List */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4">รายการสินค้า</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b-2 border-gray-300">
                                        <th className="text-left py-2 px-2 text-gray-700 font-semibold">
                                            รายการ
                                        </th>
                                        {/* <th className="text-center py-2 px-2 text-gray-700 font-semibold w-16">
                      จำนวน
                    </th>
                    <th className="text-right py-2 px-2 text-gray-700 font-semibold w-24">
                      ราคา/หน่วย
                    </th> */}
                                        <th className="text-right py-2 px-2 text-gray-700 font-semibold w-28">
                                            รวม
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.items.map((item, index) => (
                                        <tr
                                            key={index}
                                            className="border-b border-gray-200 hover:bg-gray-50"
                                        >
                                            <td className="py-3 px-2 text-gray-700">
                                                <div className='font-bold'>{item.name}</div>
                                                {item?.variantName && <div className='font-normal'>{item.variantName}</div>}
                                                <div className="text-gray-700">
                                                    {item.quantity} x {formatCurrency(item.unit_price)}
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 text-right font-semibold text-gray-800 align-top">
                                                {formatCurrency(item.total)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pricing Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2 border border-gray-200">
                        <div className="flex justify-between text-gray-700">
                            <span>ยอดรวมสินค้า</span>
                            <span className="font-semibold">{formatCurrency(order.subtotal)}</span>
                        </div>

                        {order.discount_amount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>ส่วนลด</span>
                                <span className="font-semibold">
                                    -{formatCurrency(order.discount_amount)}
                                </span>
                            </div>
                        )}

                        {order.tax > 0 && (
                            <div className="flex justify-between text-gray-700 border-t pt-2">
                                <span>ภาษีมูลค่าเพิ่ม (7%)</span>
                                <span className="font-semibold">{formatCurrency(order.tax)}</span>
                            </div>
                        )}

                        <div className="flex justify-between text-lg font-bold text-gray-800 border-t-2 pt-2 bg-blue-100 -mx-4 -mb-4 px-4 py-3 rounded-b-lg">
                            <span>ยอดรวมทั้งสิ้น</span>
                            <span className="text-blue-600">{formatCurrency(order.total_amount)}</span>
                        </div>
                    </div>

                    {/* Points Section */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border-2 border-amber-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm mb-1">คะแนนที่ได้รับ</p>
                                <p className="text-3xl font-bold text-amber-600">
                                    {order.points_earned}
                                </p>
                                <p className="text-gray-600 text-xs mt-1">คะแนน</p>
                            </div>
                            <div className="text-4xl opacity-20">⭐</div>
                        </div>

                        {member && (
                            <div className="mt-3 pt-3 border-t border-amber-200 text-sm">
                                <p className="text-gray-600">คะแนนรวมทั้งสิ้น</p>
                                <p className="text-2xl font-bold text-amber-700">
                                    {member.member_point}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Payment Method */}
                    {order.payment_method && (
                        <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            <span>วิธีชำระเงิน</span>
                            <span className="font-semibold text-gray-800">{order.payment_method}</span>
                        </div>
                    )}

                    {/* Notes */}
                    {order.notes && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                            <p className="text-gray-600 text-sm mb-1">หมายเหตุ</p>
                            <p className="text-gray-800">{order.notes}</p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="border-t-2 border-gray-200 pt-4 text-center text-gray-500 text-sm">
                        <p>ขอบคุณที่มาใช้บริการของเรา 🙏</p>
                        <p className="mt-2 text-xs">
                            {new Date(order.created_at).toLocaleString('th-TH')}
                        </p>
                    </div>

                    {/* Print and Back Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                        {/* <button
              onClick={() => window.print()}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4H9a2 2 0 00-2 2v2a2 2 0 002 2h4a2 2 0 002-2v-2a2 2 0 00-2-2z"
                />
              </svg>
              พิมพ์ใบเสร็จ
            </button> */}
                        <a
                            href="/"
                            className="flex-1 bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-semibold hover:bg-gray-400 transition text-center"
                        >
                            กลับหน้าแรก
                        </a>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
        @media print {
          body {
            background: white;
          }
          .no-print {
            display: none;
          }
          .max-w-2xl {
            max-width: 100%;
          }
        }
      `}</style>
        </div>
    )
}
