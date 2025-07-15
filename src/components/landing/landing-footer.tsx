"use client";

import React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { BrandLogo } from "./landing-footer-brand";
import { 
  Mail, 
  Phone, 
  MapPin,
  Twitter,
  Linkedin,
  Github,
  Youtube,
  ArrowRight,
  Shield,
  Award,
  Globe
} from "lucide-react";

const footerLinks = {
  product: {
    title: "Product",
    links: [
      { name: "Features", href: "/features" },
      { name: "Supreme-AI", href: "/features/ai" },
      { name: "LeadPulse", href: "/features/leadpulse" },
      { name: "Workflow Automation", href: "/features/workflows" },
      { name: "Multi-Channel", href: "/features/channels" },
      { name: "Analytics", href: "/features/analytics" },
      { name: "Integrations", href: "/integrations" },
      { name: "Pricing", href: "/pricing" }
    ]
  },
  solutions: {
    title: "Solutions",
    links: [
      { name: "For Enterprise", href: "/solutions/enterprise" },
      { name: "For Startups", href: "/solutions/startups" },
      { name: "For E-commerce", href: "/solutions/ecommerce" },
      { name: "For Financial Services", href: "/solutions/financial" },
      { name: "For Healthcare", href: "/solutions/healthcare" },
      { name: "For Education", href: "/solutions/education" }
    ]
  },
  resources: {
    title: "Resources",
    links: [
      { name: "Documentation", href: "/docs" },
      { name: "API Reference", href: "/api-docs" },
      { name: "Blog", href: "/blog" },
      { name: "Case Studies", href: "/case-studies" },
      { name: "Webinars", href: "/webinars" },
      { name: "Templates", href: "/templates" },
      { name: "Status", href: "https://status.marketsage.ai", external: true }
    ]
  },
  company: {
    title: "Company",
    links: [
      { name: "About Us", href: "/about" },
      { name: "Careers", href: "/careers", badge: "Hiring" },
      { name: "Partners", href: "/partners" },
      { name: "Press", href: "/press" },
      { name: "Contact", href: "/contact" },
      { name: "Testimonials", href: "/testimonials" }
    ]
  }
};

const socialLinks = [
  { name: "Twitter", icon: Twitter, href: "https://twitter.com/marketsage" },
  { name: "LinkedIn", icon: Linkedin, href: "https://linkedin.com/company/marketsage" },
  { name: "GitHub", icon: Github, href: "https://github.com/marketsage" },
  { name: "YouTube", icon: Youtube, href: "https://youtube.com/@marketsage" }
];

const certifications = [
  { name: "SOC 2 Type II", icon: Shield },
  { name: "ISO 27001", icon: Award },
  { name: "GDPR Compliant", icon: Globe }
];

