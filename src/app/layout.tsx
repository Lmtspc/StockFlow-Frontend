import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/providers/QueryProvider';
import AppLayoutShell from '@/components/layout/AppLayoutShell';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'StockFlow ERP - Enterprise Inventory & Operations',
  description: 'Real-time multi-warehouse inventory control, procurement, fulfillment, and FIFO valuation ERP.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#070b14] text-slate-100 antialiased min-h-screen`}>
        <QueryProvider>
          <AppLayoutShell>{children}</AppLayoutShell>
        </QueryProvider>
      </body>
    </html>
  );
}
