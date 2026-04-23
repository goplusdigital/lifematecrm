'use client';

import {createContext, useContext, useEffect, useState} from 'react';

const LocaleContext = createContext<any>(null);
const LOCALE_STORAGE_KEY = 'lifemate-locale';

export function LocaleProvider({children} : {children: React.ReactNode}) {
  const [locale, setLocaleState] = useState<'th' | 'en'>('th');

  useEffect(() => {
    const savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (savedLocale === 'th' || savedLocale === 'en') {
      setLocaleState(savedLocale);
    }
  }, []);

  const setLocale = (nextLocale: string) => {
    const normalizedLocale = nextLocale === 'en' ? 'en' : 'th';
    setLocaleState(normalizedLocale);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, normalizedLocale);
  };

  return (
    <LocaleContext.Provider value={{locale, setLocale}}>
      {children}
    </LocaleContext.Provider>
  );
}

export const useLocale = () => useContext(LocaleContext);