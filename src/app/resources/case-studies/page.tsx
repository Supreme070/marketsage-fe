import { FileText } from "lucide-react";
import { ResourceHero } from "@/components/resources/resource-hero";
import { CaseStudyCard } from "@/components/resources/case-study-card";

// Sample case study data - in a real app, this would come from a database or CMS
const caseStudies = [
  {
    title: "Driving 200% Growth Through Email Marketing Automation",
    companyName: "FashionNova Nigeria",
    industry: "E-commerce / Fashion",
    description: "How a leading Nigerian fashion retailer increased sales and customer engagement through personalized email campaigns.",
    results: [
      { label: "Revenue Growth", value: "207%" },
      { label: "Customer Retention", value: "78%" }
    ],
    slug: "fashionnova-email-marketing",
    logo: "/images/case-studies/fashionnova-logo.png"
  },
  {
    title: "WhatsApp Marketing: Building Customer Loyalty with Automation",
    companyName: "Foodie Express",
    industry: "Food Delivery",
    description: "How a Nigerian food delivery service created automated WhatsApp campaigns to drive repeat orders and boost customer satisfaction.",
    results: [
      { label: "Order Frequency", value: "+43%" },
      { label: "Response Rate", value: "92%" }
    ],
    slug: "foodie-express-whatsapp",
    logo: "/images/case-studies/foodie-express-logo.png"
  },
  {
    title: "Streamlining Lead Nurturing for Increased Conversions",
    companyName: "PropertiesNG",
    industry: "Real Estate",
    description: "How a Nigerian real estate platform automated their lead nurturing process to increase property viewings and sales.",
    results: [
      { label: "Lead Conversion", value: "+54%" },
      { label: "Sales Cycle", value: "-32%" }
    ],
    slug: "propertiesng-lead-nurturing",
    logo: "/images/case-studies/propertiesng-logo.png"
  },
  {
    title: "Audience Segmentation Strategy Increases Bank App Downloads",
    companyName: "First Digital Bank",
    industry: "Banking",
    description: "How advanced audience segmentation helped a Nigerian digital bank target the right customers for their mobile app.",
    results: [
      { label: "App Downloads", value: "+137%" },
      { label: "Acquisition Cost", value: "-42%" }
    ],
    slug: "first-digital-bank-segmentation",
    logo: "/images/case-studies/first-digital-logo.png"
  },
  {
    title: "Multi-Channel Approach Boosts Online Course Enrollments",
    companyName: "TechSkills Nigeria",
    industry: "Education",
    description: "How an educational platform combined email, SMS, and WhatsApp campaigns to drive course enrollments.",
    results: [
      { label: "Enrollment Growth", value: "183%" },
      { label: "Marketing ROI", value: "412%" }
    ],
    slug: "techskills-multi-channel",
    logo: "/images/case-studies/techskills-logo.png"
  },
  {
    title: "Automating Customer Support for Improved Satisfaction",
    companyName: "SolarPower Solutions",
    industry: "Renewable Energy",
    description: "How a Nigerian solar power provider automated their customer support to improve response times and customer satisfaction.",
    results: [
      { label: "Response Time", value: "-65%" },
      { label: "Satisfaction", value: "+39%" }
    ],
    slug: "solarpower-customer-support",
    logo: "/images/case-studies/solarpower-logo.png"
  }
];

// Sample industry filters
const industries = [
  "All Industries",
  "E-commerce",
  "Finance",
  "Education",
  "Food & Beverage",
  "Real Estate",
  "Technology",
  "Healthcare",
  "Renewable Energy"
];

export default function CaseStudiesPage() {
  return (
    <>
      <ResourceHero
        title="Customer Success Stories"
        description="Discover how Nigerian businesses use MarketSage to transform their marketing, increase engagement, and drive growth."
        icon={<FileText className="h-10 w-10" />}
        color="#10B981"
      />
      
      <section className="py-12">
        <div className="container px-4 mx-auto">
          {/* Filters */}
          <div className="mb-12 flex flex-wrap gap-3 justify-center">
            {industries.map((industry, index) => (
              <button
                key={index}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  index === 0
                    ? 'bg-green-500 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {industry}
              </button>
            ))}
          </div>
          
          {/* Case Studies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {caseStudies.map((study, index) => (
              <CaseStudyCard
                key={study.slug}
                title={study.title}
                companyName={study.companyName}
                industry={study.industry}
                description={study.description}
                results={study.results}
                slug={study.slug}
                logo={study.logo}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-500/90 to-teal-500/90 text-white">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to become our next success story?</h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto">
            Join the hundreds of Nigerian businesses that have transformed their marketing with MarketSage.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/register" 
              className="inline-block px-8 py-3 bg-white text-green-600 font-medium rounded-lg hover:bg-green-50 transition-colors"
            >
              Start Free Trial
            </a>
            <a 
              href="/contact" 
              className="inline-block px-8 py-3 bg-transparent text-white font-medium rounded-lg border border-white hover:bg-white/10 transition-colors"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>
    </>
  );
} 