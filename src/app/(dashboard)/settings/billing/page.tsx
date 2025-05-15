"use client";

import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  CreditCard, 
  CalendarDays, 
  CheckCircle2, 
  Download, 
  FileText, 
  Clock, 
  ArrowUpRight, 
  Plus,
  MoreHorizontal,
  Wallet,
  CreditCardIcon,
  Loader2,
  Trash2
} from "lucide-react";

export default function BillingSettingsPage() {
  // State management
  const [loading, setLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showChangePlanDialog, setShowChangePlanDialog] = useState(false);
  const [showDeletePaymentDialog, setShowDeletePaymentDialog] = useState(false);
  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("premium");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [billingAddress, setBillingAddress] = useState({
    companyName: "Acme Inc.",
    taxId: "NG1234567890",
    addressLine1: "123 Business Avenue",
    addressLine2: "Suite 456",
    city: "Lagos",
    state: "Lagos State",
    zip: "100001",
    country: "NG",
  });
  const [newCard, setNewCard] = useState({
    cardNumber: "",
    cardholderName: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
  });
  
  // Subscription Plan Data
  const [subscriptionPlan, setSubscriptionPlan] = useState({
    name: "Premium Plan",
    status: "active",
    interval: "monthly", // monthly or yearly
    price: "₦25,000",
    nextBillingDate: "June 5, 2025",
    features: [
      "Unlimited contacts",
      "Email campaigns",
      "SMS and WhatsApp campaigns",
      "Advanced analytics",
      "API access",
      "Priority support",
    ],
  });

  const plans = {
    standard: {
      name: "Standard Plan",
      monthlyPrice: "₦15,000",
      yearlyPrice: "₦162,000", // 10% discount for yearly
      features: [
        "Up to 10,000 contacts",
        "Email campaigns",
        "Basic analytics",
      ],
    },
    premium: {
      name: "Premium Plan",
      monthlyPrice: "₦25,000",
      yearlyPrice: "₦270,000", // 10% discount for yearly
      features: [
        "Unlimited contacts",
        "Email, SMS, and WhatsApp",
        "Advanced analytics",
        "Priority support",
      ],
    },
    enterprise: {
      name: "Enterprise Plan",
      monthlyPrice: "Custom",
      yearlyPrice: "Custom",
      features: [
        "Everything in Premium",
        "Dedicated account manager",
        "Custom integrations",
        "SLA guarantees",
      ],
    }
  };

  // Payment methods
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: "card_1",
      type: "card",
      brand: "Visa",
      last4: "4242",
      expiryMonth: "12",
      expiryYear: "26",
      isDefault: true,
    },
    {
      id: "card_2",
      type: "card",
      brand: "Mastercard",
      last4: "8888",
      expiryMonth: "09",
      expiryYear: "25",
      isDefault: false,
    },
  ]);

  const invoiceHistory = [
    {
      id: "inv_001",
      number: "INV-001-2025",
      date: "May 5, 2025",
      amount: "₦25,000",
      status: "paid",
    },
    {
      id: "inv_002",
      number: "INV-002-2025",
      date: "April 5, 2025",
      amount: "₦25,000",
      status: "paid",
    },
    {
      id: "inv_003",
      number: "INV-003-2025",
      date: "March 5, 2025",
      amount: "₦25,000",
      status: "paid",
    },
  ];

  // Subscription plan handlers
  const handleChangePlan = (plan: string) => {
    if (plan === "enterprise") {
      // For enterprise, we'd typically open a contact form or redirect
      window.open("mailto:sales@marketsage.com?subject=Enterprise Plan Inquiry", "_blank");
    } else {
      setSelectedPlan(plan);
      setShowChangePlanDialog(true);
    }
  };

  const confirmPlanChange = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const newPlan = plans[selectedPlan as keyof typeof plans];
      setSubscriptionPlan({
        ...subscriptionPlan,
        name: newPlan.name,
        price: billingCycle === "monthly" ? newPlan.monthlyPrice : newPlan.yearlyPrice,
        interval: billingCycle,
        features: newPlan.features,
      });
      
      setLoading(false);
      setShowChangePlanDialog(false);
      toast.success(`Successfully changed to ${newPlan.name}`);
    }, 1500);
  };

  const handleCancelSubscription = () => {
    setShowCancelDialog(true);
  };

  const confirmCancelSubscription = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setSubscriptionPlan({
        ...subscriptionPlan,
        status: "cancelled",
      });
      
      setLoading(false);
      setShowCancelDialog(false);
      toast.success("Subscription cancelled successfully. Your plan will remain active until the end of the billing period.");
    }, 1500);
  };

  const handleUpdateBillingCycle = () => {
    const newCycle = subscriptionPlan.interval === "monthly" ? "yearly" : "monthly";
    const currentPlan = Object.entries(plans).find(([_, plan]) => plan.name === subscriptionPlan.name)?.[0] as keyof typeof plans;
    
    if (!currentPlan) return;
    
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setSubscriptionPlan({
        ...subscriptionPlan,
        interval: newCycle,
        price: newCycle === "monthly" ? plans[currentPlan].monthlyPrice : plans[currentPlan].yearlyPrice,
      });
      
      setLoading(false);
      toast.success(`Successfully changed to ${newCycle} billing cycle`);
    }, 1500);
  };

  // Payment method handlers
  const handleSetDefaultPaymentMethod = (id: string) => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const updatedMethods = paymentMethods.map(method => ({
        ...method,
        isDefault: method.id === id,
      }));
      
      setPaymentMethods(updatedMethods);
      setLoading(false);
      toast.success("Default payment method updated");
    }, 1000);
  };

  const handleDeletePaymentMethod = (id: string) => {
    setSelectedPaymentMethod(id);
    setShowDeletePaymentDialog(true);
  };

  const confirmDeletePaymentMethod = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const method = paymentMethods.find(m => m.id === selectedPaymentMethod);
      const wasDefault = method?.isDefault || false;
      let updatedMethods = paymentMethods.filter(m => m.id !== selectedPaymentMethod);
      
      // If we removed the default, make another one default
      if (wasDefault && updatedMethods.length > 0) {
        updatedMethods = updatedMethods.map((method, index) => ({
          ...method,
          isDefault: index === 0, // Make the first one default
        }));
      }
      
      setPaymentMethods(updatedMethods);
      setLoading(false);
      setShowDeletePaymentDialog(false);
      toast.success("Payment method removed");
    }, 1000);
  };

  const handleAddPaymentMethod = () => {
    setShowAddPaymentDialog(true);
  };

  const handleSubmitNewCard = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Validate card info (basic validation)
    if (!newCard.cardNumber || !newCard.cardholderName || !newCard.expiryMonth || !newCard.expiryYear || !newCard.cvv) {
      toast.error("Please fill in all card details");
      setLoading(false);
      return;
    }
    
    // Simulate API call
    setTimeout(() => {
      // Create new card with random brand based on first digit
      const firstDigit = newCard.cardNumber.charAt(0);
      const brand = firstDigit === "4" ? "Visa" : "Mastercard";
      const last4 = newCard.cardNumber.slice(-4);
      
      const newPaymentMethod = {
        id: `card_${Date.now()}`,
        type: "card",
        brand,
        last4,
        expiryMonth: newCard.expiryMonth,
        expiryYear: newCard.expiryYear,
        isDefault: paymentMethods.length === 0, // Make default if it's the first card
      };
      
      setPaymentMethods([...paymentMethods, newPaymentMethod]);
      setNewCard({
        cardNumber: "",
        cardholderName: "",
        expiryMonth: "",
        expiryYear: "",
        cvv: "",
      });
      
      setLoading(false);
      setShowAddPaymentDialog(false);
      toast.success("New payment method added");
    }, 1500);
  };

  const handleSaveBillingAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success("Billing address updated");
    }, 1000);
  };

  // Invoices handlers
  const handleDownloadInvoice = (invoiceId: string) => {
    const invoice = invoiceHistory.find(inv => inv.id === invoiceId);
    if (!invoice) return;
    
    // In a real app, this would call an API endpoint to get the PDF
    toast.success(`Downloading invoice ${invoice.number}...`);
    
    // Simulate download
    setTimeout(() => {
      toast.success(`Invoice ${invoice.number} downloaded`);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Billing & Subscription</h3>
        <p className="text-sm text-muted-foreground">
          Manage your subscription plan and payment methods.
        </p>
      </div>
      <Separator />
      
      <Tabs defaultValue="subscription" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="usage">Usage & Limits</TabsTrigger>
        </TabsList>
        
        <TabsContent value="subscription" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                Manage your subscription plan and billing cycle
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{subscriptionPlan.name}</h3>
                  <div className="flex items-center mt-1">
                    <Badge className={subscriptionPlan.status === "active" ? 
                      "bg-green-100 text-green-800 hover:bg-green-100" : 
                      "bg-red-100 text-red-800 hover:bg-red-100"}>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {subscriptionPlan.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground ml-2">
                      {subscriptionPlan.price}/{subscriptionPlan.interval}
                    </span>
                  </div>
                </div>
                <Button 
                  onClick={() => handleChangePlan(subscriptionPlan.name.toLowerCase().includes("premium") ? "standard" : "premium")}
                  disabled={subscriptionPlan.status === "cancelled" || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : "Change Plan"}
                </Button>
              </div>
              
              <div className="bg-secondary/10 p-4 rounded-lg flex items-center space-x-4">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Next billing date</h4>
                  <p className="text-sm text-muted-foreground">
                    {subscriptionPlan.status === "cancelled" 
                      ? "Your subscription will end on " + subscriptionPlan.nextBillingDate 
                      : subscriptionPlan.nextBillingDate}
                  </p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Included in your plan</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-1">
                  {subscriptionPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button 
                variant="outline" 
                onClick={handleCancelSubscription}
                disabled={subscriptionPlan.status === "cancelled" || loading}
              >
                {subscriptionPlan.status === "cancelled" ? "Cancelled" : "Cancel Subscription"}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleUpdateBillingCycle}
                disabled={subscriptionPlan.status === "cancelled" || loading}
              >
                Switch to {subscriptionPlan.interval === "monthly" ? "Yearly" : "Monthly"} Billing
              </Button>
            </CardFooter>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Standard Plan</CardTitle>
                <span className="text-2xl font-bold">{plans.standard.monthlyPrice}</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </CardHeader>
              <CardContent className="space-y-2">
                <ul className="space-y-2 text-sm">
                  {plans.standard.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-primary mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleChangePlan("standard")}
                  disabled={subscriptionPlan.name === plans.standard.name || loading}
                >
                  {subscriptionPlan.name === plans.standard.name ? "Current Plan" : "Choose Plan"}
                </Button>
              </CardFooter>
            </Card>
            
            <Card className={subscriptionPlan.name === plans.premium.name ? "border-primary" : ""}>
              {subscriptionPlan.name === plans.premium.name && (
                <div className="bg-primary text-primary-foreground text-center py-1 text-sm font-medium">
                  Current Plan
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Premium Plan</CardTitle>
                <span className="text-2xl font-bold">{plans.premium.monthlyPrice}</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </CardHeader>
              <CardContent className="space-y-2">
                <ul className="space-y-2 text-sm">
                  {plans.premium.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-primary mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  disabled={subscriptionPlan.name === plans.premium.name || loading}
                  onClick={() => handleChangePlan("premium")}
                >
                  {subscriptionPlan.name === plans.premium.name ? "Current Plan" : "Choose Plan"}
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Enterprise Plan</CardTitle>
                <span className="text-2xl font-bold">Custom</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </CardHeader>
              <CardContent className="space-y-2">
                <ul className="space-y-2 text-sm">
                  {plans.enterprise.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-primary mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleChangePlan("enterprise")}
                >
                  Contact Sales
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="payment-methods" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>
                    Manage your payment methods and billing details
                  </CardDescription>
                </div>
                <Button size="sm" onClick={handleAddPaymentMethod}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-t">
                {paymentMethods.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-muted-foreground mb-4">No payment methods added yet</p>
                    <Button onClick={handleAddPaymentMethod}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Payment Method
                    </Button>
                  </div>
                ) : (
                  paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-4 border-b">
                      <div className="flex items-center space-x-4">
                        <div className="bg-secondary/20 p-2 rounded-full">
                          {method.brand === "Visa" ? (
                            <CreditCard className="h-5 w-5 text-blue-600" />
                          ) : (
                            <CreditCard className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">
                            {method.brand} ending in {method.last4}
                            {method.isDefault && (
                              <Badge variant="outline" className="ml-2">
                                Default
                              </Badge>
                            )}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Expires {method.expiryMonth}/{method.expiryYear}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!method.isDefault && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleSetDefaultPaymentMethod(method.id)}
                            disabled={loading}
                          >
                            Set as Default
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeletePaymentMethod(method.id)}
                          disabled={loading || (method.isDefault && paymentMethods.length > 1)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Billing Address</CardTitle>
              <CardDescription>
                Used for invoices and tax purposes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSaveBillingAddress}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input 
                      id="company-name" 
                      value={billingAddress.companyName}
                      onChange={(e) => setBillingAddress({...billingAddress, companyName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax-id">Tax ID</Label>
                    <Input 
                      id="tax-id" 
                      value={billingAddress.taxId}
                      onChange={(e) => setBillingAddress({...billingAddress, taxId: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2 mt-4">
                  <Label htmlFor="address-line1">Address Line 1</Label>
                  <Input 
                    id="address-line1" 
                    value={billingAddress.addressLine1}
                    onChange={(e) => setBillingAddress({...billingAddress, addressLine1: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2 mt-4">
                  <Label htmlFor="address-line2">Address Line 2 (Optional)</Label>
                  <Input 
                    id="address-line2" 
                    value={billingAddress.addressLine2}
                    onChange={(e) => setBillingAddress({...billingAddress, addressLine2: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input 
                      id="city" 
                      value={billingAddress.city}
                      onChange={(e) => setBillingAddress({...billingAddress, city: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input 
                      id="state" 
                      value={billingAddress.state}
                      onChange={(e) => setBillingAddress({...billingAddress, state: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">Postal/Zip Code</Label>
                    <Input 
                      id="zip" 
                      value={billingAddress.zip}
                      onChange={(e) => setBillingAddress({...billingAddress, zip: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2 mt-4">
                  <Label htmlFor="country">Country</Label>
                  <select 
                    id="country" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={billingAddress.country}
                    onChange={(e) => setBillingAddress({...billingAddress, country: e.target.value})}
                  >
                    <option value="NG">Nigeria</option>
                    <option value="GH">Ghana</option>
                    <option value="KE">Kenya</option>
                    <option value="ZA">South Africa</option>
                  </select>
                </div>
                
                <div className="mt-6">
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : "Save Billing Address"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoice History</CardTitle>
              <CardDescription>
                View and download your past invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-t">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="p-4 font-medium text-muted-foreground">Invoice</th>
                      <th className="p-4 font-medium text-muted-foreground">Date</th>
                      <th className="p-4 font-medium text-muted-foreground">Amount</th>
                      <th className="p-4 font-medium text-muted-foreground">Status</th>
                      <th className="p-4 font-medium text-muted-foreground"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceHistory.map((invoice) => (
                      <tr key={invoice.id} className="border-b">
                        <td className="p-4 font-medium">{invoice.number}</td>
                        <td className="p-4 text-muted-foreground">{invoice.date}</td>
                        <td className="p-4">{invoice.amount}</td>
                        <td className="p-4">
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            {invoice.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownloadInvoice(invoice.id)}
                            disabled={loading}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage & Limits</CardTitle>
              <CardDescription>
                Monitor your resource usage and limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Contacts</span>
                  <span className="text-sm">5,250 / Unlimited</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '20%' }} />
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Email Sends (This Month)</span>
                  <span className="text-sm">15,750 / 50,000</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '32%' }} />
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">SMS Credits</span>
                  <span className="text-sm">1,250 / 5,000</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '25%' }} />
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">WhatsApp Messages</span>
                  <span className="text-sm">875 / 2,000</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '44%' }} />
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">API Requests (This Month)</span>
                  <span className="text-sm">8,920 / 50,000</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '18%' }} />
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Need more resources? <Button variant="link" className="p-0 h-auto" onClick={() => handleChangePlan("premium")}>Upgrade your plan</Button> or <Button variant="link" className="p-0 h-auto">purchase additional credits</Button>.
                </p>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button variant="outline" className="ml-auto">
                <Download className="h-4 w-4 mr-2" />
                Export Usage Report
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cancel Subscription Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Your subscription will remain active until the end of the current billing period 
              ({subscriptionPlan.nextBillingDate}). After that, you'll lose access to premium features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Nevermind</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancelSubscription} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : "Yes, Cancel Subscription"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Plan Confirmation Dialog */}
      <AlertDialog open={showChangePlanDialog} onOpenChange={setShowChangePlanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change your plan to {plans[selectedPlan as keyof typeof plans].name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedPlan === "standard" 
                ? "You'll be downgraded immediately and charged the new rate on your next billing date." 
                : "You'll be upgraded immediately and charged a prorated amount for the remainder of your billing period."}
            </AlertDialogDescription>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span>Billing cycle:</span>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant={billingCycle === "monthly" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setBillingCycle("monthly")}
                  >
                    Monthly
                  </Button>
                  <Button 
                    variant={billingCycle === "yearly" ? "default" : "outline"}
                    size="sm" 
                    onClick={() => setBillingCycle("yearly")}
                  >
                    Yearly (10% off)
                  </Button>
                </div>
              </div>
              <div>
                <p className="font-semibold">
                  New price: {billingCycle === "monthly" 
                    ? plans[selectedPlan as keyof typeof plans].monthlyPrice + "/month" 
                    : plans[selectedPlan as keyof typeof plans].yearlyPrice + "/year"}
                </p>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPlanChange} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : "Confirm Change"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Payment Method Dialog */}
      <AlertDialog open={showDeletePaymentDialog} onOpenChange={setShowDeletePaymentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Payment Method</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this payment method? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeletePaymentMethod} 
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Payment Method Dialog */}
      <Dialog open={showAddPaymentDialog} onOpenChange={setShowAddPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Enter your card details to add a new payment method
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitNewCard}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input 
                  id="cardNumber" 
                  placeholder="1234 5678 9012 3456"
                  value={newCard.cardNumber}
                  onChange={(e) => setNewCard({...newCard, cardNumber: e.target.value})}
                  maxLength={16}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cardholderName">Cardholder Name</Label>
                <Input 
                  id="cardholderName" 
                  placeholder="John Doe"
                  value={newCard.cardholderName}
                  onChange={(e) => setNewCard({...newCard, cardholderName: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryMonth">Month</Label>
                  <select 
                    id="expiryMonth"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={newCard.expiryMonth}
                    onChange={(e) => setNewCard({...newCard, expiryMonth: e.target.value})}
                    required
                  >
                    <option value="">MM</option>
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = (i + 1).toString().padStart(2, '0');
                      return (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expiryYear">Year</Label>
                  <select 
                    id="expiryYear"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={newCard.expiryYear}
                    onChange={(e) => setNewCard({...newCard, expiryYear: e.target.value})}
                    required
                  >
                    <option value="">YY</option>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = (new Date().getFullYear() + i).toString().slice(-2);
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input 
                    id="cvv" 
                    placeholder="123"
                    maxLength={4}
                    value={newCard.cvv}
                    onChange={(e) => setNewCard({...newCard, cvv: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddPaymentDialog(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : "Add Card"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 