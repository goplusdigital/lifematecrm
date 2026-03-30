import {getRequestConfig} from 'next-intl/server';
import {defineRouting} from 'next-intl/routing';
 
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
    messages: (await import(`../messages/${locale}.json`)).default
  };
});