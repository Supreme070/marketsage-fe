"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, Heart, Users, Globe, Star, Zap, Shield, Target,
  TrendingUp, Award, Gift, Compass, Sun, Moon, Palette, Brush
} from 'lucide-react';

export function AfricanShowcase() {
  return (
    <div className="space-y-12 p-8">
      {/* Header with African-inspired branding */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 mb-4">
          <div className="w-12 h-12 bg-kente-pattern rounded-full animate-kente-pattern flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold">
            <span className="market-cool bg-clip-text text-transparent">Market</span>
            <span className="market-warm bg-clip-text text-transparent">Sage</span>
          </h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Celebrating African design heritage with modern fintech innovation. 
          Ubuntu philosophy meets cutting-edge technology.
        </p>
      </div>

      {/* African-inspired color palette */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>African-Inspired Color Palette</span>
          </CardTitle>
          <CardDescription>
            Colors inspired by African textiles, sunsets, and earth tones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Kente Pattern */}
            <div className="space-y-4">
              <div className="h-32 bg-kente-pattern animate-kente-pattern rounded-lg flex items-center justify-center">
                <Badge className="bg-white/20 text-white">Kente Pattern</Badge>
              </div>
              <div className="text-center">
                <h3 className="font-semibold">Kente Inspiration</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Traditional Ghanaian royal cloth patterns
                </p>
              </div>
            </div>

            {/* African Sunset */}
            <div className="space-y-4">
              <div className="h-32 bg-african-sunset animate-kente-pattern rounded-lg flex items-center justify-center">
                <Badge className="bg-white/20 text-white">African Sunset</Badge>
              </div>
              <div className="text-center">
                <h3 className="font-semibold">Sunset Colors</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Warm hues of African sunsets
                </p>
              </div>
            </div>

            {/* Earth Tones */}
            <div className="space-y-4">
              <div className="h-32 bg-african-earth animate-kente-pattern rounded-lg flex items-center justify-center">
                <Badge className="bg-white/20 text-white">Earth Tones</Badge>
              </div>
              <div className="text-center">
                <h3 className="font-semibold">Earth & Clay</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Rich African soil and pottery colors
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ubuntu Philosophy Cards */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Ubuntu Philosophy in Design</h2>
          <p className="text-gray-600 dark:text-gray-300">
            "I am because we are" - Interconnected design elements
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Community First",
              description: "Collaborative features that bring people together",
              icon: Users,
              color: "bg-primary-500"
            },
            {
              title: "Shared Success",
              description: "Everyone benefits when the community thrives",
              icon: Heart,
              color: "bg-red-500"
            },
            {
              title: "Cultural Respect",
              description: "Honoring African traditions in modern design",
              icon: Globe,
              color: "bg-amber-500"
            },
            {
              title: "Inclusive Growth",
              description: "Building financial tools for all Africans",
              icon: TrendingUp,
              color: "bg-green-500"
            },
            {
              title: "Wisdom Sharing",
              description: "Learning from traditional African knowledge",
              icon: Star,
              color: "bg-purple-500"
            },
            {
              title: "Innovation Unity",
              description: "Combining ancient wisdom with modern technology",
              icon: Zap,
              color: "bg-blue-500"
            }
          ].map((item, index) => (
            <Card key={index} className="ubuntu-card hover-lift group">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-10 h-10 ${item.color} rounded-full flex items-center justify-center`}>
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="adinkra-symbol">
                    <h3 className="font-semibold">{item.title}</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Cultural Design Elements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brush className="h-5 w-5" />
            <span>Cultural Design Elements</span>
          </CardTitle>
          <CardDescription>
            Traditional African patterns and textures in modern UI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Wax Print Pattern */}
            <div className="space-y-4">
              <div className="h-48 wax-print-pattern rounded-lg border-2 tribal-border flex items-center justify-center">
                <div className="bg-white/90 dark:bg-gray-900/90 p-4 rounded-lg">
                  <h3 className="font-semibold text-center">Wax Print Pattern</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    Inspired by African textile designs
                  </p>
                </div>
              </div>
              <div className="text-center">
                <Badge className="bg-amber-500 text-white">Traditional Textiles</Badge>
              </div>
            </div>

            {/* Mudcloth Texture */}
            <div className="space-y-4">
              <div className="h-48 mudcloth-texture bg-amber-50 dark:bg-gray-800 rounded-lg border-2 border-amber-200 flex items-center justify-center">
                <div className="bg-white/90 dark:bg-gray-900/90 p-4 rounded-lg">
                  <h3 className="font-semibold text-center">Mudcloth Texture</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    Mali's traditional Bògòlanfini patterns
                  </p>
                </div>
              </div>
              <div className="text-center">
                <Badge className="bg-orange-500 text-white">Ancient Craft</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Mobile Components */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Mobile-First Design</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Optimized for African mobile usage patterns
          </p>
        </div>
        
        <div className="mobile-grid gap-4">
          {[
            { title: "Touch Friendly", icon: Shield, desc: "44px minimum touch targets" },
            { title: "Fast Loading", icon: Zap, desc: "Optimized for slow connections" },
            { title: "Offline Ready", icon: Target, desc: "Works without internet" },
            { title: "Data Efficient", icon: Compass, desc: "Minimal data usage" }
          ].map((item, index) => (
            <div key={index} className="mobile-card stagger-animation">
              <div className="touch-target">
                <item.icon className="h-6 w-6 text-primary-500 mb-2" />
                <h3 className="font-semibold text-sm">{item.title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Elements */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Elements</CardTitle>
          <CardDescription>
            Buttons and components with African-inspired animations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="ubuntu-button animate-ubuntu-pulse">
              Ubuntu Button
            </Button>
            <Button className="bg-kente-pattern animate-kente-pattern text-white">
              Kente Pattern
            </Button>
            <Button className="bg-african-sunset animate-african-shimmer text-white">
              African Sunset
            </Button>
            <Button className="bg-african-earth animate-baobab-sway text-white">
              Earth Tones
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Currency Display Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Fintech Currency Display</span>
          </CardTitle>
          <CardDescription>
            Enhanced currency formatting for African markets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">Large Amount</span>
              <span className="currency-large">₦2,847,392</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">Regular Display</span>
              <span className="currency-display">₦125,847</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">Small Amount</span>
              <span className="currency-small">₦1,234</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>Status Indicators</CardTitle>
          <CardDescription>
            Enhanced status display with African color psychology
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="status-success p-3 rounded-lg text-center">
              <Award className="h-5 w-5 mx-auto mb-1" />
              <span className="text-sm font-medium">Success</span>
            </div>
            <div className="status-warning p-3 rounded-lg text-center">
              <Sun className="h-5 w-5 mx-auto mb-1" />
              <span className="text-sm font-medium">Warning</span>
            </div>
            <div className="status-error p-3 rounded-lg text-center">
              <Shield className="h-5 w-5 mx-auto mb-1" />
              <span className="text-sm font-medium">Error</span>
            </div>
            <div className="status-info p-3 rounded-lg text-center">
              <Gift className="h-5 w-5 mx-auto mb-1" />
              <span className="text-sm font-medium">Info</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Optimizations */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Features</CardTitle>
          <CardDescription>
            Optimized for African internet conditions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="font-semibold mb-2">Reduced Motion Support</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically respects user's reduced motion preferences
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="font-semibold mb-2">GPU Acceleration</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Smooth animations even on older devices
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="font-semibold mb-2">Accessibility First</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Screen reader support and high contrast modes
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}