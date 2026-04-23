"use client"
import { useTranslations } from 'next-intl';
import React from "react";
import { useLocale } from '@/lib/locale';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Spinner } from 'flowbite-react';

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
  const [loading, setLoading] = React.useState(false);
  const doContinue = () => {
    setLoading(true);
    // send state to next step
    setData('acceptedPDPA', acceptedPDPA);
    setData('acceptMarketting', acceptMarketting);
    setData('locale', locale);
    router.push('/login');
  }
  return (
    <div className="ci-bg flex flex-col h-dvh w-full overflow-hidden">

      <header className="flex-none  pb-3 bg-transparent">
        <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex justify-start gap-2">
            <Image src="/logolf-2.png" alt="Lifemate CRM" width={420} height={106} className="h-[24px] w-auto object-contain" priority />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setLocale('th')} className={`px-3.5 py-1.5 text-sm font-semibold rounded-full transition-colors ${locale == 'th' ? 'ci-pill-active' : 'ci-pill-inactive'}`}>
              ไทย
            </button>
            <button onClick={() => setLocale('en')} className={`px-3.5 py-1.5 text-sm font-semibold rounded-full transition-colors ${locale == 'en' ? 'ci-pill-active' : 'ci-pill-inactive'}`}>
              ENG
            </button>
          </div>
        </div>
        </div>
        <h1 className="text-base font-bold font-prompt text-gray-900 text-center pt-4 tracking-tight">
          {t('termandcondition')}
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pb-4 text-[13px] text-gray-700 font-prompt leading-relaxed">
        <div className="space-y-4">
          {locale == "th" ? <AgreementTHContent /> : <AgreementENContent />}
        </div>
      </main>

      <footer className="flex-none p-5 bg-[var(--ci-surface)] border-t border-[#dfdacd] space-y-4">
        <div className="flex items-start gap-3">
          <input type="checkbox" id="agree_pdpa" className="mt-1 h-5 w-5 rounded border-gray-300 text-[var(--ci-orange)] focus:ring-[var(--ci-orange)]" onChange={(e) => setAcceptedPDPA(e.target.checked)} />
          <label htmlFor="agree_pdpa" className="text-xs text-gray-700 font-prompt">
            {t('agree_pdpa')}
          </label>
        </div>
        <div className="flex items-start gap-3">
          <input type="checkbox" id="agree_marketing" className="mt-1 h-5 w-5 rounded border-gray-300 text-[var(--ci-orange)] focus:ring-[var(--ci-orange)]" onChange={(e) => setAcceptMarketting(e.target.checked)} />
          <label htmlFor="agree_marketing" className="text-xs text-gray-700 font-prompt">
            {t('agree_marketing')}
          </label>
        </div>

        <button
          disabled={!acceptedPDPA || !acceptMarketting || loading}
          onClick={() => { doContinue() }}
          className="ci-btn-primary w-full text-white font-bold py-3 px-4 rounded-lg transition-colors font-prompt disabled:opacity-50">
          {loading && <Spinner className="mr-2 inline" size="sm" light />}
          {t('continue')}{loading && <>...</>}
        </button>
      </footer>

    </div>
  );
}
