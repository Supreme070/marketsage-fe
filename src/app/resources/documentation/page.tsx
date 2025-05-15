import { BookOpen, Search } from "lucide-react";
import { ResourceHero } from "@/components/resources/resource-hero";
import { DocItem } from "@/components/resources/doc-item";

// Sample documentation categories - in a real app, this would come from a database or CMS
const docCategories = [
  {
    title: "Getting Started",
    description: "Learn the basics of MarketSage and set up your first campaign",
    slug: "getting-started",
    items: 5
  },
  {
    title: "Workflow Builder",
    description: "Create automated marketing journeys with our drag-and-drop workflow builder",
    slug: "workflow-builder",
    items: 8
  },
  {
    title: "Email Campaigns",
    description: "Design, send, and analyze email campaigns for maximum engagement",
    slug: "email-campaigns",
    items: 10
  },
  {
    title: "SMS & WhatsApp Marketing",
    description: "Reach your audience via SMS and WhatsApp Business messaging",
    slug: "sms-whatsapp",
    items: 7
  },
  {
    title: "Audience Segmentation",
    description: "Create targeted segments based on customer behavior and attributes",
    slug: "audience-segmentation",
    items: 6
  },
  {
    title: "Analytics & Reporting",
    description: "Track performance and gain insights with comprehensive analytics",
    slug: "analytics-reporting",
    items: 9
  },
];

// Sample popular guides
const popularGuides = [
  {
    title: "Setting Up Your First Campaign",
    slug: "getting-started/first-campaign"
  },
  {
    title: "Creating Email Templates",
    slug: "email-campaigns/templates"
  },
  {
    title: "WhatsApp Business API Integration",
    slug: "sms-whatsapp/whatsapp-api"
  },
  {
    title: "Building Automated Workflows",
    slug: "workflow-builder/automation"
  },
  {
    title: "Behavioral Segmentation Guide",
    slug: "audience-segmentation/behavioral"
  },
  {
    title: "Understanding Campaign Analytics",
    slug: "analytics-reporting/campaign-metrics"
  },
];

export default function DocumentationPage() {
  return (
    <>
      <ResourceHero
        title="Documentation"
        description="Comprehensive guides to help you get the most out of MarketSage's marketing automation platform."
        icon={<BookOpen className="h-10 w-10" />}
        color="#8B5CF6"
      />
      
      <section className="py-12">
        <div className="container px-4 mx-auto">
          {/* Search */}
          <div className="max-w-2xl mx-auto mb-16">
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Search documentation..."
                className="w-full py-3 pl-12 pr-4 rounded-xl border border-slate-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary-600/30 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white"
              />
            </div>
          </div>
          
          {/* Categories */}
          <div className="mb-20">
            <h2 className="text-2xl font-bold mb-8 text-center text-slate-900 dark:text-white">Documentation Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {docCategories.map((category, index) => (
                <DocItem
                  key={category.slug}
                  title={category.title}
                  description={category.description}
                  slug={category.slug}
                  isCategory={true}
                  items={category.items}
                  index={index}
                />
              ))}
            </div>
          </div>
          
          {/* Popular Guides */}
          <div>
            <h2 className="text-2xl font-bold mb-8 text-center text-slate-900 dark:text-white">Popular Guides</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularGuides.map((guide, index) => (
                <DocItem
                  key={guide.slug}
                  title={guide.title}
                  slug={guide.slug}
                  index={index}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Help Center CTA */}
      <section className="py-20 bg-slate-50 dark:bg-background/50 border-t border-slate-200 dark:border-slate-800">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">
            Need more help?
          </h2>
          <p className="text-lg mb-8 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Our support team is available to assist you with any questions you may have about using MarketSage.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="inline-block px-8 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
            >
              Contact Support
            </a>
            <a
              href="#"
              className="inline-block px-8 py-3 bg-white text-slate-900 font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:hover:bg-slate-700"
            >
              Join Community
            </a>
          </div>
        </div>
      </section>
    </>
  );
} 