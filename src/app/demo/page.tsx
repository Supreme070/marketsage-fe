"use client";

import { useState } from "react";
import { ArrowLeft, Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTheme } from "next-themes";

export default function DemoPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { theme } = useTheme();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      // In a real implementation, this would be an API call
      console.log("Demo request submitted:", formData);
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1500);
  };
  
  const isLight = theme === "light";
  
  return (
    <div className="container max-w-5xl mx-auto py-12 px-4">
      <Link 
        href="/" 
        className={`inline-flex items-center mb-8 ${
          isLight ? "text-gray-700 hover:text-gray-900" : "text-gray-300 hover:text-white"
        }`}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Link>
      
      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-6">
            Schedule a Demo of MarketSage
          </h1>
          
          <p className="text-muted-foreground mb-6">
            See how MarketSage can help your Nigerian business grow with powerful marketing automation tools designed for your local market.
          </p>
          
          <ul className="space-y-4 mb-8">
            {[
              "Personalized 30-minute demo with our team",
              "Get your specific questions answered",
              "See real-world examples relevant to your business",
              "Learn about our pricing and implementation options"
            ].map((item, i) => (
              <li key={i} className="flex">
                <div className="mr-3 mt-1">
                  <div className={`rounded-full p-1 ${isLight ? "bg-primary/10" : "bg-primary/20"}`}>
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className={`rounded-xl p-6 ${
          isLight 
            ? "bg-white border border-gray-200 shadow-sm" 
            : "bg-card border border-gray-800"
        }`}>
          {isSubmitted ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 text-primary mb-4">
                <Check className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Request Received!</h2>
              <p className="text-muted-foreground mb-6">
                Thank you for your interest. One of our team members will contact you within 24 hours to schedule your personalized demo.
              </p>
              <Link href="/">
                <Button>
                  Return to Home
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-6">Request Your Demo</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Your Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 ${
                      isLight 
                        ? 'bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-primary/30' 
                        : 'bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:ring-primary/30'
                    }`}
                    placeholder="Enter your name" 
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Business Email</label>
                  <input 
                    type="email" 
                    id="email" 
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 ${
                      isLight 
                        ? 'bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-primary/30' 
                        : 'bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:ring-primary/30'
                    }`}
                    placeholder="you@company.com" 
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">Phone Number</label>
                  <input 
                    type="tel" 
                    id="phone" 
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 ${
                      isLight 
                        ? 'bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-primary/30' 
                        : 'bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:ring-primary/30'
                    }`}
                    placeholder="+234 800 000 0000" 
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="company" className="text-sm font-medium">Company</label>
                  <input 
                    type="text" 
                    id="company" 
                    value={formData.company}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 ${
                      isLight 
                        ? 'bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-primary/30' 
                        : 'bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:ring-primary/30'
                    }`}
                    placeholder="Your company name" 
                  />
                </div>
                
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      Schedule Demo <Mail className="ml-2 h-4 w-4" />
                    </span>
                  )}
                </Button>
                
                <p className="text-xs text-center mt-4 text-muted-foreground">
                  By submitting this form, you agree to our <Link href="/terms" className="underline hover:text-foreground">Terms</Link> and <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 