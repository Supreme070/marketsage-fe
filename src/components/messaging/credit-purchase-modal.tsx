"use client";

import type React from 'react';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  Wallet, 
  Plus, 
  Check, 
  Star, 
  Gift, 
  TrendingUp, 
  Shield, 
  Clock,
  Zap,
  DollarSign,
  Percent,
  Award,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { 
  BulkPricingCalculator, 
  PRICING_TIERS, 
  PAYMENT_OPTIONS, 
  CurrencyConverter 
} from '@/lib/pricing/bulk-pricing';
import { useToast } from '@/hooks/use-toast';

interface CreditPurchaseModalProps {
  currentBalance: number;
  onPurchaseComplete: (newBalance: number) => void;
  region?: string;
  children?: React.ReactNode;
}

export function CreditPurchaseModal({ 
  currentBalance, 
  onPurchaseComplete, 
  region = 'global',
  children 
}: CreditPurchaseModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState(100);
  const [paymentMethod, setPaymentMethod] = useState('paystack');
  const [currency, setCurrency] = useState('USD');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('quick');
  const { toast } = useToast();

  const availablePaymentOptions = BulkPricingCalculator.getPaymentOptionsForRegion(region);
  const recommendedPaymentOption = BulkPricingCalculator.getRecommendedPaymentOption(region);
  const pricing = BulkPricingCalculator.calculatePrice(amount);
  const processingFee = BulkPricingCalculator.calculateProcessingFee(pricing.finalAmount, paymentMethod);
  const totalAmount = pricing.finalAmount + processingFee;

  // Set recommended payment method on mount
  useEffect(() => {
    if (recommendedPaymentOption) {
      setPaymentMethod(recommendedPaymentOption.id);
    }
  }, [recommendedPaymentOption]);

  const handleQuickSelect = (selectedAmount: number) => {
    setAmount(selectedAmount);
    setActiveTab('payment');
  };

  const handleCustomAmount = (value: string) => {
    const numValue = Number.parseFloat(value);
    if (!isNaN(numValue) && numValue >= 10 && numValue <= 10000) {
      setAmount(numValue);
    }
  };

  const handlePurchase = async () => {
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/messaging/credits/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          paymentMethod,
          region,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.paymentUrl) {
          // Redirect to payment gateway
          window.location.href = data.paymentUrl;
        } else {
          // Manual payment completed
          onPurchaseComplete(data.newBalance);
          setIsOpen(false);
          toast({
            title: "Credits Added Successfully",
            description: `${data.purchasedAmount} credits have been added to your account.`,
          });
        }
      } else {
        throw new Error(data.error || 'Purchase failed');
      }
    } catch (error) {
      toast({
        title: "Purchase Failed",
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number, curr: string = currency) => {
    return CurrencyConverter.format(amount, curr);
  };

  const convertedAmount = CurrencyConverter.convert(totalAmount, 'USD', currency);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Credits
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Add Credits to Your Account
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quick">Quick Select</TabsTrigger>
            <TabsTrigger value="custom">Custom Amount</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
          </TabsList>

          <TabsContent value="quick" className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Choose Your Credit Package</h3>
              <p className="text-muted-foreground">Select from our popular credit packages with built-in discounts</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PRICING_TIERS.map((tier) => (
                <Card 
                  key={tier.id} 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    tier.popular ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleQuickSelect(tier.minAmount)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{tier.name}</CardTitle>
                      {tier.popular && (
                        <Badge variant="default" className="bg-primary">
                          <Star className="h-3 w-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{tier.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          ${tier.minAmount}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {tier.minAmount + tier.bonusCredits} credits
                        </div>
                      </div>
                      
                      {tier.discountPercentage > 0 && (
                        <div className="flex items-center justify-center gap-2 text-green-600">
                          <Percent className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {tier.discountPercentage}% OFF
                          </span>
                        </div>
                      )}
                      
                      {tier.bonusCredits > 0 && (
                        <div className="flex items-center justify-center gap-2 text-orange-600">
                          <Gift className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            +{tier.bonusCredits} Bonus Credits
                          </span>
                        </div>
                      )}
                      
                      <div className="text-center">
                        <Badge variant="outline" className="text-xs">
                          {tier.savings}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Custom Amount</h3>
              <p className="text-muted-foreground">Enter your desired credit amount (min: $10, max: $10,000)</p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => handleCustomAmount(e.target.value)}
                    min="10"
                    max="10000"
                    step="1"
                    className="pl-10"
                    placeholder="Enter amount"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Display Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="NGN">NGN (₦)</SelectItem>
                    <SelectItem value="GHS">GHS (₵)</SelectItem>
                    <SelectItem value="KES">KES (KSh)</SelectItem>
                    <SelectItem value="ZAR">ZAR (R)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Suggested amounts */}
              <div className="space-y-2">
                <Label>Quick Amounts</Label>
                <div className="grid grid-cols-3 gap-2">
                  {BulkPricingCalculator.getSuggestedAmounts().map((suggestedAmount) => (
                    <Button
                      key={suggestedAmount}
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(suggestedAmount)}
                      className={amount === suggestedAmount ? 'bg-primary text-primary-foreground' : ''}
                    >
                      ${suggestedAmount}
                    </Button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={() => setActiveTab('payment')} 
                className="w-full"
                disabled={amount < 10 || amount > 10000}
              >
                Continue to Payment
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="payment" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Base Amount</span>
                      <span>{formatCurrency(amount)}</span>
                    </div>
                    
                    {pricing.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({pricing.tier.discountPercentage}%)</span>
                        <span>-{formatCurrency(pricing.discount)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatCurrency(pricing.finalAmount)}</span>
                    </div>
                    
                    {processingFee > 0 && (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Processing Fee</span>
                        <span>{formatCurrency(processingFee)}</span>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{formatCurrency(totalAmount)}</span>
                    </div>
                    
                    {currency !== 'USD' && (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>In {currency}</span>
                        <span>{formatCurrency(convertedAmount, currency)}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Credits You'll Receive</span>
                      <span className="text-2xl font-bold text-primary">
                        {pricing.totalCredits}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Base Credits</span>
                      <span>{amount}</span>
                    </div>
                    
                    {pricing.bonusCredits > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Bonus Credits</span>
                        <span>+{pricing.bonusCredits}</span>
                      </div>
                    )}
                  </div>

                  {BulkPricingCalculator.qualifiesForBulkDiscount(amount) && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <Award className="h-4 w-4" />
                        <span className="font-medium">Great Choice!</span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        You're saving {formatCurrency(pricing.savings)} with this package!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    {availablePaymentOptions.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.id} id={option.id} />
                        <Label 
                          htmlFor={option.id} 
                          className="flex items-center gap-3 cursor-pointer flex-1"
                        >
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">{option.name}</div>
                            {option.id === recommendedPaymentOption?.id && (
                              <Badge variant="secondary" className="text-xs">
                                Recommended
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground ml-auto">
                            {option.description}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  <div className="space-y-2 pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      <span>256-bit SSL encryption</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Instant credit delivery</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <RefreshCw className="h-4 w-4" />
                      <span>30-day money-back guarantee</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Current Balance: {formatCurrency(currentBalance)}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setActiveTab('custom')}>
                  Back
                </Button>
                <Button 
                  onClick={handlePurchase}
                  disabled={isProcessing}
                  className="min-w-[120px]"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Purchase Credits
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}