export function LandingFooter() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <footer className={`relative overflow-hidden ${
      isLight ? "bg-gray-50 border-t border-gray-200" : "bg-slate-950 border-t border-slate-800"
    }`}>
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='%23000000' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='60' height='60' fill='url(%23grid)'/%3E%3C/svg%3E")`
          }}
        />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter CTA */}
        <div className={`py-12 border-b ${
          isLight ? "border-gray-200" : "border-slate-800"
        }`}>
          <div className="max-w-4xl mx-auto text-center">
            <h3 className={`text-2xl font-bold mb-2 ${
              isLight ? "text-gray-900" : "text-gray-100"
            }`}>
              Stay ahead with MarketSage insights
            </h3>
            <p className="text-muted-foreground mb-6">
              Get the latest AI marketing strategies and African market insights delivered weekly
            </p>
            
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className={`flex-1 px-4 py-2 rounded-lg border ${
                  isLight 
                    ? "bg-white border-gray-300 focus:border-blue-500" 
                    : "bg-slate-900 border-slate-700 focus:border-blue-400"
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
              <button
                type="submit"
                className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  isLight
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                Subscribe
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {/* Brand Column */}
            <div className="col-span-2">
              <BrandLogo className="mb-4" />
              <p className={`text-sm mb-6 ${
                isLight ? "text-gray-600" : "text-gray-400"
              }`}>
                The AI-powered marketing platform built for African enterprises. 
                See your invisible revenue and convert it.
              </p>
              
              {/* Office Locations */}
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Lagos, Nigeria</p>
                    <p className="text-muted-foreground">Victoria Island, Lagos</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Nairobi, Kenya</p>
                    <p className="text-muted-foreground">Westlands, Nairobi</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Links Columns */}
            {Object.entries(footerLinks).map(([key, section]) => (
              <div key={key} className="col-span-1">
                <h4 className={`font-semibold mb-4 ${
                  isLight ? "text-gray-900" : "text-gray-100"
                }`}>
                  {section.title}
                </h4>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className={`text-sm flex items-center gap-1 transition-colors ${
                          isLight 
                            ? "text-gray-600 hover:text-gray-900" 
                            : "text-gray-400 hover:text-gray-100"
                        }`}
                        {...(link.external && { target: "_blank", rel: "noopener noreferrer" })}
                      >
                        {link.name}
                        {link.badge && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                            isLight 
                              ? "bg-green-100 text-green-700" 
                              : "bg-green-900/50 text-green-300"
                          }`}>
                            {link.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={`py-6 border-t ${
          isLight ? "border-gray-200" : "border-slate-800"
        }`}>
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            {/* Left: Legal Links & Copyright */}
            <div className="flex flex-col sm:flex-row items-center gap-4 text-sm">
              <p className="text-muted-foreground">
                © {new Date().getFullYear()} MarketSage Intelligence. All rights reserved.
              </p>
              <div className="flex items-center gap-4">
                <Link 
                  href="/privacy" 
                  className={`transition-colors ${
                    isLight ? "text-gray-600 hover:text-gray-900" : "text-gray-400 hover:text-gray-100"
                  }`}
                >
                  Privacy Policy
                </Link>
                <Link 
                  href="/terms" 
                  className={`transition-colors ${
                    isLight ? "text-gray-600 hover:text-gray-900" : "text-gray-400 hover:text-gray-100"
                  }`}
                >
                  Terms of Service
                </Link>
                <Link 
                  href="/compliance" 
                  className={`transition-colors ${
                    isLight ? "text-gray-600 hover:text-gray-900" : "text-gray-400 hover:text-gray-100"
                  }`}
                >
                  Compliance
                </Link>
              </div>
            </div>

            {/* Center: Certifications */}
            <div className="flex items-center gap-6">
              {certifications.map((cert) => {
                const Icon = cert.icon;
                return (
                  <div 
                    key={cert.name}
                    className="flex items-center gap-2"
                    title={cert.name}
                  >
                    <Icon className={`h-4 w-4 ${
                      isLight ? "text-gray-500" : "text-gray-500"
                    }`} />
                    <span className="text-xs text-muted-foreground">
                      {cert.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Right: Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2 rounded-lg transition-colors ${
                      isLight 
                        ? "hover:bg-gray-100 text-gray-600 hover:text-gray-900" 
                        : "hover:bg-slate-800 text-gray-400 hover:text-gray-100"
                    }`}
                    aria-label={social.name}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Enterprise Contact CTA */}
        <div className={`py-4 text-center border-t ${
          isLight ? "border-gray-200" : "border-slate-800"
        }`}>
          <p className="text-sm text-muted-foreground">
            For enterprise inquiries:{" "}
            <a 
              href="mailto:enterprise@marketsage.ai" 
              className={`font-medium ${
                isLight ? "text-blue-600 hover:text-blue-700" : "text-blue-400 hover:text-blue-300"
              }`}
            >
              enterprise@marketsage.ai
            </a>
            {" "}or{" "}
            <a 
              href="tel:+2348000000000" 
              className={`font-medium ${
                isLight ? "text-blue-600 hover:text-blue-700" : "text-blue-400 hover:text-blue-300"
              }`}
            >
              +234 800 000 0000
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
} 