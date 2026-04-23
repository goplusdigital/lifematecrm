"use client"


import { useAuth } from "../authcontext"
import Link from "next/link";
import { useLocale } from '@/lib/locale';
import { useTranslations } from "next-intl";
import { useState } from "react";
import AgreementTHContent from '@/lib/agreement/th';
import AgreementENContent from '@/lib/agreement/en';

export default function Account() {
  const { user } = useAuth()
  const { locale, setLocale } = useLocale();
  const t = useTranslations('account');
  const tAgreement = useTranslations('agreement');
  const [showTerms, setShowTerms] = useState(false);

async function handleLogout() {
    await fetch('/api/logout', {
      method: 'POST',
    })

    window.location.href = '/'
  }

  return (
    <>
      <div className="flex flex-col items-center justify-top bg-[#ffffff] m-0 p-8 relative h-dvh w-full overflow-y-auto pb-10">
        <div className="flex flex-col rounded-lg border border-gray-200 w-full max-w-md m-6">
          <Link href="/privilege/account/profile" className="flex items-center justify-between hover:bg-gray-100 transition-colors p-4 border-b border-gray-200">
            <div className="text-lg font-bold flex justify-start items-center space-x-4">
              <svg className="w-10" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M470.5 463.6C451.4 416.9 405.5 384 352 384L288 384C234.5 384 188.6 416.9 169.5 463.6C133.9 426.3 112 375.7 112 320C112 205.1 205.1 112 320 112C434.9 112 528 205.1 528 320C528 375.7 506.1 426.2 470.5 463.6zM430.4 496.3C398.4 516.4 360.6 528 320 528C279.4 528 241.6 516.4 209.5 496.3C216.8 459.6 249.2 432 288 432L352 432C390.8 432 423.2 459.6 430.5 496.3zM320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM320 304C297.9 304 280 286.1 280 264C280 241.9 297.9 224 320 224C342.1 224 360 241.9 360 264C360 286.1 342.1 304 320 304zM232 264C232 312.6 271.4 352 320 352C368.6 352 408 312.6 408 264C408 215.4 368.6 176 320 176C271.4 176 232 215.4 232 264z" /></svg>
              <div>{user?.fullname}
                <p className="text-xs font-normal">รหัสสมาชิก {user?.member_code}</p>
              </div>
            </div>
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
          </Link>
          <div className="flex items-center justify-between p-4 border-b border-gray-200 gap-4">
            <div className="text-sm flex justify-start items-center space-x-4">
              <svg className="w-5" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M192 64C209.7 64 224 78.3 224 96L224 128L352 128C369.7 128 384 142.3 384 160C384 177.7 369.7 192 352 192L342.4 192L334 215.1C317.6 260.3 292.9 301.6 261.8 337.1C276 345.9 290.8 353.7 306.2 360.6L356.6 383L418.8 243C423.9 231.4 435.4 224 448 224C460.6 224 472.1 231.4 477.2 243L605.2 531C612.4 547.2 605.1 566.1 589 573.2C572.9 580.3 553.9 573.1 546.8 557L526.8 512L369.3 512L349.3 557C342.1 573.2 323.2 580.4 307.1 573.2C291 566 283.7 547.1 290.9 531L330.7 441.5L280.3 419.1C257.3 408.9 235.3 396.7 214.5 382.7C193.2 399.9 169.9 414.9 145 427.4L110.3 444.6C94.5 452.5 75.3 446.1 67.4 430.3C59.5 414.5 65.9 395.3 81.7 387.4L116.2 370.1C132.5 361.9 148 352.4 162.6 341.8C148.8 329.1 135.8 315.4 123.7 300.9L113.6 288.7C102.3 275.1 104.1 254.9 117.7 243.6C131.3 232.3 151.5 234.1 162.8 247.7L173 259.9C184.5 273.8 197.1 286.7 210.4 298.6C237.9 268.2 259.6 232.5 273.9 193.2L274.4 192L64.1 192C46.3 192 32 177.7 32 160C32 142.3 46.3 128 64 128L160 128L160 96C160 78.3 174.3 64 192 64zM448 334.8L397.7 448L498.3 448L448 334.8z"/></svg>
              <div>{t('system_language')}</div>
            </div>
            <div className="flex flex-row justify-end items-center gap-2">
              <button
                type="button"
                onClick={() => setLocale('th')}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  locale === 'th'
                    ? 'bg-[var(--ci-orange)] text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                ภาษาไทย
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  locale === 'en'
                    ? 'bg-[var(--ci-orange)] text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                English
              </button>
            </div>
          </div>
          <button className="flex items-center justify-between hover:bg-gray-100 transition-colors p-4 border-b border-gray-200 w-full text-left" onClick={() => setShowTerms(true)}>
            <div className="text-sm flex justify-start items-center space-x-4">
              <svg className="w-5" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M160 64C124.7 64 96 92.7 96 128L96 512C96 547.3 124.7 576 160 576L480 576C515.3 576 544 547.3 544 512L544 256L384 256C366.3 256 352 241.7 352 224L352 64L160 64zM416 64L416 192L544 192L416 64zM160 0L384 0L544 160L544 512C544 580.7 488.7 640 416 640L160 640C87.3 640 32 580.7 32 512L32 128C32 59.3 87.3 0 160 0zM224 320C241.7 320 256 334.3 256 352C256 369.7 241.7 384 224 384C206.3 384 192 369.7 192 352C192 334.3 206.3 320 224 320zM224 416C259.3 416 288 387.3 288 352C288 316.7 259.3 288 224 288C188.7 288 160 316.7 160 352C160 387.3 188.7 416 224 416zM192 448L256 448C299.3 448 336 484.7 336 528C336 537.6 343.9 544 352 544C360.1 544 368 537.6 368 528C368 467.1 318.9 416 256 416L192 416C129.1 416 80 467.1 80 528C80 537.6 87.9 544 96 544C104.1 544 112 537.6 112 528C112 484.7 148.7 448 192 448zM352 320L448 320C465.7 320 480 334.3 480 352C480 369.7 465.7 384 448 384L352 384C334.3 384 320 369.7 320 352C320 334.3 334.3 320 352 320zM352 416L416 416C433.7 416 448 430.3 448 448C448 465.7 433.7 480 416 480L352 480C334.3 480 320 465.7 320 448C320 430.3 334.3 416 352 416z"/></svg>
              <div>{tAgreement('termandcondition')}</div>
            </div>
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
          </button>
          <button className="flex items-center justify-between hover:bg-gray-100 transition-colors p-4" onClick={() => { handleLogout() }}>
            <div className="text-sm flex justify-start items-center space-x-4">
              <svg className="w-5" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M224 160C241.7 160 256 145.7 256 128C256 110.3 241.7 96 224 96L160 96C107 96 64 139 64 192L64 448C64 501 107 544 160 544L224 544C241.7 544 256 529.7 256 512C256 494.3 241.7 480 224 480L160 480C142.3 480 128 465.7 128 448L128 192C128 174.3 142.3 160 160 160L224 160zM566.6 342.6C579.1 330.1 579.1 309.8 566.6 297.3L438.6 169.3C426.1 156.8 405.8 156.8 393.3 169.3C380.8 181.8 380.8 202.1 393.3 214.6L466.7 288L256 288C238.3 288 224 302.3 224 320C224 337.7 238.3 352 256 352L466.7 352L393.3 425.4C380.8 437.9 380.8 458.2 393.3 470.7C405.8 483.2 426.1 483.2 438.6 470.7L566.6 342.7z"/></svg>
              <div>{t('logout')}</div>
            </div>
            <div className="flex flex-row justify-end items-center space-x-2">
              {/* <span className="text-xs text-gray-400">ออกจากระบบ</span> */}
              {/* <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg> */}
            </div>
          </button>
        </div>
      </div>

      {showTerms && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 flex-none">
            <button
              type="button"
              onClick={() => setShowTerms(false)}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-700"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h2 className="text-base font-bold font-prompt text-gray-900">{tAgreement('termandcondition')}</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 text-[13px] text-gray-700 font-prompt leading-relaxed">
            <div className="space-y-4">
              {locale === 'th' ? <AgreementTHContent /> : <AgreementENContent />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
