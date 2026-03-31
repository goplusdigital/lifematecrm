import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl"
import { getTranslations } from 'next-intl/server';
import localFont from "next/font/local"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"


import "./globals.css";
import IntlProvider from "@/lib/init";
import { LocaleProvider } from "@/lib/locale";
import { StoreProvider } from "@/lib/store";

const fontPrompt = localFont({
  src: [
    // --- Thin (100) ---
    { path: './fonts/Prompt/Prompt-Thin.ttf', weight: '100', style: 'normal' },
    { path: './fonts/Prompt/Prompt-ThinItalic.ttf', weight: '100', style: 'italic' },

    // --- ExtraLight (200) ---
    { path: './fonts/Prompt/Prompt-ExtraLight.ttf', weight: '200', style: 'normal' },
    { path: './fonts/Prompt/Prompt-ExtraLightItalic.ttf', weight: '200', style: 'italic' },

    // --- Light (300) ---
    { path: './fonts/Prompt/Prompt-Light.ttf', weight: '300', style: 'normal' },
    { path: './fonts/Prompt/Prompt-LightItalic.ttf', weight: '300', style: 'italic' },

    // --- Regular (400) ---
    { path: './fonts/Prompt/Prompt-Regular.ttf', weight: '400', style: 'normal' },
    { path: './fonts/Prompt/Prompt-Italic.ttf', weight: '400', style: 'italic' },

    // --- Medium (500) ---
    { path: './fonts/Prompt/Prompt-Medium.ttf', weight: '500', style: 'normal' },
    { path: './fonts/Prompt/Prompt-MediumItalic.ttf', weight: '500', style: 'italic' },

    // --- SemiBold (600) ---
    { path: './fonts/Prompt/Prompt-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: './fonts/Prompt/Prompt-SemiBoldItalic.ttf', weight: '600', style: 'italic' },

    // --- Bold (700) ---
    { path: './fonts/Prompt/Prompt-Bold.ttf', weight: '700', style: 'normal' },
    { path: './fonts/Prompt/Prompt-BoldItalic.ttf', weight: '700', style: 'italic' },

    // --- ExtraBold (800) ---
    { path: './fonts/Prompt/Prompt-ExtraBold.ttf', weight: '800', style: 'normal' },
    { path: './fonts/Prompt/Prompt-ExtraBoldItalic.ttf', weight: '800', style: 'italic' },

    // --- Black (900) ---
    { path: './fonts/Prompt/Prompt-Black.ttf', weight: '900', style: 'normal' },
    { path: './fonts/Prompt/Prompt-BlackItalic.ttf', weight: '900', style: 'italic' },
  ],
  variable: '--font-prompt', // แนะนำให้ใช้ CSS Variable
})



export const metadata: Metadata = {
  title: "LIFEMATE CRM",
  description: "A CRM system for smart businesses.",
  applicationName: "LIFEMATE CRM",
  authors: [{ name: "GO PLUS DIGITAL", url: "https://goplus.co.th" }],
  keywords: ["CRM", "Customer Relationship Management", "LIFEMATE", "Business"],
  themeColor: "#000000",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
    other: [
      {
        rel: "icon",
        url: "/favicon-32x32.png",
        sizes: "32x32",
      },
      {
        rel: "icon",
        url: "/favicon-16x16.png",
        sizes: "16x16",
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = "th"
  return (
    <html lang={locale}>
      <body
        className={`${fontPrompt.variable} antialiased`}
      >
        <StoreProvider>
          <LocaleProvider>
            <IntlProvider
            >
              {children}
            </IntlProvider>
          </LocaleProvider>
          <Analytics />
          <SpeedInsights />
        </StoreProvider>
      </body>
    </html>
  );
}
