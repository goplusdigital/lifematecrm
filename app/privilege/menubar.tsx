"use client"
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
export default function Menubar() {
    const router = useRouter();
    const currentPath = usePathname();

   
    
    // set currentpath if page change
  return (
    <footer className="flex-none p-4 bg-white border-t border-gray-100 space-y-4">
                {/* tab bar icon */}
                <div className="flex justify-around">
                    <Link href={'/privilege'} className={`flex flex-col items-center ${currentPath === '/privilege' ? 'text-[#F35F1A]' : 'text-gray-800 opacity-50'}`}>
                       
                        <svg className="w-6 h-6 mb-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill='currentColor'><path d="M304 70.1C313.1 61.9 326.9 61.9 336 70.1L568 278.1C577.9 286.9 578.7 302.1 569.8 312C560.9 321.9 545.8 322.7 535.9 313.8L527.9 306.6L527.9 511.9C527.9 547.2 499.2 575.9 463.9 575.9L175.9 575.9C140.6 575.9 111.9 547.2 111.9 511.9L111.9 306.6L103.9 313.8C94 322.6 78.9 321.8 70 312C61.1 302.2 62 287 71.8 278.1L304 70.1zM320 120.2L160 263.7L160 512C160 520.8 167.2 528 176 528L224 528L224 424C224 384.2 256.2 352 296 352L344 352C383.8 352 416 384.2 416 424L416 528L464 528C472.8 528 480 520.8 480 512L480 263.7L320 120.3zM272 528L368 528L368 424C368 410.7 357.3 400 344 400L296 400C282.7 400 272 410.7 272 424L272 528z"/></svg>

                        <span className="text-xs">Home</span>
                    </Link>
                    <Link href="/privilege/coupon" className={`flex flex-col items-center ${currentPath === '/privilege/coupon' ? 'text-[#F35F1A]' : 'text-gray-800 opacity-50'}`}>
                        <svg className="w-6 h-6 mb-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill='currentColor'><path d="M96 128C60.7 128 32 156.7 32 192L32 256C32 264.8 39.4 271.7 47.7 274.6C66.5 281.1 80 299 80 320C80 341 66.5 358.9 47.7 365.4C39.4 368.3 32 375.2 32 384L32 448C32 483.3 60.7 512 96 512L544 512C579.3 512 608 483.3 608 448L608 384C608 375.2 600.6 368.3 592.3 365.4C573.5 358.9 560 341 560 320C560 299 573.5 281.1 592.3 274.6C600.6 271.7 608 264.8 608 256L608 192C608 156.7 579.3 128 544 128L96 128zM448 400L448 240L192 240L192 400L448 400zM144 224C144 206.3 158.3 192 176 192L464 192C481.7 192 496 206.3 496 224L496 416C496 433.7 481.7 448 464 448L176 448C158.3 448 144 433.7 144 416L144 224z" /></svg>
                        <span className="text-xs">Coupon</span>
                    </Link>
                    <div className="flex flex-col items-center relative w-20"  >
                        <Link href="/privilege/my-qrcode" className="w-22 h-22 rounded-full bg-[#ffffff] flex flex-col items-center justify-center shadow-md absolute -top-12 left-1/2 transform -translate-x-1/2 overflow-hidden border-4 border-gray-200">
                            <svg className="w-full h-full m-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                <path stroke="currentColor" strokeLinejoin="round" strokeWidth="2" d="M4 4h6v6H4V4Zm10 10h6v6h-6v-6Zm0-10h6v6h-6V4Zm-4 10h.01v.01H10V14Zm0 4h.01v.01H10V18Zm-3 2h.01v.01H7V20Zm0-4h.01v.01H7V16Zm-3 2h.01v.01H4V18Zm0-4h.01v.01H4V14Z" />
                                <path stroke="currentColor" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01v.01H7V7Zm10 10h.01v.01H17V17Z" />
                            </svg>
                            
                        </Link>
                    </div>
                    <Link href="/privilege/shopping" className={`flex flex-col items-center ${currentPath === '/privilege/shopping' ? 'text-[#F35F1A]' : 'text-gray-800 opacity-50'}`}>
                        <svg className="w-6 h-6 mb-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 4h1.5L9 16m0 0h8m-8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-8.5-3h9.25L19 7H7.312" />
                        </svg>



                        <span className="text-xs">Shoping</span>
                    </Link>
                    <Link href="/privilege/account" className={`flex flex-col items-center ${currentPath === '/privilege/account' ? 'text-[#F35F1A]' : 'text-gray-800 opacity-50'}`}>

                        <svg className="w-6 h-6 mb-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0a8.949 8.949 0 0 0 4.951-1.488A3.987 3.987 0 0 0 13 16h-2a3.987 3.987 0 0 0-3.951 3.512A8.948 8.948 0 0 0 12 21Zm3-11a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                        <span className="text-xs">Account</span>
                    </Link>
                </div>
            </footer>)
}