"use client";

import { 
  ShoppingCart, 
  Filter, 
  BarChart3, 
  Settings, 
  ShoppingBag, 
  Mail 
} from "lucide-react";
import Link from "next/link";

export function FeatureSection() {
  const features = [
    {
      icon: ShoppingCart,
      title: "eCommerce Integration",
      description:
        "Sync product and customer data from stores to enable personalized automation and targeted messaging. Works with WooCommerce, Shopify, etc.",
      link: "#"
    },
    {
      icon: Filter,
      title: "Smart Segmentation",
      description:
        "Group customers using detailed filters such as purchase history, total spend, last activity, and product interest.",
      link: "#"
    },
    {
      icon: BarChart3,
      title: "Deep Analytics",
      description:
        "Access insights into customer behavior, segment performance, and campaign results in real-time.",
      link: "#"
    },
    {
      icon: Settings,
      title: "Dynamic Personalization",
      description:
        "Use contact attributes like location, gender, or interests to personalize content dynamically.",
      link: "#"
    },
    {
      icon: ShoppingBag,
      title: "Cart Abandonment",
      description:
        "Automatically re-engage customers who leave items in their cart. Recover lost revenue with triggered reminders.",
      link: "#"
    },
    {
      icon: Mail,
      title: "Transactional Emails",
      description:
        "Send time-sensitive messages like order confirmations, password resets, shipping updates, and more — in real-time.",
      link: "#"
    }
  ];

  return (
    <section id="features" className="py-20 bg-[#F9FAFB] dark:bg-[#111827]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="container px-4 mx-auto">
        <div className="mb-16 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4" style={{ lineHeight: 1.2 }}>
            Craft relevant, engaging customer journeys with our<br />
            automation workflow builder.
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto" style={{ lineHeight: 1.5 }}>
            Powerful email marketing tools designed to help you connect with your audience, drive conversions, and grow your business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white dark:bg-[#121828] rounded-lg border border-gray-200 dark:border-gray-800 p-6"
              style={{ borderRadius: '8px' }}
            >
              <div className="w-14 h-14 mb-5 bg-[#E5F7F5] dark:bg-[#0F2A28] rounded-lg flex items-center justify-center">
                <feature.icon className="h-6 w-6 text-[#2DD4BF]" />
              </div>
              <h3 className="text-xl font-medium mb-3">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-base" style={{ lineHeight: 1.5 }}>{feature.description}</p>
              <Link 
                href={feature.link} 
                className="text-[#2DD4BF] font-medium hover:text-[#20a596] inline-flex items-center"
              >
                Learn more
                <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 