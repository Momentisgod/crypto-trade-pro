import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import Providers from '@/components/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CryptoTrade Pro — Real-Time Crypto Trading',
  description: 'Professional cryptocurrency trading platform with live charts, real-time prices, and secure fund management.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1f2e',
              border: '1px solid #2a3144',
              color: '#e2e8f0',
            },
          }}
        />
      </body>
    </html>
  );
}
