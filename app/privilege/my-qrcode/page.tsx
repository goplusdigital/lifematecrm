"use client"


import Image from "next/image";
import { useTranslations } from "next-intl";
import { useAuth } from "../authcontext"
import { Badge, Progress } from "flowbite-react";
import { useEffect, useRef, useState } from 'react';
import { useQRCode } from 'next-qrcode'
import QRCodeLoaderPro from "./QRLoader";
import {
  QrcodeCanvas,
  useQrcodeDownload
} from "react-qrcode-pretty";


export default function Privilege() {
  const { user, token } = useAuth()
  const t = useTranslations('my_qrcode')
  const imgRef = useRef(null);
  const { Canvas: QRCodeImage } = useQRCode()
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [qrToken, setQrToken] = useState('');
  const [memberCode, setMemberCode] = useState('');
  // const [setQrcode, download, isReady] = useQrcodeDownload();

  const loadQrCode = () => {
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/qrcode`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      }
    })
      .then(res => res.json())
      .then(data => {
        setQrCodeUrl(`go://${data.member_code}?t=${data.token}`);
        setQrToken(data.token);
        setMemberCode(data.member_code);
        setCountdown(15*60); // reset countdown to 15 minutes
        setLoading(false);
        setTimeout(() => {
          setQrCodeUrl('');
          setQrToken('');
          loadQrCode();
        }, 15*60*1000); // auto refresh after 15 minutes
      })
      .catch(err => {
        console.error('Failed to load QR code', err);
        setLoading(false);
        setTimeout(() => {
          loadQrCode();
        }, 5000); // retry after 5 seconds
      });
  }

  

  useEffect(() => {
   
    const interval = setInterval(() => {
      setCountdown(prevCountdown => prevCountdown > 0 ? prevCountdown - 1 : 0);
      
      if (countdown === 0 && !loading) {
        setQrCodeUrl('');
        setQrToken('');
        loadQrCode();
      }
    }, 1000);

    loadQrCode();

    return () => clearInterval(interval);
  }, []);


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
          <div className="text-lg font-bold font-prompt text-gray-600 mb-0">{t('member_code')}</div>
          <div className="text-xl font-bold font-prompt text-gray-600 mb-0">{memberCode}</div>
          {(!loading) ? <QrcodeCanvas
            value={qrCodeUrl}
            variant={{
              eyes: 'gravity',
              body: 'fluid'
            }}
            color={{
              eyes: '#443722',
              body: '#766d32'
            }}
            colorEffect={{
              eyes: 'shades',
              body: 'gradient-dark-diagonal'
            }}
            // image={`/logo.jpg`}
            padding={16}
            margin={20}
            size={300}
            bgColor='#ffffff'
            bgRounded
            divider
          /> : <QRCodeLoaderPro size={260} cells={33} seed={123} />}
          {/* show countdown */}
          {countdown > 0 && <div className="text-sm font-prompt text-gray-600">
            {`${t('qr_expires_in')} ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}`}
          </div>}

          {/*          
           */}
          
          <div className="text-sm font-prompt text-gray-600">{t('show_qr_to_staff')}</div>
        </div>
        {/* button continue - end */}

      </div>
    </>
  );
}
