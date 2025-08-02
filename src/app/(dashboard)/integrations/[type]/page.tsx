"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Store, AlertCircle, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';

interface IntegrationPageProps {
  params: Promise<{
    type: string;
  }>;
}

interface IntegrationField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
}

interface IntegrationData {
  id?: string;
  name: string;
  description: string;
  fields: IntegrationField[];
  status?: "ACTIVE" | "ERROR" | "PENDING" | "INACTIVE";
}

interface FormState {
  [key: string]: string;
}

export default function IntegrationConnectionPage({ params }: IntegrationPageProps) {
  const { toast } = useToast();
  const router = useRouter();
  // Use React.use() to unwrap the params Promise for Next.js compatibility
  const { type: integrationType } = React.use(params);
  
  const [formState, setFormState] = useState<FormState>({});
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [existingIntegration, setExistingIntegration] = useState<any>(null);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);
  
  const integrationData: Record<string, IntegrationData> = {
    ECOMMERCE_SHOPIFY: {
      name: "Shopify",
      description: "Connect your Shopify store to synchronize products, customers, and orders.",
      fields: [
        { name: "apiKey", label: "API Key", type: "text", required: true },
        { name: "apiSecret", label: "API Secret", type: "password", required: true },
        { name: "storeUrl", label: "Store URL", type: "text", required: true },
      ],
    },
    ECOMMERCE_WOOCOMMERCE: {
      name: "WooCommerce",
      description: "Integrate with your WooCommerce store to sync customer data and orders.",
      fields: [
        { name: "consumerKey", label: "Consumer Key", type: "text", required: true },
        { name: "consumerSecret", label: "Consumer Secret", type: "password", required: true },
        { name: "storeUrl", label: "Store URL", type: "text", required: true },
      ],
    },
    PAYMENT_STRIPE: {
      name: "Stripe",
      description: "Connect your Stripe account to track payments and customer information.",
      fields: [
        { name: "secretKey", label: "Secret Key", type: "password", required: true },
        { name: "publishableKey", label: "Publishable Key", type: "text", required: true },
        { name: "webhookSecret", label: "Webhook Secret", type: "password" },
      ],
    },
    PAYMENT_PAYPAL: {
      name: "PayPal",
      description: "Integrate with PayPal to monitor transactions and customer data.",
      fields: [
        { name: "clientId", label: "Client ID", type: "text", required: true },
        { name: "clientSecret", label: "Client Secret", type: "password", required: true },
        { name: "environment", label: "Environment", type: "text", required: true },
      ],
    },
    CRM_HUBSPOT: {
      name: "HubSpot",
      description: "Sync contacts and leads between MarketSage and HubSpot CRM.",
      fields: [
        { name: "apiKey", label: "API Key", type: "password", required: true },
        { name: "portalId", label: "Portal ID", type: "text", required: true },
      ],
    },
    CRM_SALESFORCE: {
      name: "Salesforce",
      description: "Connect with Salesforce to sync customer data and sales information.",
      fields: [
        { name: "clientId", label: "Client ID", type: "text", required: true },
        { name: "clientSecret", label: "Client Secret", type: "password", required: true },
        { name: "instanceUrl", label: "Instance URL", type: "text", required: true },
      ],
    },
  };

  const integration = integrationData[integrationType as keyof typeof integrationData];
  
  const fetchExistingIntegration = useCallback(async () => {
    try {
      const response = await fetch(`/api/integrations?type=${integrationType}`);
      if (response.ok) {
        const data = await response.json();
        
        // Find the matching integration if it exists
        const matchingIntegration = data.find((item: any) => item.type === integrationType);
        if (matchingIntegration) {
          setExistingIntegration(matchingIntegration);
          
          // If we have stored credentials, populate the form
          // In a real app, you'd need to decrypt these
          try {
            // Make sure we have valid JSON before parsing
            if (matchingIntegration.credentials && 
                typeof matchingIntegration.credentials === 'string' && 
                matchingIntegration.credentials.trim() !== '') {
              const credentials = JSON.parse(matchingIntegration.credentials);
              // Verify the parsed result is an object before setting state
              if (credentials && typeof credentials === 'object') {
                setFormState(credentials);
              }
            }
          } catch (e) {
            console.error("Failed to parse credentials", e);
            // Handle the error by setting an empty object for credentials
            setFormState({});
            // Show toast notification for developers
            if (process.env.NODE_ENV !== 'production') {
              toast({
                title: "Error parsing credentials",
                description: "There was an error reading the saved credentials.",
                variant: "destructive"
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching existing integration:", error);
    }
  }, [integrationType]);

  useEffect(() => {
    fetchExistingIntegration();
  }, [fetchExistingIntegration]);

  if (!integration) {
    router.push("/integrations");
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const requiredFields = integration.fields.filter(field => field.required);
    for (const field of requiredFields) {
      if (!formState[field.name] || formState[field.name].trim() === "") {
        toast({
          title: "Missing required field",
          description: `Please fill in ${field.label}`,
          variant: "destructive"
        });
        return false;
      }
    }
    return true;
  };

  const handleTestConnection = async () => {
    if (!validateForm()) return;
    
    setTestLoading(true);
    setTestResult(null);
    
    try {
      const response = await fetch("/api/v2/integrations/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: integrationType,
          credentials: formState
        }),
      });
      
      const result = await response.json();
      setTestResult(result);
      
      if (result.success) {
        toast({
          title: "Connection successful",
          description: result.message,
        });
      } else {
        toast({
          title: "Connection failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error testing connection:", error);
      setTestResult({
        success: false,
        message: "Failed to test connection. Please try again."
      });
      toast({
        title: "Test failed",
        description: "There was an error testing the connection.",
        variant: "destructive"
      });
    } finally {
      setTestLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const endpoint = existingIntegration?.id 
        ? `/api/integrations/${existingIntegration.id}` 
        : "/api/integrations";
      
      const method = existingIntegration?.id ? "PATCH" : "POST";
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: integrationType,
          name: integration.name,
          credentials: formState
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save integration");
      }
      
      toast({
        title: "Integration saved",
        description: existingIntegration?.id 
          ? "Your integration settings have been updated" 
          : "Your integration has been successfully connected",
      });
      
      // Redirect to integrations page
      router.push("/integrations");
      
    } catch (error) {
      console.error("Error saving integration:", error);
      toast({
        title: "Failed to save",
        description: error instanceof Error ? error.message : "An error occurred while saving the integration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingIntegration?.id) return;
    
    if (!confirm(`Are you sure you want to disconnect ${integration.name}?`)) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`/api/integrations/${existingIntegration.id}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete integration");
      }
      
      toast({
        title: "Integration disconnected",
        description: `${integration.name} has been disconnected from your account`,
      });
      
      // Redirect to integrations page
      router.push("/integrations");
      
    } catch (error) {
      console.error("Error deleting integration:", error);
      toast({
        title: "Failed to disconnect",
        description: error instanceof Error ? error.message : "An error occurred while disconnecting the integration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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
            
            {existingIntegration && (
              <div className="ml-auto">
                {existingIntegration.status === "ACTIVE" && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <Check className="mr-1 h-3 w-3" />
                    Connected
                  </span>
                )}
                {existingIntegration.status === "ERROR" && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Error
                  </span>
                )}
                {existingIntegration.status === "PENDING" && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Pending
                  </span>
                )}
              </div>
            )}
          </div>
          <CardTitle>{existingIntegration ? `Manage ${integration.name}` : `Connect ${integration.name}`}</CardTitle>
          <CardDescription>{integration.description}</CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent>
            {testResult && (
              <Alert className={`mb-4 ${testResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                <AlertCircle className={testResult.success ? 'text-green-600' : 'text-red-600'} />
                <AlertTitle>{testResult.success ? 'Connection successful' : 'Connection failed'}</AlertTitle>
                <AlertDescription>
                  {testResult.message}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-4">
              {integration.fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </Label>
                  {field.type === "textarea" ? (
                    <Textarea
                      id={field.name}
                      name={field.name}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      value={formState[field.name] || ""}
                      onChange={handleInputChange}
                      required={field.required}
                    />
                  ) : (
                    <Input
                      id={field.name}
                      name={field.name}
                      type={field.type}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      value={formState[field.name] || ""}
                      onChange={handleInputChange}
                      required={field.required}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          
          <CardFooter>
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 justify-end w-full">
              {existingIntegration && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Disconnecting...
                    </>
                  ) : (
                    "Disconnect"
                  )}
                </Button>
              )}
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleTestConnection}
                disabled={testLoading}
              >
                {testLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test Connection"
                )}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                asChild
              >
                <Link href="/integrations">
                  Cancel
                </Link>
              </Button>
              
              <Button 
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {existingIntegration ? "Updating..." : "Connecting..."}
                  </>
                ) : (
                  existingIntegration ? "Update Connection" : "Connect"
                )}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 