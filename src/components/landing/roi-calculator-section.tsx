"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { 
  Calculator, 
  TrendingUp, 
  AlertTriangle, 
  Eye, 
  DollarSign,
  ArrowRight,
  Target,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ROICalculatorSection() {
  const { theme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState<string>("dark");
  const [mounted, setMounted] = useState(false);
  const [monthlyVisitors, setMonthlyVisitors] = useState<number>(100000);
  const [avgOrderValue, setAvgOrderValue] = useState<number>(50000);
  const [currentConversionRate, setCurrentConversionRate] = useState<number>(2.5);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle theme changes
  useEffect(() => {
    if (mounted) {
      setCurrentTheme(theme || "dark");
    }
  }, [theme, mounted]);

  const isLight = currentTheme === "light";

  const handleCalculate = () => {
    setIsCalculating(true);
    setTimeout(() => setIsCalculating(false), 1500);
  };

  // Calculate results
  const currentRevenue = monthlyVisitors * (currentConversionRate / 100) * avgOrderValue;
  const invisibleVisitors = monthlyVisitors * 0.23; // 23% invisible traffic
  const recoveredVisitors = invisibleVisitors * 0.78; // 78% recovery rate
  const additionalRevenue = recoveredVisitors * (currentConversionRate / 100) * avgOrderValue;
  const totalNewRevenue = currentRevenue + additionalRevenue;
  const revenueIncrease = ((totalNewRevenue - currentRevenue) / currentRevenue) * 100;

  if (!mounted) {
    return <div className="h-screen bg-background" />;
  }

  return (
    <section className={`py-20 ${isLight ? 'bg-white' : 'bg-slate-950'}`}>
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-6 ${isLight ? 'text-slate-900' : 'text-white'}`}
          >
            Calculate Your{" "}
            <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              Hidden Revenue Loss
            </span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className={`text-xl max-w-3xl mx-auto ${isLight ? 'text-slate-700' : 'text-slate-300'}`}
          >
            Most African enterprises lose 23% of potential revenue to invisible visitors. 
            Calculate exactly how much revenue you're losing right now.
          </motion.p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Calculator */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Card className={`${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/50 border-slate-700/50'}`}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <Calculator className="h-6 w-6 text-blue-400" />
                    Revenue Loss Calculator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="visitors" className={`text-sm font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        Monthly Website Visitors
                      </Label>
                      <Input
                        id="visitors"
                        type="number"
                        value={monthlyVisitors}
                        onChange={(e) => setMonthlyVisitors(Number(e.target.value))}
                        className={`mt-2 ${isLight ? 'bg-white border-slate-300' : 'bg-slate-800 border-slate-600 text-white'}`}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="aov" className={`text-sm font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        Average Order Value (₦)
                      </Label>
                      <Input
                        id="aov"
                        type="number"
                        value={avgOrderValue}
                        onChange={(e) => setAvgOrderValue(Number(e.target.value))}
                        className={`mt-2 ${isLight ? 'bg-white border-slate-300' : 'bg-slate-800 border-slate-600 text-white'}`}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="conversion" className={`text-sm font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        Current Conversion Rate (%)
                      </Label>
                      <Input
                        id="conversion"
                        type="number"
                        step="0.1"
                        value={currentConversionRate}
                        onChange={(e) => setCurrentConversionRate(Number(e.target.value))}
                        className={`mt-2 ${isLight ? 'bg-white border-slate-300' : 'bg-slate-800 border-slate-600 text-white'}`}
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleCalculate}
                    disabled={isCalculating}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                  >
                    {isCalculating ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Calculating...
                      </div>
                    ) : (
                      <>
                        <Calculator className="mr-2 h-4 w-4" />
                        Calculate Hidden Revenue Loss
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Results */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Current Revenue */}
              <Card className={`${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/30 border-slate-700/30'}`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <DollarSign className="h-5 w-5 text-green-400" />
                    <h3 className={`text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Current Monthly Revenue</h3>
                  </div>
                  <div className={`text-3xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>₦{currentRevenue.toLocaleString()}</div>
                  <div className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>From {(monthlyVisitors * currentConversionRate / 100).toLocaleString()} conversions</div>
                </CardContent>
              </Card>

              {/* Hidden Loss */}
              <Card className={`${isLight ? 'bg-red-50 border-red-200' : 'bg-red-500/10 border-red-500/20'}`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                    <h3 className={`text-lg font-semibold ${isLight ? 'text-red-800' : 'text-red-300'}`}>Hidden Revenue Loss</h3>
                    <Badge className="bg-red-500 text-white">23% Invisible Traffic</Badge>
                  </div>
                  <div className={`text-3xl font-bold ${isLight ? 'text-red-800' : 'text-red-300'}`}>₦{(invisibleVisitors * (currentConversionRate / 100) * avgOrderValue).toLocaleString()}</div>
                  <div className={`text-sm ${isLight ? 'text-red-600' : 'text-red-400'}`}>From {invisibleVisitors.toLocaleString()} invisible visitors per month</div>
                </CardContent>
              </Card>

              {/* Recovery Potential */}
              <Card className={`${isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/10 border-blue-500/20'}`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Target className="h-5 w-5 text-blue-400" />
                    <h3 className={`text-lg font-semibold ${isLight ? 'text-blue-800' : 'text-blue-300'}`}>MarketSage Recovery Potential</h3>
                    <Badge className="bg-blue-500 text-white">78% Recovery Rate</Badge>
                  </div>
                  <div className={`text-3xl font-bold ${isLight ? 'text-blue-800' : 'text-blue-300'}`}>₦{additionalRevenue.toLocaleString()}</div>
                  <div className={`text-sm ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>+{revenueIncrease.toFixed(1)}% revenue increase</div>
                </CardContent>
              </Card>

              {/* Total New Revenue */}
              <Card className={`${isLight ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200' : 'bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/20'}`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <TrendingUp className="h-5 w-5 text-green-400" />
                    <h3 className={`text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Total New Monthly Revenue</h3>
                  </div>
                  <div className={`text-4xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>₦{totalNewRevenue.toLocaleString()}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    <span className={`text-sm font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Powered by AI Intelligence</span>
                  </div>
                </CardContent>
              </Card>

              {/* CTA */}
              <div className="text-center pt-6">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4">
                  <Eye className="mr-2 h-5 w-5" />
                  Start Recovering This Revenue Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className={`text-sm mt-3 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Setup takes less than 5 minutes
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 text-center"
        >
          <div className={`inline-flex items-center gap-2 border rounded-full px-6 py-3 ${isLight ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'}`}>
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">African enterprises lose ₦2.3B monthly to invisible visitors</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 