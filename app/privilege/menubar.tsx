"use client"
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBagShopping, faCircleUser, faEllipsisVertical, faHouse, faQrcode, faScrewdriverWrench, faTicket } from '@fortawesome/free-solid-svg-icons';
export default function Menubar() {
    const router = useRouter();
    const currentPath = usePathname();

   
    
    // set currentpath if page change
  return (
    <footer className="flex-none p-4 bg-gray-50 border-t border-gray-100 space-y-4">
                {/* tab bar icon */}
                <div className="flex justify-around">
                    <Link href={'/privilege'} className={`flex flex-col items-center ${currentPath === '/privilege' ? 'text-[#F35F1A]' : 'text-gray-800 opacity-50'}`}>
                       
                        <FontAwesomeIcon icon={faHouse} size='xl' className='mb-2' />
                        <span className="text-xs">Home</span>
                    </Link>
                    <Link href="/privilege/coupon" className={`flex flex-col items-center ${currentPath === '/privilege/coupon' ? 'text-[#F35F1A]' : 'text-gray-800 opacity-50'}`}>
                         <FontAwesomeIcon icon={faTicket} size='xl' className='mb-2' />
                         <span className="text-xs">Coupon</span>
                    </Link>
                    {/* <div className="flex flex-col items-center relative w-20"  >
                        <Link href="/privilege/my-qrcode" className="w-22 h-22 rounded-full bg-[#ffffff] flex flex-col items-center justify-center shadow-md absolute -top-12 left-1/2 transform -translate-x-1/2 overflow-hidden border-4 border-gray-200">
                            <svg className="w-full h-full m-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                <path stroke="currentColor" strokeLinejoin="round" strokeWidth="2" d="M4 4h6v6H4V4Zm10 10h6v6h-6v-6Zm0-10h6v6h-6V4Zm-4 10h.01v.01H10V14Zm0 4h.01v.01H10V18Zm-3 2h.01v.01H7V20Zm0-4h.01v.01H7V16Zm-3 2h.01v.01H4V18Zm0-4h.01v.01H4V14Z" />
                                <path stroke="currentColor" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01v.01H7V7Zm10 10h.01v.01H17V17Z" />
                            </svg>
                            
                        </Link>
                    </div> */}
                    <Link href="/privilege/my-qrcode" className={`flex flex-col items-center ${currentPath === '/privilege/my-qrcode' ? 'text-[#F35F1A]' : 'text-gray-800 opacity-50'}`}>
                        <FontAwesomeIcon icon={faQrcode} size='xl' className='mb-2' />
                        <span className="text-xs">My QR</span>
                    </Link>
                    <Link href="/privilege/shopping" className={`flex flex-col items-center ${currentPath.startsWith('/privilege/shopping') ? 'text-[#F35F1A]' : 'text-gray-800 opacity-50'}`}>
                        <FontAwesomeIcon icon={faBagShopping} size='xl' className='mb-2' />
                        <span className="text-xs">Shopping</span>
                    </Link>
                    <Link href="/privilege/account" className={`flex flex-col items-center ${currentPath.startsWith('/privilege/account') ? 'text-[#F35F1A]' : 'text-gray-800 opacity-50'}`}>

                        <FontAwesomeIcon icon={faCircleUser} size='xl' className='mb-2' />
                        
                        <span className="text-xs">Settings</span>
                    </Link>
                </div>
            </footer>)
}