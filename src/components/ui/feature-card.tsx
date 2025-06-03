import React from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  link?: string;
}

export function FeatureCard({ title, description, icon: Icon, link }: FeatureCardProps) {
  const CardContent = () => (
    <div className="card-feature h-full">
      <div className="icon-container">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-xl font-medium mb-3">{title}</h3>
      <p className="text-base text-muted-foreground mb-4">{description}</p>
      {link && (
        <Link 
          href={link} 
          className="text-primary font-medium hover:text-primary/80 inline-flex items-center"
        >
          Learn more
          <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </Link>
      )}
    </div>
  );

  if (link) {
    return (
      <Link href={link} className="block h-full">
        <CardContent />
      </Link>
    );
  }

  return <CardContent />;
} 