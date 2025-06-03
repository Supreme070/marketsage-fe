import { ArrowRight, BarChart3, BookOpen, FileText, LightbulbIcon } from "lucide-react";
import { ResourceHero } from "@/components/resources/resource-hero";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resources | MarketSage",
  description: "Explore our marketing automation resources including guides, blog posts, case studies, and documentation.",
};

export default function ResourcesPage() {
  return (
    <>
      <ResourceHero
        title="Resources"
        description="Discover guides, tutorials, and best practices to help you get the most out of MarketSage's marketing automation platform."
        icon={<BookOpen className="h-10 w-10" />}
        color="#3B82F6"
        cta={{
          text: "Explore the documentation",
          href: "/resources/documentation"
        }}
      />
      
      <section className="py-20">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <ResourceCard
              title="Blog"
              description="Latest news, marketing tips, and platform updates to keep you ahead of the curve."
              icon={<LightbulbIcon className="h-8 w-8 text-amber-500" />}
              href="/resources/blog"
              color="#F59E0B"
            />
            
            <ResourceCard
              title="Case Studies"
              description="Success stories from Nigerian businesses that have transformed their marketing with MarketSage."
              icon={<BarChart3 className="h-8 w-8 text-green-500" />}
              href="/resources/case-studies"
              color="#10B981"
            />
            
            <ResourceCard
              title="Documentation"
              description="Detailed guides and tutorials to help you unlock the full potential of our platform."
              icon={<FileText className="h-8 w-8 text-purple-500" />}
              href="/resources/documentation"
              color="#8B5CF6"
            />
          </div>
        </div>
      </section>
      
      <section className="py-20 bg-slate-50 dark:bg-background">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">
            Need personalized support?
          </h2>
          <p className="text-lg mb-8 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Our team of marketing automation experts is here to help you get the most out of the MarketSage platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-block px-8 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
            >
              Contact Us
            </Link>
            <Link
              href="/resources/documentation/getting-started"
              className="inline-block px-8 py-3 bg-white text-slate-900 font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:hover:bg-slate-700"
            >
              Getting Started Guide
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function ResourceCard({ 
  title, 
  description, 
  icon, 
  href, 
  color 
}: { 
  title: string; 
  description: string; 
  icon: React.ReactNode; 
  href: string; 
  color: string;
}) {
  return (
    <Link
      href={href}
      className="block p-8 rounded-xl border border-slate-200 bg-white hover:shadow-lg transition-all group relative overflow-hidden dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700"
    >
      <div className="absolute -right-10 -top-10 w-40 h-40 opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity"
        style={{ backgroundColor: color }}
      />
      
      <div className="relative">
        <div className="mb-4">
          {icon}
        </div>
        
        <h3 className="text-xl font-semibold mb-3 text-slate-900 group-hover:text-primary transition-colors dark:text-white">
          {title}
        </h3>
        
        <p className="text-slate-600 mb-4 dark:text-slate-400">
          {description}
        </p>
        
        <div className="inline-flex items-center group-hover:gap-2 text-primary font-medium transition-all">
          Explore {title} <ArrowRight className="ml-1 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
} 