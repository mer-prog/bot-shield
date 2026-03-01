import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BOT Shield - Demo Store',
  description: 'ECサイト向け多層BOT対策システム実証デモ',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
