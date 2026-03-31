"use client"
import { useTranslations } from 'next-intl';
import React from "react";
import { useLocale } from '@/lib/locale';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

import AgreementTHContent from '@/lib/agreement/th';
import AgreementENContent from '@/lib/agreement/en';

export default function AgreementAccepted(

) {
  const router = useRouter();
  const { data , setData } = useStore();
  const { locale, setLocale } = useLocale();
  const t = useTranslations('agreement');
  const [acceptedPDPA, setAcceptedPDPA] = React.useState(false);
  const [acceptMarketting, setAcceptMarketting] = React.useState(false);
  const doContinue = () => {
    // send state to next step
    setData('acceptedPDPA', acceptedPDPA);
    setData('acceptMarketting', acceptMarketting);
    setData('locale', locale);
    router.push('/login');
  }
  return (
    <div className="flex flex-col h-dvh w-full overflow-hidden bg-gray-50">

      <header className="flex-none p-2 bg-white border-t border-gray-100">
        <div className="flex justify-between gap-2">
          <div className="flex justify-start gap-2 mb-2">
            <h1 className="text-xl font-bold font-prompt text-gray-800">
              Lifemate CRM
            </h1>
          </div>
          <div className="flex justify-end gap-2 mb-2">
            <button onClick={() => setLocale('th')} className={`px-3 py-1 text-sm font-prompt  rounded ${locale == 'th' ? 'bg-[#F35F1A] text-white' : 'bg-gray-200 text-gray-700'}`}>
              ไทย
            </button>
            <button onClick={() => setLocale('en')} className={`px-3 py-1 text-sm font-prompt  rounded ${locale == 'en' ? 'bg-[#F35F1A] text-white' : 'bg-gray-200 text-gray-700'}`}>
              ENG
            </button>
          </div>
        </div>
        <h1 className="text-md font-bold font-prompt text-gray-800 text-center pt-4">
          {t('termandcondition')}
        </h1>
        {/* <button  onClick={() => setLocale('th')}>[TH]</button>
         <button  onClick={() => setLocale('en')}>[EN]</button> */}
      </header>

      <main className="flex-1 overflow-y-auto p-6 text-gray-600 font-prompt text-xs leading-relaxed">
        <div className="space-y-4">
          {locale == "th" ? <AgreementTHContent /> : <AgreementENContent />}
        </div>
      </main>

      <footer className="flex-none p-4 bg-white border-t border-gray-100 space-y-4">
        <div className="flex items-start gap-3">
          <input type="checkbox" id="agree_pdpa" className="mt-1 h-5 w-5 rounded border-gray-300 text-[#F35F1A] focus:ring-[#F35F1A]" onChange={(e) => setAcceptedPDPA(e.target.checked)} />
          <label htmlFor="agree_pdpa" className="text-xs text-gray-700 font-prompt">
            {t('agree_pdpa')}
          </label>
        </div>
        {/* ยินยอมรับข่าวสารและโปรโมชันพิเศษจาก กลุ่มธุรกิจอำพลฟูดส์และบริษัทในเครือ โดยการแชร์ ชื่อ-นามสกุล เบอร์โทรศัพท์ และอีเมล เพื่อให้เราดูแลคุณได้ดียิ่งขึ้น [อ่านนโยบายความเป็นส่วนตัว] */}
        <div className="flex items-start gap-3">
          <input type="checkbox" id="agree_marketing" className="mt-1 h-5 w-5 rounded border-gray-300 text-[#F35F1A] focus:ring-[#F35F1A]" onChange={(e) => setAcceptMarketting(e.target.checked)} />
          <label htmlFor="agree_marketing" className="text-xs text-gray-700 font-prompt">
            {t('agree_marketing')}
          </label>
        </div>

        <button
          disabled={!acceptedPDPA || !acceptMarketting}
          onClick={() => { doContinue() }}
          className="w-full bg-[#F35F1A] hover:bg-[#e64e0d] text-white font-bold py-3 px-4 rounded-lg transition-colors font-prompt disabled:opacity-50">
          {t('continue')}
        </button>
      </footer>

    </div>
  );
}
