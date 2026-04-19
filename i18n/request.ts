import {getRequestConfig} from 'next-intl/server';
import {defineRouting} from 'next-intl/routing';
import {defaultTimeZone} from '@/lib/i18n';
 
export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'th'],
 
  // Used when no locale matches
  defaultLocale: 'en'
});
 
export default getRequestConfig(async () => {
  // Static for now, we'll change this later
  const locale = 'th';
 
  return {
    locale,
    timeZone: defaultTimeZone,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});