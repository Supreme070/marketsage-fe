import { ReactNode } from 'react';

export const metadata = {
  title: 'Contact Support | MarketSage',
  description: 'Get in touch with our support team for assistance with MarketSage',
};

interface ContactLayoutProps {
  children: ReactNode;
}

export default function ContactLayout({ children }: ContactLayoutProps) {
  return <>{children}</>;
} 