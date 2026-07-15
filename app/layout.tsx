import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Toaster } from '@/components/ui/sonner';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { BRAND_NAME } from '@/lib/constants';
import './globals.css';

export const metadata: Metadata = {
  title: `${BRAND_NAME} — creá y compartí presupuestos`,
  description: 'Armá un presupuesto en segundos, exportalo en PDF o compartilo con un link.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="bg-muted/40 flex h-dvh flex-col overflow-hidden print:h-auto print:overflow-visible print:bg-white">
        <Header />
        <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col">{children}</main>
        <Footer />
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
