"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import { toast } from 'sonner';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toast";

// Import the centralized API client
import { apiClient } from "@/lib/api/client";
import type { 
  InitialRegistrationDto, 
  VerifyPinDto, 
  CompleteRegistrationDto 
} from "@/lib/api/types/auth";

// Step 1: Initial Registration
const initialFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
});

// Step 2: PIN Verification
const pinFormSchema = z.object({
  pin: z.string().length(6, { message: "PIN must be 6 digits" }),
});

// Step 3: Password Setup
const passwordFormSchema = z.object({
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type InitialFormValues = z.infer<typeof initialFormSchema>;
type PinFormValues = z.infer<typeof pinFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function RegisterPage() {
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'initial' | 'verify' | 'password'>('initial');
  const [registrationData, setRegistrationData] = useState<{
    email?: string;
    name?: string;
    registrationId?: string;
  }>({});


  // Initial registration form
  const initialForm = useForm<InitialFormValues>({
    resolver: zodResolver(initialFormSchema),
    defaultValues: { name: "", email: "" },
  });

  // PIN verification form
  const pinForm = useForm<PinFormValues>({
    resolver: zodResolver(pinFormSchema),
    defaultValues: { pin: "" },
  });

  // Password setup form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  // Handle initial registration
  const onInitialSubmit = async (data: InitialFormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const initialData: InitialRegistrationDto = {
        name: data.name,
        email: data.email,
      };

      const result = await apiClient.auth.startRegistration(initialData);

      if (!result.success || !result.registrationId) {
        throw new Error(result.message || "Failed to start registration");
      }

      setRegistrationData({
        email: data.email,
        name: data.name,
        registrationId: result.registrationId,
      });
      
      toast.success("Verification PIN sent to your email");
      setStep('verify');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle PIN verification
  const onPinSubmit = async (data: PinFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const registrationId = registrationData.registrationId;
      
      if (!registrationId) {
        throw new Error("Registration ID missing. Please start the registration process again.");
      }

      const verifyData: VerifyPinDto = {
        pin: data.pin,
        registrationId: registrationId,
      };
      
      const result = await apiClient.auth.verifyPin(verifyData);

      if (!result.success) {
        throw new Error(result.message || "Invalid PIN");
      }

      toast.success("Email verified successfully");
      setStep('password');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password setup
  const onPasswordSubmit = async (data: PasswordFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const registrationId = registrationData.registrationId;
      
      if (!registrationId) {
        throw new Error("Registration ID missing. Please start the registration process again.");
      }

      const completeData: CompleteRegistrationDto = {
        password: data.password,
        registrationId: registrationId,
      };

      const result = await apiClient.auth.completeRegistration(completeData);

      if (!result.success) {
        throw new Error(result.message || "Failed to complete registration");
      }

      toast.success("Registration completed successfully!");
      router.push("/login");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
            <CardDescription>
              {step === 'initial' && "Sign up for MarketSage to get started"}
              {step === 'verify' && "Enter the verification PIN sent to your email"}
              {step === 'password' && "Set up your password"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive mb-4">
                {error}
              </div>
            )}

            {step === 'initial' && (
              <Form {...initialForm}>
                <form onSubmit={initialForm.handleSubmit(onInitialSubmit)} className="space-y-4">
                  <FormField
                    control={initialForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={initialForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="name@company.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending verification PIN...
                      </>
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </form>
              </Form>
            )}

            {step === 'verify' && (
              <Form {...pinForm}>
                <form onSubmit={pinForm.handleSubmit(onPinSubmit)} className="space-y-4">
                  <FormField
                    control={pinForm.control}
                    name="pin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verification PIN</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter 6-digit PIN" 
                            maxLength={6}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || !registrationData.registrationId}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : !registrationData.registrationId ? (
                      "Loading..."
                    ) : (
                      "Verify PIN"
                    )}
                  </Button>
                </form>
              </Form>
            )}

            {step === 'password' && (
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password"
                            placeholder="Create a strong password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password"
                            placeholder="Confirm your password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || !registrationData.registrationId}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : !registrationData.registrationId ? (
                      "Loading..."
                    ) : (
                      "Complete Registration"
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Log in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
      <Toaster />
    </>
  );
}
