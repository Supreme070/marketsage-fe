import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Connect Integration | MarketSage",
  description: "Connect your integration with MarketSage",
};

interface IntegrationPageProps {
  params: {
    type: string;
  };
}

export default function IntegrationConnectionPage({ params }: IntegrationPageProps) {
  const integrationType = params.type;
  
  const integrationData = {
    ECOMMERCE_SHOPIFY: {
      name: "Shopify",
      description: "Connect your Shopify store to synchronize products, customers, and orders.",
      fields: [
        { name: "apiKey", label: "API Key", type: "text" },
        { name: "apiSecret", label: "API Secret", type: "password" },
        { name: "storeUrl", label: "Store URL", type: "text" },
      ],
    },
    ECOMMERCE_WOOCOMMERCE: {
      name: "WooCommerce",
      description: "Integrate with your WooCommerce store to sync customer data and orders.",
      fields: [
        { name: "consumerKey", label: "Consumer Key", type: "text" },
        { name: "consumerSecret", label: "Consumer Secret", type: "password" },
        { name: "storeUrl", label: "Store URL", type: "text" },
      ],
    },
    PAYMENT_STRIPE: {
      name: "Stripe",
      description: "Connect your Stripe account to track payments and customer information.",
      fields: [
        { name: "secretKey", label: "Secret Key", type: "password" },
        { name: "publishableKey", label: "Publishable Key", type: "text" },
        { name: "webhookSecret", label: "Webhook Secret", type: "password" },
      ],
    },
    PAYMENT_PAYPAL: {
      name: "PayPal",
      description: "Integrate with PayPal to monitor transactions and customer data.",
      fields: [
        { name: "clientId", label: "Client ID", type: "text" },
        { name: "clientSecret", label: "Client Secret", type: "password" },
        { name: "environment", label: "Environment", type: "text" },
      ],
    },
    CRM_HUBSPOT: {
      name: "HubSpot",
      description: "Sync contacts and leads between MarketSage and HubSpot CRM.",
      fields: [
        { name: "apiKey", label: "API Key", type: "password" },
        { name: "portalId", label: "Portal ID", type: "text" },
      ],
    },
    CRM_SALESFORCE: {
      name: "Salesforce",
      description: "Connect with Salesforce to sync customer data and sales information.",
      fields: [
        { name: "clientId", label: "Client ID", type: "text" },
        { name: "clientSecret", label: "Client Secret", type: "password" },
        { name: "instanceUrl", label: "Instance URL", type: "text" },
      ],
    },
  };

  const integration = integrationData[integrationType as keyof typeof integrationData];
  
  if (!integration) {
    redirect("/integrations");
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Link href="/integrations" className="flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Integrations
        </Link>
      </div>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center mb-2">
            <div className="font-mono text-2xl text-primary mr-2">{integration.name}</div>
          </div>
          <CardTitle>Connect {integration.name}</CardTitle>
          <CardDescription>{integration.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            {integration.fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>{field.label}</Label>
                {field.type === "textarea" ? (
                  <Textarea id={field.name} placeholder={`Enter ${field.label.toLowerCase()}`} />
                ) : (
                  <Input
                    id={field.name}
                    type={field.type}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                )}
              </div>
            ))}
          </form>
        </CardContent>
        <CardFooter>
          <div className="flex justify-end gap-4 w-full">
            <Button variant="outline" asChild>
              <Link href="/integrations">Cancel</Link>
            </Button>
            <Button>Connect {integration.name}</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 