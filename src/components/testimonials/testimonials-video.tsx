"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Building2, MapPin, Quote } from "lucide-react";

interface VideoTestimonial {
  id: string;
  company: string;
  industry: string;
  location: string;
  thumbnail: string;
  videoUrl: string;
  quote: string;
  author: string;
  role: string;
  duration: string;
}

const videoTestimonials: VideoTestimonial[] = [
  {
    id: "1",
    company: "GTBank",
    industry: "Banking",
    location: "Lagos, Nigeria",
    thumbnail: "/api/placeholder/600/400",
    videoUrl: "#",
    quote: "See how we increased customer engagement by 300%",
    author: "Segun Agbaje",
    role: "CEO",
    duration: "2:45"
  },
  {
    id: "2",
    company: "M-KOPA",
    industry: "Fintech",
    location: "Nairobi, Kenya",
    thumbnail: "/api/placeholder/600/400",
    videoUrl: "#",
    quote: "Discover our journey to 10M+ customers with MarketSage",
    author: "Jesse Moore",
    role: "Co-founder & CEO",
    duration: "3:12"
  },
  {
    id: "3",
    company: "Takealot",
    industry: "E-commerce",
    location: "Cape Town, South Africa",
    thumbnail: "/api/placeholder/600/400",
    videoUrl: "#",
    quote: "How AI-powered campaigns transformed our sales",
    author: "Kim Reid",
    role: "CEO",
    duration: "4:05"
  }
];

export function TestimonialsVideo() {
  const { theme } = useTheme();
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const isLight = theme === "light";

  return (
    <section className={`py-16 lg:py-24 ${
      isLight ? "bg-gray-50" : "bg-slate-950"
    }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Badge 
            variant="secondary" 
            className={`mb-4 ${
              isLight 
                ? "bg-purple-100 text-purple-700 border-purple-200" 
                : "bg-purple-900/50 text-purple-300 border-purple-800"
            }`}
          >
            <Play className="h-3 w-3 mr-1" />
            VIDEO TESTIMONIALS
          </Badge>
          
          <h2 className={`text-3xl lg:text-4xl font-bold mb-4 ${
            isLight ? "text-gray-900" : "text-gray-100"
          }`}>
            Hear directly from our customers
          </h2>
          <p className={`text-lg ${
            isLight ? "text-gray-600" : "text-gray-400"
          }`}>
            Watch African business leaders share their MarketSage success stories
          </p>
        </motion.div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {videoTestimonials.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`overflow-hidden border transition-all duration-300 hover:shadow-xl ${
                isLight 
                  ? "hover:border-gray-300" 
                  : "hover:border-gray-700"
              }`}>
                {/* Video Thumbnail */}
                <div className="relative aspect-video group cursor-pointer"
                     onClick={() => setPlayingVideo(video.id)}>
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10`} />
                  
                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${
                      isLight 
                        ? "bg-white/90 group-hover:bg-white" 
                        : "bg-gray-900/90 group-hover:bg-gray-900"
                    }`}>
                      <Play className={`h-6 w-6 ml-1 ${
                        isLight ? "text-gray-900" : "text-gray-100"
                      }`} />
                    </div>
                  </div>

                  {/* Duration Badge */}
                  <Badge className="absolute top-4 right-4 z-20 bg-black/70 text-white">
                    {video.duration}
                  </Badge>

                  {/* Quote Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 z-20">
                    <p className="text-white font-medium text-sm">
                      "{video.quote}"
                    </p>
                  </div>

                  {/* Placeholder Image */}
                  <div className={`w-full h-full ${
                    isLight ? "bg-gray-200" : "bg-gray-800"
                  }`} />
                </div>

                {/* Video Info */}
                <div className="p-6">
                  {/* Company */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isLight ? "bg-gray-100" : "bg-gray-800"
                    }`}>
                      <Building2 className={`h-5 w-5 ${
                        isLight ? "text-gray-600" : "text-gray-400"
                      }`} />
                    </div>
                    <div>
                      <h4 className={`font-semibold ${
                        isLight ? "text-gray-900" : "text-gray-100"
                      }`}>
                        {video.company}
                      </h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {video.location}
                      </p>
                    </div>
                  </div>

                  {/* Author */}
                  <div className={`pt-4 border-t ${
                    isLight ? "border-gray-200" : "border-gray-800"
                  }`}>
                    <p className={`font-medium text-sm ${
                      isLight ? "text-gray-900" : "text-gray-100"
                    }`}>
                      {video.author}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {video.role} • {video.industry}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`mt-16 p-8 rounded-2xl text-center ${
            isLight 
              ? "bg-white border border-gray-200" 
              : "bg-gray-900/50 border border-gray-800"
          }`}
        >
          <h3 className={`text-xl font-semibold mb-6 ${
            isLight ? "text-gray-900" : "text-gray-100"
          }`}>
            Trusted by Africa's most innovative companies
          </h3>
          
          <div className="flex flex-wrap items-center justify-center gap-8">
            {["Access Bank", "Jumia", "Safaricom", "Flutterwave", "MultiChoice", "Andela"].map((company) => (
              <div 
                key={company}
                className={`text-sm font-medium ${
                  isLight ? "text-gray-600" : "text-gray-400"
                }`}
              >
                {company}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}