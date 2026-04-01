"use client"


import Image from "next/image";
import { useAuth } from "../authcontext"
import { Badge, Progress } from "flowbite-react";
import { useEffect, useRef } from 'react';
import { useQRCode } from 'next-qrcode'
import Link from "next/link";

export default function Account() {
  const { user } = useAuth()
  const imgRef = useRef(null);
  const { Canvas: QRCodeImage } = useQRCode()

async function handleLogout() {
    await fetch('/api/logout', {
      method: 'POST',
    })

    window.location.href = '/'
  }

  return (
    <>
      <div className="flex flex-col items-center justify-top bg-[#ffffff] m-0 p-8 relative h-dvh w-full overflow-y-auto pb-10">
        <div className="flex flex-col rounded-lg border border-gray-200 w-full max-w-md m-6">
          <Link href="/privilege/account/profile" className="flex items-center justify-between hover:bg-gray-100 transition-colors p-4 border-b border-gray-200">
            <div className="text-lg font-bold flex justify-start items-center space-x-4">
              <svg className="w-10" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M470.5 463.6C451.4 416.9 405.5 384 352 384L288 384C234.5 384 188.6 416.9 169.5 463.6C133.9 426.3 112 375.7 112 320C112 205.1 205.1 112 320 112C434.9 112 528 205.1 528 320C528 375.7 506.1 426.2 470.5 463.6zM430.4 496.3C398.4 516.4 360.6 528 320 528C279.4 528 241.6 516.4 209.5 496.3C216.8 459.6 249.2 432 288 432L352 432C390.8 432 423.2 459.6 430.5 496.3zM320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM320 304C297.9 304 280 286.1 280 264C280 241.9 297.9 224 320 224C342.1 224 360 241.9 360 264C360 286.1 342.1 304 320 304zM232 264C232 312.6 271.4 352 320 352C368.6 352 408 312.6 408 264C408 215.4 368.6 176 320 176C271.4 176 232 215.4 232 264z" /></svg>
              <div>{user?.fullname}
                <p className="text-xs font-normal">{user?.phone_no}</p>
              </div>
            </div>
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
          </Link>
          <button className="flex items-center justify-between hover:bg-gray-100 transition-colors p-4  border-b border-gray-200 opacity-50 cursor-not-allowed">
            <div className="text-sm flex justify-start items-center space-x-4">
              <svg className="w-5" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M192 64C209.7 64 224 78.3 224 96L224 128L352 128C369.7 128 384 142.3 384 160C384 177.7 369.7 192 352 192L342.4 192L334 215.1C317.6 260.3 292.9 301.6 261.8 337.1C276 345.9 290.8 353.7 306.2 360.6L356.6 383L418.8 243C423.9 231.4 435.4 224 448 224C460.6 224 472.1 231.4 477.2 243L605.2 531C612.4 547.2 605.1 566.1 589 573.2C572.9 580.3 553.9 573.1 546.8 557L526.8 512L369.3 512L349.3 557C342.1 573.2 323.2 580.4 307.1 573.2C291 566 283.7 547.1 290.9 531L330.7 441.5L280.3 419.1C257.3 408.9 235.3 396.7 214.5 382.7C193.2 399.9 169.9 414.9 145 427.4L110.3 444.6C94.5 452.5 75.3 446.1 67.4 430.3C59.5 414.5 65.9 395.3 81.7 387.4L116.2 370.1C132.5 361.9 148 352.4 162.6 341.8C148.8 329.1 135.8 315.4 123.7 300.9L113.6 288.7C102.3 275.1 104.1 254.9 117.7 243.6C131.3 232.3 151.5 234.1 162.8 247.7L173 259.9C184.5 273.8 197.1 286.7 210.4 298.6C237.9 268.2 259.6 232.5 273.9 193.2L274.4 192L64.1 192C46.3 192 32 177.7 32 160C32 142.3 46.3 128 64 128L160 128L160 96C160 78.3 174.3 64 192 64zM448 334.8L397.7 448L498.3 448L448 334.8z"/></svg>
              <div>ภาษาของระบบ</div>
            </div>
            <div className="flex flex-row justify-end items-center space-x-2">
              <span className="text-sm text-gray-400">ภาษาไทย</span>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
            </div>
          </button>
          <button className="flex items-center justify-between hover:bg-gray-100 transition-colors p-4" onClick={() => { handleLogout() }}>
            <div className="text-sm flex justify-start items-center space-x-4">
              <svg className="w-5" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M224 160C241.7 160 256 145.7 256 128C256 110.3 241.7 96 224 96L160 96C107 96 64 139 64 192L64 448C64 501 107 544 160 544L224 544C241.7 544 256 529.7 256 512C256 494.3 241.7 480 224 480L160 480C142.3 480 128 465.7 128 448L128 192C128 174.3 142.3 160 160 160L224 160zM566.6 342.6C579.1 330.1 579.1 309.8 566.6 297.3L438.6 169.3C426.1 156.8 405.8 156.8 393.3 169.3C380.8 181.8 380.8 202.1 393.3 214.6L466.7 288L256 288C238.3 288 224 302.3 224 320C224 337.7 238.3 352 256 352L466.7 352L393.3 425.4C380.8 437.9 380.8 458.2 393.3 470.7C405.8 483.2 426.1 483.2 438.6 470.7L566.6 342.7z"/></svg>
              <div>ออกจากระบบ</div>
            </div>
            <div className="flex flex-row justify-end items-center space-x-2">
              {/* <span className="text-xs text-gray-400">ออกจากระบบ</span> */}
              {/* <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg> */}
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
