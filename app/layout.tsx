import type { Metadata } from "next";
import { Noto_Sans_JP, Inter } from 'next/font/google';
import "./globals.css";

const notoSansJP = Noto_Sans_JP({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-jp',
});

const inter = Inter({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "Job Seiri - 求人ブックマーク",
  description: "求人ページをワンクリックで保存し、1ページでまとめて読み返せる",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${notoSansJP.variable} ${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}

