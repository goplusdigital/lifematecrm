"use client"


import Image from "next/image";
import { useAuth } from "../../authcontext"
import { Badge, Datepicker, Progress } from "flowbite-react";
import { useEffect, useRef, useState } from 'react';
import { useQRCode } from 'next-qrcode'
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Swal from 'sweetalert2'


export default function Account() {
  const { user ,token} = useAuth()
  const router = useRouter();
  const imgRef = useRef(null);
  const { Canvas: QRCodeImage } = useQRCode()
  const [selectedDate, setSelectedDate] = useState<Date | null>(user?.dob ? new Date(user.dob) : null);
  const [gender, setGender] = useState(user?.gender || 'no-specific');
  const [email, setEmail] = useState(user?.email || '');
  const [fullname, setFullname] = useState(user?.fullname || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    // router.push('/setprofile/confirm');
    console.log('data to submit', { phone: user?.phone_no, fullname, email, dob: selectedDate ? formatDateLocal(selectedDate) : null, gender });

    // call API to submit data
    submitData();
  }

  const submitData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/updateprofile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone_no: user?.phone_no,
          fullname,
          email,
          dob: selectedDate ? formatDateLocal(selectedDate) : null,
          gender,
        }),
      });

      if (!res.ok) {
        Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Error updating profile. Please try again later."
      });
      }else{
        console.log('Profile update successful');
        window.location.href = '/privilege/account';
      }

      // handle successful update
      
    } catch (error) {
      console.error('Error updating profile:', error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Error updating profile. Please try again later."
      });
    } finally {
      setLoading(false);
    }
  };





  
  const t = useTranslations('setprofile');

  return (
    <>
      <div className="flex flex-col items-center justify-top bg-[#ffffff] m-0 p-8 relative h-dvh w-full overflow-y-auto pb-10">
        <div className="flex flex-col rounded-lg border border-gray-200 w-full max-w-md m-6 p-6">
          <p className="text-xl font-bold font-prompt text-center m-4">ตั้งค่าโปรไฟล์</p>
          {/* <div className="flex flex-col w-full mb-2">
            <label className="text-sm font-prompt text-gray-600 mb-1">เบอร์โทรศัพท์</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#F35F1A] font-prompt text-sm bg-gray-100 cursor-not-allowed"
              value={user?.phone_no || ''}
              readOnly
            />
          </div> */}
          <div className="flex flex-col w-full mb-2">
            <label className="text-sm font-prompt text-gray-600 mb-2">{t('input_fullname')} <i className="text-red-500">*</i></label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#F35F1A] font-prompt text-sm"
              value={fullname || ''}
              onChange={(e) => setFullname(e.target.value)}
              
            />
          </div>
          <div className="flex flex-col w-full mb-4">
            <label className="text-sm font-prompt text-gray-600 mb-2"> {t('input_email')} <i className="text-red-500">*</i></label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#F35F1A] font-prompt text-sm"
              value={email || ''}
              onChange={(e) => setEmail(e.target.value)}
              
            />
          </div>
          <div className="flex flex-col w-full mb-4">
            <label className="text-sm font-prompt text-gray-600 mb-2">{t('input_dob')} <i className="text-gray-500">(ไม่บังคับ)</i></label>
            <Datepicker

              className="w-full border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#F35F1A] font-prompt text-sm bg-white text-gray-700"
              value={selectedDate}
              onChange={setSelectedDate}
              placeholder="เลือกวันเดือนปีเกิด"
            />
          </div>

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

        <div className="flex items-center justify-center gap-4 mt-2">
          <button  className="bg-[#F35F1A] text-white font-bold py-2 px-4 rounded-lg w-full text-center text-md py-3 disabled:opacity-50" disabled={loading || !fullname || !email} onClick={() => { doContinue() }}>
            บันทึกข้อมูล
          </button>
        </div>
        
        </div>
      </div>
    </>
  );
}
