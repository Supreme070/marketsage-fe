"use client";

import { useEffect, useState } from "react";

export function IntegrationsSection() {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    
    const section = document.getElementById("integrations");
    if (section) {
      observer.observe(section);
    }
    
    return () => {
      if (section) {
        observer.unobserve(section);
      }
    };
  }, []);

  const integrations = [
    { name: "Shopify", logo: "Shopify" },
    { name: "Paystack", logo: "Paystack" },
    { name: "Flutterwave", logo: "Flutterwave" },
    { name: "WordPress", logo: "WordPress" },
    { name: "Zapier", logo: "Zapier" },
    { name: "Google Analytics", logo: "Google" },
  ];

  return (
    <section id="integrations" className="py-20 bg-muted/30">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col items-center text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Integrate with Your Favorite Tools
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            MarketSage seamlessly connects with the tools you already use, 
            making it easy to streamline your marketing workflows.
          </p>
        </div>
        
        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          {integrations.map((integration, index) => (
            <div 
              key={index}
              className="h-24 rounded-lg border bg-card flex items-center justify-center p-6"
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="flex flex-col items-center justify-center">
                <div className="font-mono text-2xl text-primary">
                  {integration.logo}
                </div>
                <div className="text-sm mt-1 text-muted-foreground">
                  {integration.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 