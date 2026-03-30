'use client';

import {createContext, useContext, useState} from 'react';

const LocaleContext = createContext<any>(null);

export function LocaleProvider({children} : {children: React.ReactNode}) {
  const [locale, setLocale] = useState('th');

  return (
    <LocaleContext.Provider value={{locale, setLocale}}>
      {children}
    </LocaleContext.Provider>
  );
}

export const useLocale = () => useContext(LocaleContext);