"use client";

import { Mail, MessageSquare, Smartphone, Clock, BarChart3, Palette, MessageCircle, Users } from "lucide-react";
import { SolutionHero } from "@/components/solutions/solution-hero";
import { SolutionFeatures } from "@/components/solutions/solution-features";
import { SolutionCTA } from "@/components/solutions/solution-cta";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";

export default function OmnichannelMessagingPage() {
  // Define primary color for this solution
  const primaryColor = "#3B82F6"; // Blue
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Define features for this solution
  const features = [
    {
      title: "Email Campaigns",
      description: "Create beautiful, responsive email campaigns with our drag-and-drop editor and pre-built templates.",
      icon: <Mail className="h-6 w-6" />,
    },
    {
      title: "SMS Marketing",
      description: "Send targeted SMS campaigns with high deliverability rates and detailed delivery tracking.",
      icon: <Smartphone className="h-6 w-6" />,
    },
    {
      title: "WhatsApp Business",
      description: "Engage customers on WhatsApp with rich media messages, automated responses, and conversation threading.",
      icon: <MessageCircle className="h-6 w-6" />,
    },
    {
      title: "Scheduled Campaigns",
      description: "Plan and schedule your campaigns across all channels to deliver at the optimal time for engagement.",
      icon: <Clock className="h-6 w-6" />,
    },
    {
      title: "Unified Analytics",
      description: "Track performance across all channels with a unified dashboard showing opens, clicks, and conversions.",
      icon: <BarChart3 className="h-6 w-6" />,
    },
    {
      title: "Message Personalization",
      description: "Dynamically personalize messages based on customer data, behavior, and segmentation.",
      icon: <Users className="h-6 w-6" />,
    },
  ];

  return (
    <>
      <SolutionHero
        title="Omnichannel Messaging"
        description="Seamlessly manage Email, SMS, and WhatsApp campaigns from a single platform with unified analytics and personalization."
        icon={<MessageSquare className="h-8 w-8" />}
        color={primaryColor}
      />
      
      <SolutionFeatures
        title="Reach Customers on Their Preferred Channel"
        description="Deliver consistent, personalized messaging across multiple channels to engage your audience wherever they are."
        features={features}
        color={primaryColor}
      />
      
      {/* Channel comparison section */}
      <section className={`py-20 ${isDark ? 'bg-background' : 'bg-slate-50'}`}>
        <div className="container px-4 mx-auto">
          <h2 className={`text-2xl md:text-3xl font-bold mb-12 text-center ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Choose the Right Channel for Every Message
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Email Channel */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className={`rounded-xl p-6 ${
                isDark 
                  ? 'bg-slate-900 border border-slate-800' 
                  : 'bg-white border border-slate-200 shadow-sm'
              }`}
            >
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
              >
                <Mail className="h-6 w-6" />
              </div>
              
              <h3 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Email
              </h3>
              
              <ul className={`space-y-2 mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Detailed, rich content</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>High ROI for nurturing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Automated sequences</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-1">~</span>
                  <span>Average open rates (15-25%)</span>
                </li>
              </ul>
              
              <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                Best for: Newsletters, product updates, detailed content
              </p>
            </motion.div>
            
            {/* SMS Channel */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className={`rounded-xl p-6 ${
                isDark 
                  ? 'bg-slate-900 border border-slate-800' 
                  : 'bg-white border border-slate-200 shadow-sm'
              }`}
            >
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
              >
                <Smartphone className="h-6 w-6" />
              </div>
              
              <h3 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                SMS
              </h3>
              
              <ul className={`space-y-2 mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Immediate delivery</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>High open rates (98%)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Works on all phones</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-1">~</span>
                  <span>Character limitations</span>
                </li>
              </ul>
              
              <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                Best for: Time-sensitive offers, reminders, alerts
              </p>
            </motion.div>
            
            {/* WhatsApp Channel */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className={`rounded-xl p-6 ${
                isDark 
                  ? 'bg-slate-900 border border-slate-800' 
                  : 'bg-white border border-slate-200 shadow-sm'
              }`}
            >
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
              >
                <MessageCircle className="h-6 w-6" />
              </div>
              
              <h3 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                WhatsApp
              </h3>
              
              <ul className={`space-y-2 mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Rich media support</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Conversational experience</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>High engagement rates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-1">~</span>
                  <span>Requires opt-in</span>
                </li>
              </ul>
              
              <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                Best for: Customer support, interactive campaigns
              </p>
            </motion.div>
          </div>
        </div>
      </section>
      
      <SolutionCTA
        title="Ready to Reach Your Customers Everywhere?"
        description="Start delivering personalized messages across email, SMS, and WhatsApp with our powerful omnichannel platform."
        color={primaryColor}
      />
    </>
  );
} 