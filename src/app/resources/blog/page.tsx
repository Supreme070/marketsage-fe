import { LightbulbIcon } from "lucide-react";
import { ResourceHero } from "@/components/resources/resource-hero";
import { ArticleCard } from "@/components/resources/article-card";

// Sample blog data - in a real app, this would come from a database or CMS
const blogPosts = [
  {
    title: "5 Ways to Improve Your Email Open Rates in Nigeria",
    description: "Learn effective strategies to increase your email open rates in the Nigerian market, where mobile-first approaches are essential.",
    slug: "improve-email-open-rates-nigeria",
    image: "/images/blog/email-marketing.jpg",
    author: "Adebayo Johnson",
    date: "June 10, 2023",
    readTime: "6 min read",
    category: "Email Marketing",
    categoryColor: "#3B82F6"
  },
  {
    title: "WhatsApp Marketing: The Ultimate Guide for Nigerian Businesses",
    description: "With over 90% of Nigerian smartphone users on WhatsApp, this channel is essential for your marketing strategy. Here's how to leverage it effectively.",
    slug: "whatsapp-marketing-guide-nigeria",
    image: "/images/blog/whatsapp-marketing.jpg",
    author: "Chioma Okonkwo",
    date: "May 25, 2023",
    readTime: "8 min read",
    category: "Social Media",
    categoryColor: "#10B981"
  },
  {
    title: "Segmentation Strategies That Work for Nigerian Audiences",
    description: "Discover how to effectively segment your Nigerian audience based on demographics, behavior, and engagement for more targeted campaigns.",
    slug: "segmentation-strategies-nigeria",
    image: "/images/blog/audience-segmentation.jpg",
    author: "Olusegun Olatunji",
    date: "May 15, 2023",
    readTime: "5 min read",
    category: "Audience Targeting",
    categoryColor: "#F59E0B"
  },
  {
    title: "Marketing Automation ROI: Case Studies from Nigerian Businesses",
    description: "Real-world examples of how Nigerian businesses are achieving impressive ROI through marketing automation strategies.",
    slug: "marketing-automation-roi-nigeria",
    image: "/images/blog/marketing-automation.jpg",
    author: "Ngozi Eze",
    date: "April 22, 2023",
    readTime: "7 min read",
    category: "Case Studies",
    categoryColor: "#8B5CF6"
  },
  {
    title: "How to Build a Multi-Channel Marketing Strategy in Nigeria",
    description: "Create an effective multi-channel marketing strategy that resonates with Nigerian consumers across email, SMS, WhatsApp, and social media.",
    slug: "multi-channel-marketing-nigeria",
    image: "/images/blog/multi-channel.jpg",
    author: "Tunde Bakare",
    date: "April 10, 2023",
    readTime: "6 min read",
    category: "Strategy",
    categoryColor: "#EC4899"
  },
  {
    title: "NDPR Compliance: What Nigerian Marketers Need to Know",
    description: "A comprehensive guide to ensuring your marketing automation practices comply with Nigeria's Data Protection Regulation (NDPR).",
    slug: "ndpr-compliance-guide",
    image: "/images/blog/data-protection.jpg",
    author: "Aisha Mohammed",
    date: "March 28, 2023",
    readTime: "9 min read",
    category: "Compliance",
    categoryColor: "#EF4444"
  },
];

// Sample blog categories
const categories = [
  { name: "All Posts", count: 24 },
  { name: "Email Marketing", count: 8 },
  { name: "Social Media", count: 6 },
  { name: "Audience Targeting", count: 5 },
  { name: "Strategy", count: 7 },
  { name: "Case Studies", count: 4 },
  { name: "Compliance", count: 3 },
];

export default function BlogPage() {
  return (
    <>
      <ResourceHero
        title="Marketing Blog"
        description="Expert tips, industry insights, and best practices for marketing automation in Nigeria."
        icon={<LightbulbIcon className="h-10 w-10" />}
        color="#F59E0B"
      />
      
      <section className="py-20">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Articles Grid */}
            <div className="lg:w-3/4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {blogPosts.map((post, index) => (
                  <ArticleCard
                    key={post.slug}
                    title={post.title}
                    description={post.description}
                    image={post.image}
                    author={post.author}
                    date={post.date}
                    readTime={post.readTime}
                    slug={post.slug}
                    category={post.category}
                    categoryColor={post.categoryColor}
                    index={index}
                  />
                ))}
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="lg:w-1/4">
              <div className="sticky top-24">
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                  <div className="p-5 bg-slate-50 border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Categories</h3>
                  </div>
                  <div className="p-5 bg-white dark:bg-slate-900/50">
                    <ul className="space-y-3">
                      {categories.map((category, index) => (
                        <li key={index}>
                          <a 
                            href="#" 
                            className="flex justify-between items-center text-slate-700 hover:text-primary dark:text-slate-300 dark:hover:text-primary transition-colors"
                          >
                            <span>{category.name}</span>
                            <span className="text-xs py-1 px-2 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                              {category.count}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="mt-6 rounded-xl overflow-hidden border border-slate-200 bg-white p-5 dark:bg-slate-900 dark:border-slate-800">
                  <h3 className="font-semibold text-slate-900 mb-4 dark:text-white">Subscribe to our newsletter</h3>
                  <p className="text-sm text-slate-600 mb-4 dark:text-slate-400">
                    Get the latest marketing tips and resources delivered straight to your inbox.
                  </p>
                  <div className="space-y-3">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    />
                    <button className="w-full py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors">
                      Subscribe
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
} 