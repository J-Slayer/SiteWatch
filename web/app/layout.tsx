import type { Metadata } from 'next';
import './globals.css';

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
      <body>{children}</body>
    </html>
  );
}
