import type { Metadata } from "next";
import { TestimonialsHeader } from "@/components/testimonials/testimonials-header";
import { TestimonialsHero } from "@/components/testimonials/testimonials-hero";
import { TestimonialsGrid } from "@/components/testimonials/testimonials-grid";
import { TestimonialsVideo } from "@/components/testimonials/testimonials-video";
import { TestimonialsStats } from "@/components/testimonials/testimonials-stats";
import { TestimonialsCTA } from "@/components/testimonials/testimonials-cta";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";

export const metadata: Metadata = {
  title: "Customer Success Stories - MarketSage Intelligence | African Enterprise Testimonials",
  description: "See how leading African enterprises use MarketSage to transform their marketing. Real stories, real results from Nigeria, Kenya, South Africa and beyond.",
};

export default function TestimonialsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      <main className="flex-1">
        <TestimonialsHeader />
        <TestimonialsHero />
        <TestimonialsStats />
        <TestimonialsGrid />
        <TestimonialsVideo />
        <TestimonialsCTA />
      </main>
      <LandingFooter />
    </div>
  );
}