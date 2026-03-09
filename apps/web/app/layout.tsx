import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GlowHaul',
  description: 'Out-of-the-Box Advertising operations and marketplace platform.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
