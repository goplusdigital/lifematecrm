"use client"
import { useTranslations } from 'next-intl';
import React, { JSX, useState } from "react";
import { useLocale } from '@/lib/locale';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Spinner } from "flowbite-react";
import { Datepicker } from "flowbite-react";

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

  const t = useTranslations('setprofile');

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
        throw new Error('Failed to register');
      }

      // handle successful registration
      console.log('Registration successful');
      router.push('/privilege');
    } catch (error) {
      console.error('Error registering:', error);
    } finally {
      setLoading(false);
    }
  };


  async function handleLogout() {
    await fetch('/api/logout', {
      method: 'POST',
    })

    window.location.href = '/'
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
          {t('set_profile')}
        </h1>
        <p className="text-gray-600 font-prompt mt-2 mb-6 text-center text-sm">
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
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#F35F1A] font-prompt text-sm"
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
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#F35F1A] font-prompt text-sm"
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
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#F35F1A] font-prompt text-sm"
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
          <Datepicker

            className="w-full border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#F35F1A] font-prompt text-sm bg-white text-gray-700"
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
          <div className="flex items-center justify-between gap-4 mb-4">
            <button className={`bg-[#F35F1A] text-gray-800 font-bold py-1 px-4 rounded-md w-full text-center text-md ${gender === 'male' ? 'bg-[#F35F1A] text-white' : 'bg-[#ffffff] border border-gray-300 text-gray-800'}`} onClick={() => { setGender('male') }}>
              <div className="text-center">{t('gender_male')}</div>
            </button>
            <button className={`bg-[#F35F1A] text-gray-800 font-bold py-1 px-4 rounded-md w-full text-center text-md ${gender === 'female' ? 'bg-[#F35F1A] text-white' : 'bg-[#ffffff] border border-gray-300 text-gray-800'}`} onClick={() => { setGender('female') }}>
              <div className="text-center">{t('gender_female')}</div>
            </button>
            {/* <button className={`bg-[#F35F1A] text-gray-800 font-bold py-1 px-4 rounded-md w-full text-center text-md ${gender === 'lgbtq+' ? 'bg-[#F35F1A] text-white' : 'bg-[#ffffff] border border-gray-300 text-gray-800'}`} onClick={() => { setGender('lgbtq+') }}>
              <div className="text-center">{t('gender_lgbtq')}</div>
            </button> */}
            <button className={`bg-[#F35F1A] text-gray-800 font-bold py-1 px-4 rounded-md w-full text-center text-md ${gender === 'no-specific' ? 'bg-[#F35F1A] text-white' : 'bg-[#ffffff] border border-gray-300 text-gray-800'}`} onClick={() => { setGender('no-specific') }}>
              <div className="text-center">{t('gender_other')}</div>
            </button>
          </div>
        </div>
        {/* select gender - end */}
        {/* button continue - start */}
        <button
          disabled={loading || !fullname || !email}
          onClick={() => { doContinue() }}
          className="w-full bg-[#F35F1A] hover:bg-[#e64e0d] text-white font-bold py-3 px-4 rounded-lg transition-colors font-prompt disabled:opacity-50">
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
    </div>
  );
}
