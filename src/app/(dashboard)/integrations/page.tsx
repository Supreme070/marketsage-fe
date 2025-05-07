import { Metadata } from "next";
import Link from "next/link";
import { Store, ArrowRight, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Integrations | MarketSage",
  description: "Connect MarketSage with your favorite tools and platforms",
};

export default function IntegrationsPage() {
  const integrations = [
    {
      name: "Shopify",
      type: "ECOMMERCE_SHOPIFY",
      description: "Connect your Shopify store to synchronize products, customers, and orders.",
      status: "INACTIVE",
      logo: "Shopify",
    },
    {
      name: "WooCommerce",
      type: "ECOMMERCE_WOOCOMMERCE",
      description: "Integrate with your WooCommerce store to sync customer data and orders.",
      status: "INACTIVE",
      logo: "WooCommerce",
    },
    {
      name: "Stripe",
      type: "PAYMENT_STRIPE",
      description: "Connect your Stripe account to track payments and customer information.",
      status: "INACTIVE",
      logo: "Stripe",
    },
    {
      name: "PayPal",
      type: "PAYMENT_PAYPAL",
      description: "Integrate with PayPal to monitor transactions and customer data.",
      status: "INACTIVE",
      logo: "PayPal",
    },
    {
      name: "HubSpot",
      type: "CRM_HUBSPOT",
      description: "Sync contacts and leads between MarketSage and HubSpot CRM.",
      status: "INACTIVE",
      logo: "HubSpot",
    },
    {
      name: "Salesforce",
      type: "CRM_SALESFORCE",
      description: "Connect with Salesforce to sync customer data and sales information.",
      status: "INACTIVE",
      logo: "Salesforce",
    },
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground mt-1">
            Connect MarketSage with your favorite tools and platforms
          </p>
        </div>
        <Button variant="outline">
          <Store className="mr-2 h-4 w-4" />
          Marketplace
        </Button>
      </div>
      
      <Separator className="my-6" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <Card key={integration.type} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="font-mono text-2xl text-primary">{integration.logo}</div>
                <Badge variant={integration.status === "ACTIVE" ? "default" : "secondary"} 
                  className={integration.status === "ACTIVE" ? "bg-green-100 text-green-800" : ""}>
                  {integration.status === "ACTIVE" ? (
                    <Check className="mr-1 h-3 w-3" />
                  ) : integration.status === "ERROR" ? (
                    <AlertCircle className="mr-1 h-3 w-3" />
                  ) : null}
                  {integration.status}
                </Badge>
              </div>
              <CardTitle className="mt-2">{integration.name}</CardTitle>
              <CardDescription className="mt-1">
                {integration.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              {/* Additional info or settings could go here */}
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant={integration.status === "ACTIVE" ? "outline" : "default"} asChild>
                <Link href={`/integrations/${integration.type}`}>
                  {integration.status === "ACTIVE" ? "Manage" : "Connect"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 