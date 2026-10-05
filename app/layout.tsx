import type { Metadata, Viewport } from 'next';
import './globals.css';
import './dc-pseudo.css';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: 'Atelier Parfums — Perfumes originales en Honduras',
  description: 'Perfumes 100% originales traídos de Estados Unidos a Honduras. Árabes y de diseñador. Pide por WhatsApp.',
  openGraph: {
    title: 'Atelier Parfums',
    description: 'Perfumes originales, traídos de Estados Unidos a Honduras. Pide por WhatsApp.',
    locale: 'es_HN',
    type: 'website',
  },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#3D0000' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
