"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Store, ArrowRight, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// Define the integration type 
interface Integration {
  id?: string;
  type: string;
  name: string;
  description: string;
  logo: string;
  status: "ACTIVE" | "PENDING" | "ERROR" | "INACTIVE";
  lastSyncedAt?: string;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Default integration catalog
  const defaultIntegrations: Integration[] = [
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

  // Fetch integrations from API
  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const response = await fetch('/api/integrations');
        
        if (!response.ok) {
          throw new Error('Failed to fetch integrations');
        }
        
        const data = await response.json();
        
        // Merge API data with default integrations
        const updatedIntegrations = defaultIntegrations.map(defaultInt => {
          const existingInt = data.find((apiInt: { type: string }) => 
            apiInt.type === defaultInt.type
          );
          
          if (existingInt) {
            return {
              ...defaultInt,
              id: existingInt.id,
              status: existingInt.status,
              lastSyncedAt: existingInt.lastSyncedAt
            } as Integration;
          }
          
          return defaultInt;
        });
        
        setIntegrations(updatedIntegrations);
      } catch (error) {
        console.error('Error fetching integrations:', error);
        toast.error('Failed to load integrations');
        setIntegrations(defaultIntegrations);
      } finally {
        setLoading(false);
      }
    };

    fetchIntegrations();
  }, []);

  const handleSyncIntegration = async (id?: string, type?: string) => {
    if (!id) return; // Only sync existing integrations
    
    try {
      const response = await fetch(`/api/integrations/${id}/sync`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to sync integration');
      }
      
      toast.success(`Syncing data from ${type}...`);
    } catch (error) {
      console.error('Error syncing integration:', error);
      toast.error('Failed to sync integration');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex flex-col items-center justify-center h-64">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Loading integrations...</p>
      </div>
    );
  }

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
                <Badge
                  variant={
                    integration.status === "ACTIVE" ? "default" : 
                    integration.status === "ERROR" ? "destructive" : 
                    integration.status === "PENDING" ? "outline" : 
                    "secondary"
                  } 
                  className={
                    integration.status === "ACTIVE" ? "bg-green-100 text-green-800" : 
                    integration.status === "ERROR" ? "bg-red-100 text-red-800" : 
                    integration.status === "PENDING" ? "bg-yellow-100 text-yellow-800" : 
                    ""
                  }
                >
                  {integration.status === "ACTIVE" ? (
                    <Check className="mr-1 h-3 w-3" />
                  ) : integration.status === "ERROR" ? (
                    <AlertCircle className="mr-1 h-3 w-3" />
                  ) : integration.status === "PENDING" ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
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
              {integration.status === "ACTIVE" && integration.lastSyncedAt && (
                <p className="text-xs text-muted-foreground">
                  Last synced: {new Date(integration.lastSyncedAt).toLocaleString()}
                </p>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button 
                className="w-full" 
                variant={integration.status === "ACTIVE" ? "outline" : "default"} 
                asChild
              >
                <Link href={`/integrations/${integration.type}`}>
                  {integration.status === "ACTIVE" ? "Manage" : "Connect"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              
              {integration.status === "ACTIVE" && (
                <Button 
                  className="w-full" 
                  variant="secondary"
                  onClick={() => handleSyncIntegration(integration.id, integration.type)}
                >
                  Sync Now
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 