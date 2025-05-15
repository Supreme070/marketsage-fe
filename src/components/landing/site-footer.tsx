"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Facebook, Twitter, Instagram, Linkedin, Mail } from "lucide-react";

export function SiteFooter() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const currentYear = new Date().getFullYear();

  return (
    <footer className={`border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} py-12`}>
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <span className="text-2xl font-bold brand-text-new">
                <span className="market">Market</span><span className="sage">Sage</span>
              </span>
            </div>
            <p className={`max-w-md ${isDark ? 'text-slate-400' : 'text-slate-600'} mb-6`}>
              Marketing automation platform designed specifically for Nigerian businesses to create, execute, and optimize multi-channel campaigns.
            </p>
            <div className="flex space-x-4">
              <Link href="https://facebook.com" className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>
                <Facebook size={20} />
              </Link>
              <Link href="https://twitter.com" className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>
                <Twitter size={20} />
              </Link>
              <Link href="https://instagram.com" className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>
                <Instagram size={20} />
              </Link>
              <Link href="https://linkedin.com" className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>
                <Linkedin size={20} />
              </Link>
            </div>
          </div>
          
          <div>
            <h3 className={`font-semibold text-lg mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Solutions</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/solutions/workflow-automation" className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>
                  Workflow Automation
                </Link>
              </li>
              <li>
                <Link href="/solutions/omnichannel-messaging" className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>
                  Omnichannel Messaging
                </Link>
              </li>
              <li>
                <Link href="/solutions/audience-segmentation" className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>
                  Audience Segmentation
                </Link>
              </li>
              <li>
                <Link href="/solutions/analytics-reporting" className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>
                  Analytics & Reporting
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className={`font-semibold text-lg mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/careers" className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/blog" className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>
                  Blog
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className={isDark ? 'text-slate-400' : 'text-slate-600'} />
                <a href="mailto:info@marketsage.ng" className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>
                  info@marketsage.ng
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className={`border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} mt-12 pt-8 flex flex-col md:flex-row justify-between items-center`}>
          <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm mb-4 md:mb-0`}>
            &copy; {currentYear} MarketSage. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link href="/privacy" className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'} text-sm transition-colors`}>
              Privacy Policy
            </Link>
            <Link href="/terms" className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'} text-sm transition-colors`}>
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
} 