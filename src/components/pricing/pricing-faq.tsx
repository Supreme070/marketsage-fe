"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqItems = [
  {
    question: "Can I switch plans at any time?",
    answer: "Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll have immediate access to new features. When downgrading, changes take effect at the next billing cycle."
  },
  {
    question: "Do you offer discounts for Nigerian startups?",
    answer: "Yes, we offer special startup pricing for qualified Nigerian and African startups. Contact our sales team with your CAC documents and startup details to apply for up to 50% discount for the first year."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, bank transfers (Nigerian banks), and popular African payment methods including Paystack, Flutterwave, and Interswitch. For Enterprise plans, we also offer invoicing with NET 30 terms."
  },
  {
    question: "Is there a setup fee?",
    answer: "No setup fees for any plan! Starter and Growth plans include self-service onboarding with video tutorials. Enterprise plans include complimentary white-glove onboarding worth ₦500,000."
  },
  {
    question: "Can I pay in USD instead of Naira?",
    answer: "Yes, we offer USD pricing for international customers and Nigerian businesses that prefer dollar billing. Contact our sales team for USD rates which are locked in to protect against currency fluctuations."
  },
  {
    question: "What happens if I exceed my plan limits?",
    answer: "We'll notify you when you reach 80% of your limits. You can either upgrade your plan or purchase add-ons for additional contacts or email sends. We never stop your campaigns mid-flight."
  },
  {
    question: "Do you offer custom plans?",
    answer: "Absolutely! If our standard plans don't fit your needs, we can create a custom package. This is especially common for businesses needing specific features or higher limits without full Enterprise features."
  },
  {
    question: "Is my data safe with MarketSage?",
    answer: "Your data security is our top priority. We use bank-grade encryption, are SOC 2 Type II certified, GDPR compliant, and store data in secure facilities. Enterprise plans can opt for on-premise deployment."
  }
];

export function PricingFAQ() {
  const { theme } = useTheme();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const isLight = theme === "light";

  return (
    <section className={`py-16 lg:py-24 ${
      isLight ? "bg-white" : "bg-slate-900"
    }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${
              isLight ? "bg-blue-100" : "bg-blue-900/50"
            }`}>
              <HelpCircle className={`h-6 w-6 ${
                isLight ? "text-blue-600" : "text-blue-400"
              }`} />
            </div>
            <h2 className={`text-3xl lg:text-4xl font-bold mb-4 ${
              isLight ? "text-gray-900" : "text-gray-100"
            }`}>
              Frequently Asked Questions
            </h2>
            <p className={`text-lg ${
              isLight ? "text-gray-600" : "text-gray-400"
            }`}>
              Everything you need to know about our pricing
            </p>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className={`border transition-all duration-200 ${
                    isLight 
                      ? "hover:shadow-md" 
                      : "hover:bg-slate-800/50"
                  } ${
                    openIndex === index
                      ? isLight 
                        ? "shadow-md border-blue-200" 
                        : "bg-slate-800/50 border-blue-800"
                      : ""
                  }`}
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="w-full p-6 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className={`font-semibold pr-4 ${
                        isLight ? "text-gray-900" : "text-gray-100"
                      }`}>
                        {item.question}
                      </h3>
                      <ChevronDown 
                        className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 ${
                          openIndex === index ? "rotate-180" : ""
                        } ${
                          isLight ? "text-gray-500" : "text-gray-400"
                        }`}
                      />
                    </div>
                  </button>
                  
                  <AnimatePresence>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className={`px-6 pb-6 ${
                          isLight ? "text-gray-600" : "text-gray-400"
                        }`}>
                          {item.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Contact Support */}
          <div className={`mt-12 text-center p-8 rounded-lg ${
            isLight ? "bg-gray-50" : "bg-slate-800/50"
          }`}>
            <p className={`text-lg mb-2 ${
              isLight ? "text-gray-900" : "text-gray-100"
            }`}>
              Still have questions?
            </p>
            <p className="text-muted-foreground">
              Contact our sales team at{" "}
              <a 
                href="mailto:sales@marketsage.ai" 
                className={`font-medium ${
                  isLight ? "text-blue-600 hover:text-blue-700" : "text-blue-400 hover:text-blue-300"
                }`}
              >
                sales@marketsage.ai
              </a>
              {" "}or call{" "}
              <a 
                href="tel:+2348000000000" 
                className={`font-medium ${
                  isLight ? "text-blue-600 hover:text-blue-700" : "text-blue-400 hover:text-blue-300"
                }`}
              >
                +234 800 000 0000
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}