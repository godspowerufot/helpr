import type { Metadata } from 'next';
import { Geist, Instrument_Serif } from 'next/font/google';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import '@/theme/theme.css';
import AppBackground from '@/components/AppBackground';
import Providers from './Provider';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
});

const serif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-instrument-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Helpr',
  description: 'Find a local service and request a booking.',
};

export const viewport = {
  themeColor: '#f7f8fa',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${serif.variable}`}
      style={{ colorScheme: 'light' }}
    >
      <body className="text-ink">
        <AppBackground />
        <AppRouterCacheProvider>
          <Providers>{children}</Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
