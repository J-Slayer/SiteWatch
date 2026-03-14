import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: 'SiteWatch — Safety & Incident Reporting',
    template: '%s | SiteWatch',
  },
  description:
    'Safety and incident reporting platform for construction sites, warehouses, factories, and field teams.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
