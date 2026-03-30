'use client';

import { NextIntlClientProvider } from "next-intl"
import en from '@/messages/en.json';
import th from '@/messages/th.json';
import {useLocale} from './locale';

export default function IntlProvider({children} : {children: React.ReactNode}) {
  const {locale} = useLocale();
  const messagesMap : any = { en, th };
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messagesMap[locale]}
    >
      {children}
    </NextIntlClientProvider>
  );
}