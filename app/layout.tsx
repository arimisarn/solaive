import './globals.css';
import '@/lib/fonts';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  metadataBase: new URL('https://solaive.app'),

  title: 'Solaive — Le tableau blanc collaboratif en temps réel',

  description:
    'Dessinez, écrivez et organisez vos idées ensemble, en direct, depuis n’importe où. Un tableau blanc infini pour vos équipes.',

  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          {children}

          <Toaster
            position="top-center"
            richColors
          />
        </ThemeProvider>
      </body>
    </html>
  );
}