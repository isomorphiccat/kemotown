import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import SessionProviderWrapper from "./SessionProviderWrapper"; // New import
import UserSessionDisplay from "@/components/auth/UserSessionDisplay"; // New import
import Link from "next/link"; // For the header link

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Kemotown - 한국 퍼리 커뮤니티",
  description: "한국 퍼리 커뮤니티를 위한 특별한 공간",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSansKr.variable} antialiased`}
      >
        <SessionProviderWrapper> {/* Wrap content with SessionProviderWrapper */}
          <header style={{ padding: '1rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Kemotown</h1>
            </Link>
            <UserSessionDisplay /> {/* Display session status and sign-out button */}
          </header>
          <main style={{ padding: '1rem', flexGrow: 1 }}>
            {children}
          </main>
          <footer style={{ padding: '1rem', borderTop: '1px solid #eee', textAlign: 'center', marginTop: 'auto', backgroundColor: '#f8f9fa' }}>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>&copy; {new Date().getFullYear()} Kemotown. All rights reserved.</p>
          </footer>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
