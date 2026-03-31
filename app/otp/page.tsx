"use client"
import { useTranslations } from 'next-intl';
import React from "react";
import { useLocale } from '@/lib/locale';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Spinner } from "flowbite-react";

export default function Login() {

  const router = useRouter();
  const { data, setData } = useStore();
  const { locale, setLocale } = useLocale();
  const [otp, setOtp] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  // countdown timer for OTP
  const [countdown, setCountdown] = React.useState(60);
  React.useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(countdown - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const t = useTranslations('otp');

  const doContinue = () => {
    // validate OTP
    const otpRegex = /^[0-9]{6}$/;
    if (!otpRegex.test(otp)) {
      setError(t('error_invalid_otp'));
      return;
    }
    checkOtp();
  }
  const checkOtp = async () => {
    try {
      setError(''); // clear previous error
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/otp/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_no: data.phone,
          otp: otp,
          ref_code: data.ref_code,
        }),
      });
      if (res.ok) {
        // setCountdown(0); // stop countdown
        setData('isAuthenticated', true);
        router.push('/setprofile');
        
      } else {
        setError(t('invalid_otp'));
        setLoading(false);
        // focus input        return;
        document.querySelector('input')?.focus();
        return;
      }
    } catch (e) {
      setCountdown(0); // stop countdown
      setError(t('invalid_otp'));
      setLoading(false);
      document.querySelector('input')?.focus();
        return;
    }
  }

  const requestOtp = async () => {
    try {
      setLoading(true);
      setError(''); // clear previous error
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/otp/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_no: data.phone,
        }),
      });
      if (res.ok) {
        // ref_code to store
        const resData = await res.json();
        setCountdown(60); // stop countdown
        setData('ref_code', resData.ref_code);
      } else {
        setCountdown(60); // stop countdown
        setError(t('error_request_otp_failed'));
      }
    } catch (e) {
      setCountdown(60); // stop countdown
      setError(t('error_request_otp_failed'));
      return;
    } finally {
      setLoading(false);
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
          {t('confirm_otp')}
        </h1>
        <p className="text-gray-600 font-prompt mt-2 mb-6 text-center text-sm">
          {t('text_confirm_otp', { phone: data.phone?.replace(/(\d{3})(\d{3})(\d{4})/, '$1***$3') })}
        </p>
        {/* input OTP - start */}
        <input
          type="tel"
          placeholder={t('placeholder_otp')}
          className="border border-gray-300 rounded-lg font-bold py-3 px-4 w-full mb-4 font-prompt focus:outline-none focus:ring-2 focus:ring-[#F35F1A] focus:border-transparent text-xl text-center tracking-widest"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          disabled={loading}
        />
        <div className='flex flex-row  justify-between w-full mb-4'>
          <p className="text-gray-600 font-prompt  text-center text-sm">
            Ref : {data.ref_code}
          </p>
          {countdown > 0 ? (
            <p className="text-gray-600 font-prompt  text-center text-sm">
              {t('resend_otp_in')} {countdown}s
            </p>
          ) : (
            <button onClick={() => requestOtp()} className="text-[#F35F1A] font-prompt text-sm" disabled={loading}>
              {t('resend_otp')}
            </button>
          )}
        </div>
        {error && <p className="text-red-500 text-sm mb-4  font-prompt text-xs">{error}</p>}
        {/* input OTP - end */}
        {/* button continue - start */}
        <button
          disabled={!otp || otp.length != 6 || loading}
          onClick={() => { doContinue() }}
          className="w-full bg-[#F35F1A] hover:bg-[#e64e0d] text-white font-bold py-3 px-4 rounded-lg transition-colors font-prompt disabled:opacity-50">
          {loading && <Spinner className="mr-2" size="sm" light />}
          {t('continue')}{loading && <>...</>}
        </button>
        {/* button continue - end */}
        {/* link back to change phone number - start */}
        <button className="text-gray-600 font-prompt mt-4 mb-6 text-center text-sm underline cursor-pointer" onClick={() => router.push('/login')} disabled={loading}>
          {t('text_change_phone')}
        </button>
        {/* link back to change phone number - end */}
      </div>
    </div>
  );
}
