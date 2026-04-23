"use client"
import { useTranslations } from 'next-intl';
import React from "react";
import { useLocale } from '@/lib/locale';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Spinner } from "flowbite-react";

export default function Login() {
  const OTP_LENGTH = 6;

  const router = useRouter();
  const { data, setData } = useStore();
  const { locale, setLocale } = useLocale();
  const [otpDigits, setOtpDigits] = React.useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const otpRefs = React.useRef<Array<HTMLInputElement | null>>([]);
  const otp = otpDigits.join('');

  const focusOtpInput = (index: number) => {
    otpRefs.current[index]?.focus();
  };

  const resetOtpInput = () => {
    setOtpDigits(Array(OTP_LENGTH).fill(''));
    focusOtpInput(0);
  };

  const handleOtpChange = (index: number, value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    if (!digitsOnly) {
      const nextOtp = [...otpDigits];
      nextOtp[index] = '';
      setOtpDigits(nextOtp);
      return;
    }

    const nextOtp = [...otpDigits];
    const chars = digitsOnly.split('');
    for (let i = 0; i < chars.length && index + i < OTP_LENGTH; i++) {
      nextOtp[index + i] = chars[i];
    }
    setOtpDigits(nextOtp);

    const nextIndex = Math.min(index + chars.length, OTP_LENGTH - 1);
    focusOtpInput(nextIndex);
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Backspace') {
      return;
    }

    event.preventDefault();
    const nextOtp = [...otpDigits];

    if (nextOtp[index]) {
      nextOtp[index] = '';
      setOtpDigits(nextOtp);
      return;
    }

    if (index > 0) {
      nextOtp[index - 1] = '';
      setOtpDigits(nextOtp);
      focusOtpInput(index - 1);
    }
  };

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const pastedDigits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pastedDigits) {
      return;
    }

    const nextOtp = Array(OTP_LENGTH).fill('');
    pastedDigits.split('').forEach((digit, idx) => {
      nextOtp[idx] = digit;
    });
    setOtpDigits(nextOtp);
    focusOtpInput(Math.min(pastedDigits.length - 1, OTP_LENGTH - 1));
  };

  React.useEffect(() => {
    if (typeof window === 'undefined' || !('OTPCredential' in window)) {
      return;
    }

    const abortController = new AbortController();

    (navigator.credentials as any)
      .get({
        otp: { transport: ['sms'] },
        signal: abortController.signal,
      })
      .then((credential: any) => {
        const smsOtp = credential?.code?.replace(/\D/g, '').slice(0, OTP_LENGTH);
        if (!smsOtp) {
          return;
        }

        const nextOtp = Array(OTP_LENGTH).fill('');
        smsOtp.split('').forEach((digit: string, idx: number) => {
          nextOtp[idx] = digit;
        });
        setOtpDigits(nextOtp);
        focusOtpInput(Math.min(smsOtp.length - 1, OTP_LENGTH - 1));
      })
      .catch(() => {
        // Silent fail for unsupported browsers or dismissed permission prompt.
      });

    return () => {
      abortController.abort();
    };
  }, []);
  // countdown timer for OTP
  const [countdown, setCountdown] = React.useState(60);
  React.useEffect(() => {
    focusOtpInput(0);
  }, []);

  React.useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(countdown - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const t = useTranslations('otp');

  const doContinue = () => {
    if (loading) {
      return;
    }
    // validate OTP
    const otpRegex = /^[0-9]{6}$/;
    if (!otpRegex.test(otp)) {
      setError(t('error_invalid_otp'));
      return;
    }
    checkOtp();
  }
  const checkOtp = async () => {
    if (loading) {
      return;
    }
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
        resetOtpInput();
        return;
      }
    } catch (e) {
      setCountdown(0); // stop countdown
      setError(t('invalid_otp'));
      setLoading(false);
      resetOtpInput();
      return;
    }
  }

  React.useEffect(() => {
    if (loading || otp.length !== OTP_LENGTH) {
      return;
    }
    doContinue();
  }, [otp, loading]);

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
        setOtpDigits(Array(OTP_LENGTH).fill(''));
        focusOtpInput(0);
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
        <div className="flex items-center justify-center gap-2 mb-4 w-full" onPaste={handleOtpPaste}>
          {otpDigits.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                otpRefs.current[index] = element;
              }}
              type="tel"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              name={index === 0 ? 'otp' : `otp-${index}`}
              inputMode="numeric"
              pattern="[0-9]*"
              value={digit}
              disabled={loading}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              onFocus={(e) => e.target.select()}
              className="h-12 w-10 rounded-lg border border-gray-300 text-center text-xl font-bold font-prompt focus:outline-none focus:ring-2 focus:ring-[#F35F1A] focus:border-transparent"
              aria-label={`OTP digit ${index + 1}`}
            />
          ))}
        </div>
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
          disabled={otp.length !== OTP_LENGTH || loading}
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
