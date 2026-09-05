import { Inter } from 'next/font/google';
import ConnectionWatcher from '@/shared/ui/connection-watcher';
import DemoPanel from '@/shared/ui/demo-panel';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import ThemeProvider, { themeBootScript } from '@/shared/ui/theme-provider';
import StoreProvider from '@/shared/store/store-provider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: 'Inventory Management — amb',
  description:
    'Project portofolio: portal inventori multi-aplikasi dengan permission engine per pengguna, dibangun memakai arsitektur hexagonal.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
        <StoreProvider>
          <ThemeProvider>
            <TooltipProvider delayDuration={200}>
              <ConnectionWatcher />
              {children}
              <DemoPanel />
              <Toaster position="top-center" richColors />
            </TooltipProvider>
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
