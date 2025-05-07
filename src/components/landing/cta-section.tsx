"use client";

import Link from "next/link";

export function CtaSection() {
  return (
    <section className="py-20 bg-[#2DD4BF] relative">
      <div 
        className="absolute inset-0 bg-grid-pattern opacity-10 z-0"
        style={{ 
          backgroundImage: "radial-gradient(circle, rgba(255, 255, 255, 0.3) 1px, transparent 1px)",
          backgroundSize: "30px 30px" 
        }}
      />
      
      <div className="container px-4 mx-auto relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-6 text-white"
              style={{ fontFamily: 'Inter, sans-serif', lineHeight: 1.2 }}>
            Try MarketSage for free
          </h2>
          <p className="text-lg text-white/90 mb-10"
             style={{ fontFamily: 'Inter, sans-serif', lineHeight: 1.5, maxWidth: "65ch", margin: "0 auto 2.5rem" }}>
            Unlock the power of your customer data to create personalization, 1:1 interactions that drive
            incremental revenue, engagement, and increased customer life time value. Try it free for a full
            30-day trial.
          </p>
          <div className="flex justify-center">
            <Link href="/register">
              <button className="h-12 px-8 rounded bg-[#FBBF24] text-[#111827] font-medium flex items-center justify-center hover:bg-[#F59E0B] transition-colors"
                      style={{ fontFamily: 'Inter, sans-serif' }}>
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
} 