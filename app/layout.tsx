import './globals.css';
import type { Metadata } from 'next';
import { inter, spaceGrotesk } from '@/lib/fonts';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  metadataBase: new URL('https://solaive.app'),
  title: 'Solaive — Le tableau blanc collaboratif en temps réel',
  description:
    'Dessinez, écrivez et organisez vos idées ensemble, en direct, depuis n’importe où. Un tableau blanc infini pour vos équipes.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
