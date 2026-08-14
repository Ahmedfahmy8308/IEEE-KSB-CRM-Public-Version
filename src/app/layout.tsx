// Copyright (c) 2026 IEEE KSB & Ahmed Fahmy
// Engineered by UFUQ Tech (https://ufuq-tech.com)
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '@/styles/globals.css';
import { ToastProvider } from '@/components/ToastProvider';
import StructuredData from '@/components/StructuredData';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const PRIMARY_URL = 'https://crm.ieee-ksb.org';
const MIRROR_URL = 'https://ieee-ksb.ufuq-tech.com';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#00629B' },
    { media: '(prefers-color-scheme: dark)', color: '#0B1528' },
  ],
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || PRIMARY_URL),
  title: {
    default: 'IEEE KSB CRM | Candidate Recruitment & Event Operations Portal',
    template: '%s | IEEE KSB CRM',
  },
  description:
    'Official Enterprise Operations Portal for IEEE Kafr El-Sheikh Student Branch (IEEE KSB). Streamlining member recruitment, candidate interviews, evaluations, and Welcome Day event check-ins. Engineered and powered by UFUQ Tech.',
  applicationName: 'IEEE KSB CRM',
  generator: 'Next.js 16, React 19, TypeScript',
  category: 'Enterprise Management Software / CRM',
  classification: 'Organization Recruitment & Event Management System',
  referrer: 'origin-when-cross-origin',
  authors: [
    { name: 'Ahmed Fahmy', url: 'https://ahmed-fahmy.engineer' },
    { name: 'UFUQ Tech', url: 'https://ufuq-tech.com' },
    { name: 'IEEE KSB', url: 'https://ieee-ksb.org' },
    { name: 'IEEE', url: 'https://www.ieee.org' },
  ],
  creator: 'Ahmed Fahmy @ UFUQ Tech',
  publisher: 'IEEE Kafr El-Sheikh Student Branch',
  alternates: {
    canonical: PRIMARY_URL,
    languages: {
      'en-US': PRIMARY_URL,
      'ar-EG': PRIMARY_URL,
    },
  },
  keywords: [
    'IEEE',
    'IEEE KSB',
    'IEEE Kafr El-Sheikh Student Branch',
    'IEEE Egypt Section',
    'Kafr El-Sheikh University',
    'IEEE CRM',
    'Recruitment System',
    'Interview Management',
    'Candidate Evaluation',
    'Welcome Day Attendance',
    'QR Code Event Check-in',
    'UFUQ Tech',
    'Ahmed Fahmy',
    'Student Branch Operations',
  ],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/Logo/Logo2.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [{ url: '/Logo/Logo2.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'IEEE KSB CRM | Candidate Recruitment & Operations Portal',
    description:
      'Official Operations Management Platform for IEEE Kafr El-Sheikh Student Branch (IEEE KSB). Engineered by UFUQ Tech.',
    url: PRIMARY_URL,
    siteName: 'IEEE KSB CRM',
    locale: 'en_US',
    alternateLocale: ['ar_EG'],
    type: 'website',
    images: [
      {
        url: '/Logo/Logo2.png',
        width: 512,
        height: 512,
        alt: 'IEEE KSB CRM Operations Portal Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IEEE KSB CRM | Operations Portal',
    description:
      'Official Operations Management Platform for IEEE Kafr El-Sheikh Student Branch (IEEE KSB). Engineered by UFUQ Tech.',
    site: '@IEEE_KSB',
    creator: '@Ahmedfahmy8308',
    images: ['/Logo/Logo2.png'],
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  other: {
    'ufuq:engineered_by': 'UFUQ Tech (https://ufuq-tech.com)',
    'ufuq:lead_architect': 'Ahmed Fahmy (https://ahmed-fahmy.engineer)',
    'ieee:branch': 'IEEE Kafr El-Sheikh Student Branch (https://ieee-ksb.org)',
    'ieee:parent_org': 'IEEE (https://www.ieee.org)',
    'app:primary_domain': PRIMARY_URL,
    'app:mirror_domain': MIRROR_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <StructuredData />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
