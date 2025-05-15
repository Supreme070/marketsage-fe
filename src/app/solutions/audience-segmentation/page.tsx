"use client";

import { Users, UserCog, BrainCircuit, Target, Filter, Database, ListFilter, TrendingUp } from "lucide-react";
import { SolutionHero } from "@/components/solutions/solution-hero";
import { SolutionFeatures } from "@/components/solutions/solution-features";
import { SolutionCTA } from "@/components/solutions/solution-cta";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";

export default function AudienceSegmentationPage() {
  // Define primary color for this solution
  const primaryColor = "#F59E0B"; // Amber
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const solutionType = "audience-segmentation";

  // Define features for this solution
  const features = [
    {
      title: "Behavioral Targeting",
      description: "Segment your audience based on actions they've taken, pages they've visited, or products they've purchased.",
      icon: <Target className="h-6 w-6" />,
    },
    {
      title: "Demographic Filtering",
      description: "Target audiences based on location, age, gender, industry, company size, and other demographic attributes.",
      icon: <Filter className="h-6 w-6" />,
    },
    {
      title: "Engagement Scoring",
      description: "Automatically score contacts based on their level of engagement with your content and campaigns.",
      icon: <TrendingUp className="h-6 w-6" />,
    },
    {
      title: "Custom Fields",
      description: "Create and leverage custom fields to capture unique data points relevant to your business.",
      icon: <Database className="h-6 w-6" />,
    },
    {
      title: "Dynamic Segments",
      description: "Build segments that automatically update as contacts meet or no longer meet the defined criteria.",
      icon: <ListFilter className="h-6 w-6" />,
    },
    {
      title: "AI-Powered Predictions",
      description: "Leverage machine learning to predict which customers are most likely to convert or churn.",
      icon: <BrainCircuit className="h-6 w-6" />,
    },
  ];

  return (
    <>
      <SolutionHero
        title="Audience Segmentation"
        description="Target your ideal customers with powerful segmentation tools based on behavior, demographics, and engagement metrics."
        icon={<Users className="h-8 w-8" />}
        color={primaryColor}
        solutionType={solutionType}
      />
      
      <SolutionFeatures
        title="Target the Right Audience"
        description="Create highly targeted audience segments based on behavior, demographics, and engagement metrics."
        features={features}
        color={primaryColor}
        solutionType={solutionType}
      />
      
      {/* Segmentation process section */}
      <section className={`py-20 ${isDark ? 'bg-background' : 'bg-slate-50'}`}>
        <div className="container px-4 mx-auto">
          <h2 className={`text-2xl md:text-3xl font-bold mb-12 text-center ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            The Segmentation Process
          </h2>
          
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Connection line */}
              <div className={`absolute left-16 top-12 w-1 h-[calc(100%-4rem)] ${
                isDark ? 'bg-gradient-to-b from-amber-600/40 to-amber-600/10' : 'bg-gradient-to-b from-amber-500/40 to-amber-500/10'
              }`} />
              
              {/* Step 1 */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="flex mb-12"
              >
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center z-10 ${
                    isDark ? 'bg-amber-900/50 border border-amber-600/50' : 'bg-amber-100 border border-amber-300'
                  }`}
                  style={{ color: primaryColor }}
                >
                  <Database className="h-5 w-5" />
                </div>
                <div className="ml-8">
                  <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    1. Data Collection
                  </h3>
                  <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Automatically gather contact information, web behavior, purchase history, and engagement metrics through our platform.
                  </p>
                </div>
              </motion.div>
              
              {/* Step 2 */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="flex mb-12"
              >
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center z-10 ${
                    isDark ? 'bg-amber-900/50 border border-amber-600/50' : 'bg-amber-100 border border-amber-300'
                  }`}
                  style={{ color: primaryColor }}
                >
                  <Filter className="h-5 w-5" />
                </div>
                <div className="ml-8">
                  <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    2. Segment Definition
                  </h3>
                  <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Create segments using our intuitive drag-and-drop interface with AND/OR logic to combine multiple criteria.
                  </p>
                </div>
              </motion.div>
              
              {/* Step 3 */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true }}
                className="flex mb-12"
              >
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center z-10 ${
                    isDark ? 'bg-amber-900/50 border border-amber-600/50' : 'bg-amber-100 border border-amber-300'
                  }`}
                  style={{ color: primaryColor }}
                >
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div className="ml-8">
                  <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    3. AI Enrichment
                  </h3>
                  <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Our AI analyzes your segments to find patterns and suggests additional targeting criteria to improve results.
                  </p>
                </div>
              </motion.div>
              
              {/* Step 4 */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                viewport={{ once: true }}
                className="flex"
              >
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center z-10 ${
                    isDark ? 'bg-amber-900/50 border border-amber-600/50' : 'bg-amber-100 border border-amber-300'
                  }`}
                  style={{ color: primaryColor }}
                >
                  <Target className="h-5 w-5" />
                </div>
                <div className="ml-8">
                  <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    4. Campaign Execution
                  </h3>
                  <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Launch targeted campaigns to your segments across multiple channels, with personalized messaging for each group.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
      
      <SolutionCTA
        title="Ready to Target Your Audience More Effectively?"
        description="Start creating highly targeted audience segments that lead to better engagement, higher conversion rates, and improved ROI."
        color={primaryColor}
      />
    </>
  );
} 