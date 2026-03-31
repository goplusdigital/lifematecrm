"use client"


import Image from "next/image";
import { useAuth } from "../authcontext"
import { Badge, Progress } from "flowbite-react";
import { useEffect, useRef } from 'react';
import { useQRCode } from 'next-qrcode'

export default function Privilege() {
  const { user } = useAuth()
  const imgRef = useRef(null);
  const { Canvas: QRCodeImage } = useQRCode()



  return (
    <>
      <div className="flex flex-col items-center justify-center bg-[#ffffff] rounded-lg shadow-lg m-4 mx-8 mb-8 mt-16 p-8 relative">
        {/* logo circle center - start */}
        <div className="w-24 h-24 rounded-full bg-[#F5CBA7] flex items-center justify-center shadow-md absolute -top-12 left-1/2 transform -translate-x-1/2 overflow-hidden border-4 border-gray-200">
          <Image src={`/logo.jpg`} alt="Logo" width={48} height={48} className='w-full h-full object-cover' />
        </div>
        {/* logo circle center - end */}
        <div className="flex flex-col items-center space-x-4 mb-4 mt-6">
          <h1 className="text-xl font-bold font-prompt text-gray-800">
            {user?.fullname || 'Member Name'}
          </h1>

          <QRCodeImage
            text={user?.phone_no}
            // logo={{
            //   src: `/logo.jpg`,
            //   options: {
            //     width: 35,
             
            //   }
            // }}
            options={{
              errorCorrectionLevel: 'L',
              margin: 3,
              scale: 4,
              width: 350,
              color: {
                dark: '#2a2a2a',
                light: '#FFFFFF',
              },

            }}

          />
          <div className="text-sm font-prompt text-gray-600">กรุณาแสดง QR นี้ให้พนักงานเพื่อสะสมคะแนน</div>
        </div>
        {/* button continue - end */}

      </div>
    </>
  );
}
