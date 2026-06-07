import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'ArticleOS — Medical Intelligence',
  description: 'Your personal pharmacy & medicine news OS',
  openGraph: {
    title: 'ArticleOS — Medical Intelligence',
    description: 'Your personal pharmacy & medicine news OS',
    siteName: 'ArticleOS',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ArticleOS — Medical Intelligence',
    description: 'Your personal pharmacy & medicine news OS',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      afterSignOutUrl="/sign-in"
      appearance={{
        variables: {
          colorPrimary: '#4F46E5',
          colorBackground: '#F8FAFC',
          colorInputBackground: '#FFFFFF',
          colorText: '#0F172A',
          colorTextSecondary: '#64748B',
          borderRadius: '0.875rem',
          fontSize: '15px',
        },
        layout: {
          logoPlacement: 'inside',
          socialButtonsPlacement: 'top',
          socialButtonsVariant: 'blockButton',
          unsafe_disableDevelopmentModeWarnings: true,
        },
      }}
    >
      <html lang="en" className="h-full">
        <body className="min-h-full bg-slate-50 text-slate-900 antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
