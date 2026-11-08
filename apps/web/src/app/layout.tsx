import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AmbientBackground } from '@/components/ambient-background';
import { MotionProvider } from '@/components/motion-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'dotenvmgr',
  description: 'Encrypted environment secret management for developers.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        <MotionProvider>
          <AmbientBackground />
          <div className="relative z-10">{children}</div>
        </MotionProvider>
      </body>
    </html>
  );
}
