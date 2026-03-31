"use client"
import { useTranslations } from 'next-intl';
import React from "react";
import { useLocale } from '@/lib/locale';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Login() {

  const router = useRouter();
  const { data, setData } = useStore();
  const { locale, setLocale } = useLocale();
  const [phone, setPhone] = React.useState('');
  const [error, setError] = React.useState('');
 

  const t = useTranslations('agreement');

  const doContinue = () => {
    // validate phone number
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      setError(t('error_invalid_phone'));
      return;
    }
    // send state to next step
    setData('phone', phone);
    requestOtp(); // call requestOtp after setting data

  }
  const requestOtp = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/otp/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_no: phone,
        }),
      });
      if (res.ok) {
        // ref_code to store
        const resData = await res.json();
        setData('ref_code', resData.ref_code);
        router.push('/otp');
      } else {
        setError(t('error_request_otp_failed'));
      }
    } catch (e) {
      setError(t('error_request_otp_failed'));
      return;
    }

  }

  return (
    <div className="flex flex-col h-dvh w-full overflow-hidden bg-[#EEE9E1]">
      <div className="flex flex-col items-center justify-center bg-[#ffffff] rounded-lg shadow-lg m-4 mx-8 mb-8 mt-16 p-8 relative">
        {/* logo circle center - start */}
        <div className="w-24 h-24 rounded-full bg-[#F5CBA7] flex items-center justify-center shadow-md absolute -top-12 left-1/2 transform -translate-x-1/2 overflow-hidden border-4 border-gray-200">
          <Image src="/logo.jpg" alt="Logo" width={48} height={48} className='w-full h-full object-cover' />
        </div>
        {/* logo circle center - end */}
        <h1 className="text-xl font-bold font-prompt text-gray-800 mt-12">
          {t('login/register')}
        </h1>
        <p className="text-gray-600 font-prompt mt-2 mb-6 text-center text-sm">
          {t('text_login/register')}
        </p>
        {/* input phone number - start */}
        <input
          type="tel"
          placeholder={t('placeholder_phone')}
          className="border border-gray-300 rounded-lg font-bold py-3 px-4 w-full mb-4 font-prompt focus:outline-none focus:ring-2 focus:ring-[#F35F1A] focus:border-transparent text-xl"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        {error && <p className="text-red-500 text-sm mb-4 font-prompt text-xs">{error}</p>}
        {/* input phone number - end */}
        {/* button continue - start */}
        <button
          disabled={!phone}
          onClick={() => { doContinue() }}
          className="w-full bg-[#F35F1A] hover:bg-[#e64e0d] text-white font-bold py-3 px-4 rounded-lg transition-colors font-prompt disabled:opacity-50">
          {t('continue')}
        </button>
        {/* button continue - end */}
        
      </div>
    </div>
  );
}
