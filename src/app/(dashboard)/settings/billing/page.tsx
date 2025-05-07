import { Metadata } from "next";
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
  CreditCardIcon
} from "lucide-react";

export const metadata: Metadata = {
  title: "Billing Settings | MarketSage",
  description: "Manage your subscription and payment details",
};

export default function BillingSettingsPage() {
  const subscriptionPlan = {
    name: "Premium Plan",
    status: "active",
    interval: "monthly",
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
  };

  const paymentMethods = [
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
  ];

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
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {subscriptionPlan.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground ml-2">
                      {subscriptionPlan.price}/{subscriptionPlan.interval}
                    </span>
                  </div>
                </div>
                <Button>Change Plan</Button>
              </div>
              
              <div className="bg-secondary/10 p-4 rounded-lg flex items-center space-x-4">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Next billing date</h4>
                  <p className="text-sm text-muted-foreground">
                    {subscriptionPlan.nextBillingDate}
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
              <Button variant="outline">Cancel Subscription</Button>
              <Button variant="outline">Update Billing Cycle</Button>
            </CardFooter>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Standard Plan</CardTitle>
                <span className="text-2xl font-bold">₦15,000</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </CardHeader>
              <CardContent className="space-y-2">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-primary mt-0.5" />
                    <span>Up to 10,000 contacts</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-primary mt-0.5" />
                    <span>Email campaigns</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-primary mt-0.5" />
                    <span>Basic analytics</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">Choose Plan</Button>
              </CardFooter>
            </Card>
            
            <Card className="border-primary">
              <div className="bg-primary text-primary-foreground text-center py-1 text-sm font-medium">
                Current Plan
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Premium Plan</CardTitle>
                <span className="text-2xl font-bold">₦25,000</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </CardHeader>
              <CardContent className="space-y-2">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-primary mt-0.5" />
                    <span>Unlimited contacts</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-primary mt-0.5" />
                    <span>Email, SMS, and WhatsApp</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-primary mt-0.5" />
                    <span>Advanced analytics</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-primary mt-0.5" />
                    <span>Priority support</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" disabled>Current Plan</Button>
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
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-primary mt-0.5" />
                    <span>Everything in Premium</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-primary mt-0.5" />
                    <span>Dedicated account manager</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-primary mt-0.5" />
                    <span>Custom integrations</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-primary mt-0.5" />
                    <span>SLA guarantees</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">Contact Sales</Button>
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
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-t">
                {paymentMethods.map((method) => (
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
                        <Button variant="ghost" size="sm">
                          Set as Default
                        </Button>
                      )}
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input id="company-name" defaultValue="Acme Inc." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax-id">Tax ID</Label>
                  <Input id="tax-id" defaultValue="NG1234567890" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address-line1">Address Line 1</Label>
                <Input id="address-line1" defaultValue="123 Business Avenue" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address-line2">Address Line 2 (Optional)</Label>
                <Input id="address-line2" defaultValue="Suite 456" />
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" defaultValue="Lagos" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input id="state" defaultValue="Lagos State" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">Postal/Zip Code</Label>
                  <Input id="zip" defaultValue="100001" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <select id="country" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <option value="NG">Nigeria</option>
                  <option value="GH">Ghana</option>
                  <option value="KE">Kenya</option>
                  <option value="ZA">South Africa</option>
                </select>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Billing Address</Button>
            </CardFooter>
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
                          <Button variant="ghost" size="sm">
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
                  Need more resources? <a href="#" className="text-primary underline">Upgrade your plan</a> or <a href="#" className="text-primary underline">purchase additional credits</a>.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 