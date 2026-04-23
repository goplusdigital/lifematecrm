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
    <div className="min-h-full w-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-base font-semibold font-prompt text-gray-800">แก้ไขโปรไฟล์</h1>
      </div>

      {/* Avatar section */}
      <div className="bg-white flex flex-col items-center py-6 border-b border-gray-100">
        <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mb-2">
          <svg className="w-10 h-10 text-[#F35F1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        {user?.phone_no && (
          <p className="text-sm text-gray-500 font-prompt">{user.phone_no}</p>
        )}
      </div>

      {/* Form */}
      <div className="px-4 py-4 space-y-4 pb-6">
        {/* Fullname */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-xs font-medium font-prompt text-gray-500 mb-1.5 uppercase tracking-wide">
            {t('input_fullname')} <span className="text-red-500 normal-case tracking-normal">*</span>
          </label>
          <input
            type="text"
            className="w-full px-0 py-1.5 border-0 border-b-2 border-gray-200 focus:border-[#F35F1A] focus:outline-none font-prompt text-base text-gray-800 bg-transparent transition-colors"
            value={fullname || ''}
            placeholder="กรอกชื่อ-นามสกุล"
            onChange={(e) => setFullname(e.target.value)}
          />
        </div>

        {/* Email */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-xs font-medium font-prompt text-gray-500 mb-1.5 uppercase tracking-wide">
            {t('input_email')} <span className="text-red-500 normal-case tracking-normal">*</span>
          </label>
          <input
            type="email"
            className="w-full px-0 py-1.5 border-0 border-b-2 border-gray-200 focus:border-[#F35F1A] focus:outline-none font-prompt text-base text-gray-800 bg-transparent transition-colors"
            value={email || ''}
            placeholder="กรอกอีเมล"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Date of birth */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-xs font-medium font-prompt text-gray-500 mb-2 uppercase tracking-wide">
            {t('input_dob')} <span className="text-gray-400 normal-case tracking-normal text-xs">(ไม่บังคับ)</span>
          </label>
          <Datepicker
            className="w-full font-prompt text-sm"
            value={selectedDate}
            onChange={setSelectedDate}
            placeholder="เลือกวันเดือนปีเกิด"
          />
        </div>

        {/* Gender */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-xs font-medium font-prompt text-gray-500 mb-3 uppercase tracking-wide">
            {t('input_gender')} <span className="text-gray-400 normal-case tracking-normal text-xs">(ไม่บังคับ)</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'male', label: t('gender_male'), icon: '♂' },
              { value: 'female', label: t('gender_female'), icon: '♀' },
              { value: 'no-specific', label: t('gender_other'), icon: '⚧' },
            ].map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => setGender(value)}
                className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition-all font-prompt text-sm ${
                  gender === value
                    ? 'border-[#F35F1A] bg-orange-50 text-[#F35F1A] font-semibold'
                    : 'border-gray-200 bg-white text-gray-500'
                }`}
              >
                <span className="text-lg">{icon}</span>
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-600 font-prompt">{error}</p>
          </div>
        )}
      </div>

      {/* Save button */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <button
          onClick={doContinue}
          disabled={loading || !fullname || !email}
          className="w-full bg-[#F35F1A] text-white font-semibold font-prompt py-3.5 rounded-xl text-base disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>กำลังบันทึก...</span>
            </>
          ) : (
            <span>บันทึกข้อมูล</span>
          )}
        </button>
      </div>
    </div>
  );
}
