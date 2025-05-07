"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { StarIcon } from "lucide-react";

export function TestimonialsSection() {
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
    
    const section = document.getElementById("testimonials");
    if (section) {
      observer.observe(section);
    }
    
    return () => {
      if (section) {
        observer.unobserve(section);
      }
    };
  }, []);

  const testimonials = [
    {
      quote:
        "MarketSage completely transformed how we reach our customers. The WhatsApp integration has been a game-changer for our business in Lagos.",
      author: "Adebayo Ogunlesi",
      title: "CEO at TechVentures Nigeria",
      stars: 5
    },
    {
      quote:
        "The email templates are beautiful and the analytics provide valuable insights. We saw a 40% increase in engagement within the first month.",
      author: "Ngozi Okonjo-Iweala",
      title: "Marketing Director at AfriRetail",
      stars: 5
    },
    {
      quote:
        "I love how easy it is to segment our customer base and create targeted campaigns. MarketSage understands the unique needs of African businesses.",
      author: "Chimamanda Adichie",
      title: "Founder of CreativeMind Studios",
      stars: 5
    }
  ];

  return (
    <section id="testimonials" className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Testimonials
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Trusted by African Businesses
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See what our customers across Africa have to say about using MarketSage to grow their businesses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={`bg-card border rounded-xl p-6 shadow-sm transition-all duration-700 ${
                isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-16'
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="flex mb-4">
                {[...Array(testimonial.stars)].map((_, i) => (
                  <StarIcon key={i} className="h-5 w-5 text-accent fill-accent" />
                ))}
              </div>
              <blockquote className="text-lg mb-6">
                "{testimonial.quote}"
              </blockquote>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mr-4">
                  <span className="text-primary font-semibold text-lg">
                    {testimonial.author.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className={`mt-16 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 transition-all duration-1000 delay-500 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="flex">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center border-2 border-background">
              <span className="text-primary font-semibold">A</span>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center -ml-3 border-2 border-background">
              <span className="text-primary font-semibold">N</span>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center -ml-3 border-2 border-background">
              <span className="text-primary font-semibold">C</span>
            </div>
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center -ml-3 border-2 border-background">
              <span className="text-muted-foreground font-semibold">+</span>
            </div>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-sm text-muted-foreground">Trusted by 500+ businesses across Africa</p>
            <div className="flex items-center justify-center sm:justify-start mt-1">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className="h-4 w-4 text-accent fill-accent" />
              ))}
              <span className="ml-2 text-sm font-medium">4.9/5 (120+ reviews)</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 