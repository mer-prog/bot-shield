import type { Metadata } from 'next';
import { LocaleProvider } from '@/lib/locale-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'BOT Shield - Demo Store',
  description: 'Multi-layer bot defense system demo for e-commerce',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="dark" suppressHydrationWarning>
      <body className="antialiased">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
