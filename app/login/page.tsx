"use client"
import { useTranslations } from 'next-intl';
import React from "react";
import { useLocale } from '@/lib/locale';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Spinner } from 'flowbite-react';

export default function Login() {

  const router = useRouter();
  const { data, setData } = useStore();
  const { locale, setLocale } = useLocale();
  const [phone, setPhone] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handlePhoneChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
    setPhone(digitsOnly);
  };
 

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
      setLoading(true);
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
        setLoading(false);
      }
    } catch (e) {
      setError(t('error_request_otp_failed'));
      setLoading(false);
      return;
    }

  }

  return (
    <div className="ci-bg flex flex-col h-dvh w-full overflow-hidden">
      <div className="ci-card flex flex-col items-center justify-center rounded-xl m-5 mx-7 mb-8 mt-18 p-8 relative">
        {/* logo circle center - start */}
        <div className="w-24 h-24 rounded-full bg-[#f4f0e6] flex items-center justify-center shadow-md absolute -top-12 left-1/2 transform -translate-x-1/2 overflow-hidden border-4 border-[#e4e0d4]">
          <Image src="/logo.jpg" alt="Logo" width={48} height={48} className='w-full h-full object-cover' />
        </div>
        {/* logo circle center - end */}
        <h1 className="text-[24px] leading-none font-black font-prompt text-gray-900 mt-12 tracking-tight text-center">
          {t('login/register')}
        </h1>
        <p className="text-gray-600 font-prompt mt-2 mb-6 text-center text-sm max-w-[18rem]">
          {t('text_login/register')}
        </p>
        {/* input phone number - start */}
        <input
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={10}
          readOnly={loading}
          placeholder={t('placeholder_phone')}
          className="border border-[#d8d4c8] rounded-lg font-bold py-3 px-4 w-full mb-4 font-prompt focus:outline-none focus:ring-2 focus:ring-[var(--ci-orange)] focus:border-transparent text-xl bg-white"
          value={phone}
          onChange={(e) => handlePhoneChange(e.target.value)}
        />
        {error && <p className="text-red-500 text-sm mb-4 font-prompt text-xs">{error}</p>}
        {/* input phone number - end */}
        {/* button continue - start */}
        <button
          disabled={!phone || loading}
          onClick={() => { doContinue() }}
          className="ci-btn-primary w-full text-white font-bold py-3 px-4 rounded-lg transition-colors font-prompt disabled:opacity-50">
          {loading && <Spinner className="mr-2 inline" size="sm" light />}
          {t('continue')}{loading && <>...</>}
        </button>
        {/* button continue - end */}
        
      </div>
    </div>
  );
}
