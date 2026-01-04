/**
 * Root Layout
 * Sets up global providers and metadata for the application
 */

import type { Metadata, Viewport } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Kemotown',
    template: '%s | Kemotown',
  },
  description: '한국 퍼리 커뮤니티를 위한 특별한 공간',
  keywords: ['퍼리', 'furry', 'meetup', 'community', '한국', 'korea', 'kemotown'],
  authors: [{ name: 'Kemotown Team' }],
  creator: 'Kemotown',
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'https://kemo.town'),
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: '/',
    title: 'Kemotown',
    description: '한국 퍼리 커뮤니티를 위한 특별한 공간',
    siteName: 'Kemotown',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kemotown',
    description: '한국 퍼리 커뮤니티를 위한 특별한 공간',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#a855f7' },
    { media: '(prefers-color-scheme: dark)', color: '#7c3aed' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* Sync dark class with system preference for CSS .dark selectors */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function updateTheme() {
                  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                }
                updateTheme();
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateTheme);
              })();
            `,
          }}
        />
        {/* Pretendard font for Korean text */}
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
