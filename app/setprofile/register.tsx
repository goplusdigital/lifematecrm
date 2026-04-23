"use client"
import { useTranslations } from 'next-intl';
import React, { useState } from "react";
import { useLocale } from '@/lib/locale';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Spinner } from "flowbite-react";
import DobDatePicker from '@/app/components/DobDatePicker';
import Swal from 'sweetalert2';

export default function RegisterForm({ phone , token }: { phone: any , token: any }) : any {

  const router = useRouter();
  const { data, setData } = useStore();
  const { locale, setLocale } = useLocale();
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [gender, setGender] = React.useState('no-specific');
  const [email, setEmail] = React.useState('');
  const [fullname, setFullname] = React.useState('');
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);

  const t = useTranslations('setprofile');

  const mapRegisterErrorMessage = (errorCode?: string, fallback?: string) => {
    switch (errorCode) {
      case 'EMAIL_ALREADY_EXISTS':
        return t('error_email_exists');
      case 'PHONE_MISMATCH':
      case 'INVALID_PAYLOAD':
      case 'INVALID_TOKEN':
      case 'UNAUTHORIZED':
        return t('error_session_expired');
      case 'FULLNAME_REQUIRED':
        return t('error_fullname_required');
      default:
        return fallback || t('error_register_failed');
    }
  };

  function formatDateLocal(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  const doContinue = () => {
    // validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      setError(t('error_invalid_email'));
      return;
    }
    // validate fullname    
    if (fullname.trim().length === 0) {
      setError(t('error_fullname_required'));
      return;
    }

    setError('');
    // send state to next step
    setData('phone', phone);
    setData('fullname', fullname);
    setData('email', email);
    setData('dob', selectedDate ? formatDateLocal(selectedDate) : null);
    setData('gender', gender);
    // router.push('/setprofile/confirm');
    console.log('data to submit', { phone, fullname, email, dob: selectedDate ? formatDateLocal(selectedDate) : null, gender });

    // call API to submit data
    submitData();
  }

  const submitData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone_no: phone,
          fullname,
          email,
          dob: selectedDate ? formatDateLocal(selectedDate) : null,
          gender,
        }),
      });

      if (!res.ok) {
        let responseData: any = null;
        try {
          responseData = await res.json();
        } catch (parseError) {
          responseData = null;
        }

        const errorMessage = mapRegisterErrorMessage(responseData?.errorCode, responseData?.error);
        await Swal.fire({
          icon: 'error',
          title: t('error_title'),
          text: errorMessage,
        });
        return;
      }

      // handle successful registration
      console.log('Registration successful');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error registering:', error);
      await Swal.fire({
        icon: 'error',
        title: t('error_title'),
        text: t('error_register_failed'),
      });
    } finally {
      setLoading(false);
    }
  };


  async function handleLogout() {
    try {
      const res = await fetch('/api/logout', {
        method: 'POST',
      });
      
      if (res.ok) {
        // Clear any local storage if needed
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    router.push('/privilege');
  };


  return (
    <div className="ci-bg flex flex-col h-dvh w-full overflow-y-auto">
      <div className="ci-card flex flex-col items-center justify-center rounded-xl m-5 mx-7 mb-8 mt-18 p-8 relative">
        {/* logo circle center - start */}
        <div className="w-24 h-24 rounded-full bg-[#f4f0e6] flex items-center justify-center shadow-md absolute -top-12 left-1/2 transform -translate-x-1/2 overflow-hidden border-4 border-[#e4e0d4]">
          <Image src="/logo.jpg" alt="Logo" width={48} height={48} className='w-full h-full object-cover' />
        </div>
        {/* logo circle center - end */}
        <h1 className="text-[30px] leading-none font-black font-prompt text-gray-900 mt-12 tracking-tight text-center">
          {t('set_profile')}
        </h1>
        <p className="text-gray-600 font-prompt mt-2 mb-6 text-center text-sm max-w-[18rem]">
          {t('text_set_profile')}
        </p>
        {/* input phone - start */}
        <div className="w-full">
          <label className="block text-gray-700 font-prompt text-sm mb-2" htmlFor="phone">
            {t('input_phone')} <i className="text-red-500">*</i>
          </label>
          <input
            type="tel"
            placeholder={t('input_phone')}
            className="w-full border border-[#d8d4c8] rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[var(--ci-orange)] font-prompt text-sm bg-white"
            value={phone}
            readOnly
          />
        </div>
        {/* input phone - end */}
        {/* input fullname - start */}
        <div className="w-full">
          <label className="block text-gray-700 font-prompt text-sm mb-2" htmlFor="fullname">
            {t('input_fullname')} <i className="text-red-500">*</i>
          </label>
          <input
            type="text"
            placeholder={t('input_fullname')}
            className="w-full border border-[#d8d4c8] rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[var(--ci-orange)] font-prompt text-sm bg-white"
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
          />
        </div>
        {/* input fullname - end */}

        {/* input email - start */}
        <div className="w-full">
          <label className="block text-gray-700 font-prompt text-sm mb-2" htmlFor="email">
            {t('input_email')} <i className="text-red-500">*</i>
          </label>
          <input
            type="email"
            placeholder={t('input_email')}
            className="w-full border border-[#d8d4c8] rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[var(--ci-orange)] font-prompt text-sm bg-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {/* input email - end */}
        {/* input date of birth - start */}
        <div className="w-full">
          <label className="block text-gray-700 font-prompt text-sm mb-2" htmlFor="dob">
            {t('input_dob')} <i className="text-gray-500">(ไม่บังคับ)</i>
          </label>
          <DobDatePicker
            locale={locale}
            value={selectedDate}
            onChange={setSelectedDate}
            placeholder={t('input_dob')}
          />
        </div>
        {/* input date of birth - end */}
        {/* select gender - start */}
        <div className="w-full mb-4">
          <label className="block text-gray-700 font-prompt text-sm mb-2" htmlFor="gender">
            {t('input_gender')} <i className="text-gray-500">(ไม่บังคับ)</i>
          </label>
          <div className="flex items-center justify-between gap-4 mb-4 font-prompt">
            <button className={`font-bold py-1 px-4 rounded-md w-full text-center text-md transition-colors ${gender === 'male' ? 'ci-btn-primary text-white' : 'bg-[#ffffff] border border-[#d8d4c8] text-gray-800 hover:border-[var(--ci-orange)]'}`} onClick={() => { setGender('male') }}>
              <div className="text-center">{t('gender_male')}</div>
            </button>
            <button className={`font-bold py-1 px-4 rounded-md w-full text-center text-md transition-colors ${gender === 'female' ? 'ci-btn-primary text-white' : 'bg-[#ffffff] border border-[#d8d4c8] text-gray-800 hover:border-[var(--ci-orange)]'}`} onClick={() => { setGender('female') }}>
              <div className="text-center">{t('gender_female')}</div>
            </button>
            {/* <button className={`bg-[#F35F1A] text-gray-800 font-bold py-1 px-4 rounded-md w-full text-center text-md ${gender === 'lgbtq+' ? 'bg-[#F35F1A] text-white' : 'bg-[#ffffff] border border-gray-300 text-gray-800'}`} onClick={() => { setGender('lgbtq+') }}>
              <div className="text-center">{t('gender_lgbtq')}</div>
            </button> */}
            <button className={`font-bold py-1 px-4 rounded-md w-full text-center text-md transition-colors ${gender === 'no-specific' ? 'ci-btn-primary text-white' : 'bg-[#ffffff] border border-[#d8d4c8] text-gray-800 hover:border-[var(--ci-orange)]'}`} onClick={() => { setGender('no-specific') }}>
              <div className="text-center">{t('gender_other')}</div>
            </button>
          </div>
        </div>
        {/* select gender - end */}
        {/* button continue - start */}
        <button
          disabled={loading || !fullname || !email}
          onClick={() => { doContinue() }}
          className="ci-btn-primary w-full text-white font-bold py-3 px-4 rounded-lg transition-colors font-prompt disabled:opacity-50">
          {loading && <Spinner className="mr-2" size="sm" light />}
          {t('continue')}{loading && <>...</>}
        </button>
        {/* button continue - end */}
        {/* link back to change phone number - start */}
        <button className="text-gray-600 font-prompt mt-4 mb-6 text-center text-sm underline cursor-pointer" onClick={handleLogout} disabled={loading}>
          {t('logout')}
        </button>
        {/* link back to change phone number - end */}
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-y-auto px-4">
          <div className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px]" />
          <div className="relative w-full max-w-[600px] rounded-3xl bg-white p-5 lg:p-10">
            <button
              onClick={handleCloseSuccessModal}
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 sm:right-6 sm:top-6 sm:h-11 sm:w-11"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z"
                  fill="currentColor"
                />
              </svg>
            </button>
            <div className="text-center">
              <div className="relative z-10 mb-7 flex items-center justify-center">
                <svg className="fill-green-100" width="90" height="90" viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">
                  <path d="M34.364 6.85053C38.6205 -2.28351 51.3795 -2.28351 55.636 6.85053C58.0129 11.951 63.5594 14.6722 68.9556 13.3853C78.6192 11.0807 86.5743 21.2433 82.2185 30.3287C79.7862 35.402 81.1561 41.5165 85.5082 45.0122C93.3019 51.2725 90.4628 63.9451 80.7747 66.1403C75.3648 67.3661 71.5265 72.2695 71.5572 77.9156C71.6123 88.0265 60.1169 93.6664 52.3918 87.3184C48.0781 83.7737 41.9219 83.7737 37.6082 87.3184C29.8831 93.6664 18.3877 88.0266 18.4428 77.9156C18.4735 72.2695 14.6352 67.3661 9.22531 66.1403C-0.462787 63.9451 -3.30193 51.2725 4.49185 45.0122C8.84391 41.5165 10.2138 35.402 7.78151 30.3287C3.42572 21.2433 11.3808 11.0807 21.0444 13.3853C26.4406 14.6722 31.9871 11.951 34.364 6.85053Z" />
                </svg>
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <svg className="fill-green-600" width="38" height="38" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M5.9375 19.0004C5.9375 11.7854 11.7864 5.93652 19.0014 5.93652C26.2164 5.93652 32.0653 11.7854 32.0653 19.0004C32.0653 26.2154 26.2164 32.0643 19.0014 32.0643C11.7864 32.0643 5.9375 26.2154 5.9375 19.0004ZM19.0014 2.93652C10.1296 2.93652 2.9375 10.1286 2.9375 19.0004C2.9375 27.8723 10.1296 35.0643 19.0014 35.0643C27.8733 35.0643 35.0653 27.8723 35.0653 19.0004C35.0653 10.1286 27.8733 2.93652 19.0014 2.93652ZM24.7855 17.0575C25.3713 16.4717 25.3713 15.522 24.7855 14.9362C24.1997 14.3504 23.25 14.3504 22.6642 14.9362L17.7177 19.8827L15.3387 17.5037C14.7529 16.9179 13.8031 16.9179 13.2173 17.5037C12.6316 18.0894 12.6316 19.0392 13.2173 19.625L16.657 23.0647C16.9383 23.346 17.3199 23.504 17.7177 23.504C18.1155 23.504 18.4971 23.346 18.7784 23.0647L24.7855 17.0575Z"
                    />
                  </svg>
                </span>
              </div>
              <h4 className="mb-2 text-2xl font-semibold text-gray-800 sm:text-title-sm">{t('success_title')}</h4>
              <p className="text-sm leading-6 text-gray-500">{t('success_register_text')}</p>
              <div className="mt-7 flex w-full items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleCloseSuccessModal}
                  className="ci-btn-primary w-full px-4 py-3 text-sm font-medium text-white sm:w-auto"
                >
                  {t('success_button')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
