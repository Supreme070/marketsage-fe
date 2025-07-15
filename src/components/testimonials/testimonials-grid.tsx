"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Quote, MapPin, Building2 } from "lucide-react";

interface Testimonial {
  id: string;
  company: string;
  industry: string;
  location: string;
  logo?: string;
  quote: string;
  author: string;
  role: string;
  rating: number;
  metrics: {
    label: string;
    value: string;
  }[];
  tags: string[];
}

const testimonials: Testimonial[] = [
  {
    id: "1",
    company: "Jumia",
    industry: "E-commerce",
    location: "Lagos, Nigeria",
    quote: "MarketSage's AI recommendations increased our email conversion rates by 156%. The platform understands African customer behavior better than any other tool we've used.",
    author: "Folake Adeleke",
    role: "VP of Marketing",
    rating: 5,
    metrics: [
      { label: "Conversion Rate", value: "+156%" },
      { label: "Revenue", value: "+₦850M" }
    ],
    tags: ["E-commerce", "AI", "Email"]
  },
  {
    id: "2",
    company: "Safaricom",
    industry: "Telecommunications",
    location: "Nairobi, Kenya",
    quote: "The multi-channel capabilities are game-changing. We can now orchestrate campaigns across SMS, email, and WhatsApp seamlessly. Customer engagement is at an all-time high.",
    author: "John Mwangi",
    role: "Head of Digital Marketing",
    rating: 5,
    metrics: [
      { label: "Engagement", value: "+240%" },
      { label: "Churn Rate", value: "-35%" }
    ],
    tags: ["Telecom", "Multi-channel", "SMS"]
  },
  {
    id: "3",
    company: "Flutterwave",
    industry: "Fintech",
    location: "Lagos, Nigeria",
    quote: "LeadPulse helped us identify high-value visitors before they even signed up. We've converted 3x more enterprise clients since implementing MarketSage.",
    author: "Chioma Okeke",
    role: "Growth Marketing Lead",
    rating: 5,
    metrics: [
      { label: "Enterprise Leads", value: "+300%" },
      { label: "Deal Size", value: "+125%" }
    ],
    tags: ["Fintech", "LeadPulse", "B2B"]
  },
  {
    id: "4",
    company: "MultiChoice",
    industry: "Media & Entertainment",
    location: "Johannesburg, South Africa",
    quote: "The predictive analytics are incredibly accurate. We can now prevent churn before it happens and personalize content recommendations at scale.",
    author: "Thabo Mokoena",
    role: "Director of Customer Experience",
    rating: 5,
    metrics: [
      { label: "Churn Prevention", value: "42%" },
      { label: "LTV", value: "+R2.3M" }
    ],
    tags: ["Media", "Predictive", "Retention"]
  },
  {
    id: "5",
    company: "Andela",
    industry: "Technology",
    location: "Lagos, Nigeria",
    quote: "Workflow automation saved us 30 hours per week. Our marketing team can now focus on strategy while MarketSage handles the execution flawlessly.",
    author: "Amara Nwosu",
    role: "Marketing Operations Manager",
    rating: 5,
    metrics: [
      { label: "Time Saved", value: "30hr/week" },
      { label: "Productivity", value: "+85%" }
    ],
    tags: ["Tech", "Automation", "Efficiency"]
  },
  {
    id: "6",
    company: "Kenya Airways",
    industry: "Aviation",
    location: "Nairobi, Kenya",
    quote: "Supreme-AI's content generation in multiple African languages has been transformative. We're reaching customers in their preferred language automatically.",
    author: "Grace Wanjiru",
    role: "Chief Marketing Officer",
    rating: 5,
    metrics: [
      { label: "Bookings", value: "+67%" },
      { label: "Languages", value: "12" }
    ],
    tags: ["Aviation", "AI", "Localization"]
  }
];

const industries = ["All", "E-commerce", "Fintech", "Telecom", "Media", "Technology", "Aviation"];

export function TestimonialsGrid() {
  const { theme } = useTheme();
  const [selectedIndustry, setSelectedIndustry] = useState("All");
  const isLight = theme === "light";

  const filteredTestimonials = selectedIndustry === "All" 
    ? testimonials 
    : testimonials.filter(t => t.industry === selectedIndustry);

  return (
    <section className={`py-16 lg:py-24 ${
      isLight ? "bg-white" : "bg-slate-900"
    }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className={`text-3xl lg:text-4xl font-bold mb-4 ${
            isLight ? "text-gray-900" : "text-gray-100"
          }`}>
            Success across every industry
          </h2>
          <p className={`text-lg ${
            isLight ? "text-gray-600" : "text-gray-400"
          }`}>
            From fintech to e-commerce, see how African businesses thrive with MarketSage
          </p>
        </div>

        {/* Industry Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {industries.map((industry) => (
            <Button
              key={industry}
              variant={selectedIndustry === industry ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedIndustry(industry)}
              className={selectedIndustry === industry 
                ? isLight 
                  ? "bg-blue-600 text-white hover:bg-blue-700" 
                  : "bg-blue-500 text-white hover:bg-blue-600"
                : ""
              }
            >
              {industry}
            </Button>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTestimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              layout
            >
              <Card className={`h-full p-6 border transition-all duration-300 hover:shadow-lg ${
                isLight 
                  ? "hover:border-gray-300" 
                  : "hover:border-gray-700"
              }`}>
                {/* Company Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      isLight ? "bg-gray-100" : "bg-gray-800"
                    }`}>
                      <Building2 className={`h-6 w-6 ${
                        isLight ? "text-gray-600" : "text-gray-400"
                      }`} />
                    </div>
                    <div>
                      <h4 className={`font-semibold ${
                        isLight ? "text-gray-900" : "text-gray-100"
                      }`}>
                        {testimonial.company}
                      </h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {testimonial.location}
                      </p>
                    </div>
                  </div>
                  <Quote className={`h-5 w-5 ${
                    isLight ? "text-gray-300" : "text-gray-700"
                  }`} />
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 fill-current ${
                      isLight ? "text-yellow-500" : "text-yellow-400"
                    }`} />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className={`text-sm mb-4 ${
                  isLight ? "text-gray-700" : "text-gray-300"
                }`}>
                  "{testimonial.quote}"
                </blockquote>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {testimonial.metrics.map((metric) => (
                    <div key={metric.label} className={`text-center p-2 rounded-lg ${
                      isLight ? "bg-gray-50" : "bg-gray-800/50"
                    }`}>
                      <p className={`font-semibold ${
                        isLight ? "text-gray-900" : "text-gray-100"
                      }`}>
                        {metric.value}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {metric.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Author */}
                <div className={`pt-4 border-t ${
                  isLight ? "border-gray-200" : "border-gray-800"
                }`}>
                  <p className={`font-medium text-sm ${
                    isLight ? "text-gray-900" : "text-gray-100"
                  }`}>
                    {testimonial.author}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {testimonial.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className={`text-xs ${
                        isLight 
                          ? "bg-gray-100 text-gray-700" 
                          : "bg-gray-800 text-gray-300"
                      }`}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}