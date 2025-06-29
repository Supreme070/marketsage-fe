"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { EmailDomainSetup } from '@/components/onboarding/EmailDomainSetup';
import { SMSProviderSetup } from '@/components/onboarding/SMSProviderSetup';
import { WhatsAppBusinessSetup } from '@/components/onboarding/WhatsAppBusinessSetup';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType;
  required: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
}

interface OnboardingProgress {
  currentStep: number;
  completedSteps: string[];
  totalSteps: number;
  progressPercentage: number;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to MarketSage',
    description: 'Get started with your marketing automation platform',
    component: WelcomeStep,
    required: true,
    status: 'pending'
  },
  {
    id: 'organization',
    title: 'Organization Setup',
    description: 'Configure your organization profile and preferences',
    component: OrganizationStep,
    required: true,
    status: 'pending'
  },
  {
    id: 'email',
    title: 'Email Domain Configuration',
    description: 'Set up your email domain for deliverability',
    component: EmailDomainSetup,
    required: true,
    status: 'pending'
  },
  {
    id: 'sms',
    title: 'SMS Provider Setup',
    description: 'Configure SMS provider for text messaging',
    component: SMSProviderSetup,
    required: false,
    status: 'pending'
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp Business API',
    description: 'Connect your WhatsApp Business Account',
    component: WhatsAppBusinessSetup,
    required: false,
    status: 'pending'
  },
  {
    id: 'complete',
    title: 'Setup Complete',
    description: 'Your MarketSage platform is ready to use',
    component: CompletionStep,
    required: true,
    status: 'pending'
  }
];

export default function OnboardingWizard() {
  const [steps, setSteps] = useState<OnboardingStep[]>(ONBOARDING_STEPS);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState<OnboardingProgress>({
    currentStep: 0,
    completedSteps: [],
    totalSteps: ONBOARDING_STEPS.length,
    progressPercentage: 0
  });

  const currentStep = steps[currentStepIndex];
  const CurrentStepComponent = currentStep?.component;

  // Load saved progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('marketsage_onboarding_progress');
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        setCurrentStepIndex(parsed.currentStep || 0);
        setProgress(parsed);
        
        // Update step statuses
        const updatedSteps = steps.map((step, index) => ({
          ...step,
          status: parsed.completedSteps.includes(step.id) 
            ? 'completed' 
            : index === parsed.currentStep 
            ? 'in_progress' 
            : 'pending'
        }));
        setSteps(updatedSteps);
      } catch (error) {
        console.warn('Failed to load onboarding progress');
      }
    }
  }, []);

  // Save progress to localStorage
  const saveProgress = (newProgress: OnboardingProgress) => {
    localStorage.setItem('marketsage_onboarding_progress', JSON.stringify(newProgress));
    setProgress(newProgress);
  };

  const markStepCompleted = (stepId: string) => {
    const completedSteps = [...progress.completedSteps];
    if (!completedSteps.includes(stepId)) {
      completedSteps.push(stepId);
    }

    const newProgress = {
      ...progress,
      completedSteps,
      progressPercentage: (completedSteps.length / steps.length) * 100
    };

    saveProgress(newProgress);

    // Update step status
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status: 'completed' } : step
    ));
  };

  const goToNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      // Mark current step as completed if required or if user chose to proceed
      if (currentStep.required || currentStep.status === 'completed') {
        markStepCompleted(currentStep.id);
      }

      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);

      const newProgress = {
        ...progress,
        currentStep: nextIndex
      };
      saveProgress(newProgress);

      // Mark next step as in progress
      setSteps(prev => prev.map((step, index) => 
        index === nextIndex ? { ...step, status: 'in_progress' } : step
      ));
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);

      const newProgress = {
        ...progress,
        currentStep: prevIndex
      };
      saveProgress(newProgress);

      setSteps(prev => prev.map((step, index) => 
        index === prevIndex ? { ...step, status: 'in_progress' } : step
      ));
    }
  };

  const skipStep = () => {
    if (!currentStep.required) {
      setSteps(prev => prev.map((step, index) => 
        index === currentStepIndex ? { ...step, status: 'skipped' } : step
      ));
      goToNextStep();
    }
  };

  const getStepIcon = (step: OnboardingStep, index: number) => {
    if (step.status === 'completed') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (step.status === 'in_progress') {
      return <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">{index + 1}</div>;
    }
    return <div className="h-5 w-5 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold">{index + 1}</div>;
  };

  const getStepStatus = (step: OnboardingStep) => {
    switch (step.status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-500">In Progress</Badge>;
      case 'skipped':
        return <Badge variant="secondary">Skipped</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Welcome to MarketSage
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Let's get your marketing automation platform set up and ready to go
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Step {currentStepIndex + 1} of {steps.length}
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {Math.round(progress.progressPercentage)}% Complete
              </span>
            </div>
            <Progress value={progress.progressPercentage} className="w-full" />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Steps Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Setup Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      index === currentStepIndex 
                        ? 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => {
                      if (index <= currentStepIndex || step.status === 'completed') {
                        setCurrentStepIndex(index);
                      }
                    }}
                  >
                    {getStepIcon(step, index)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                          {step.title}
                        </h4>
                        {step.required && (
                          <span className="text-xs text-red-500 ml-2">*</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {step.description}
                      </p>
                      <div className="mt-2">
                        {getStepStatus(step)}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {currentStep.title}
                  {currentStep.required && <span className="text-red-500">*</span>}
                </CardTitle>
                <CardDescription>{currentStep.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {CurrentStepComponent && <CurrentStepComponent />}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                onClick={goToPreviousStep}
                disabled={currentStepIndex === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex gap-2">
                {!currentStep.required && currentStep.status !== 'completed' && (
                  <Button variant="ghost" onClick={skipStep}>
                    Skip Step
                  </Button>
                )}

                <Button
                  onClick={goToNextStep}
                  disabled={currentStepIndex === steps.length - 1}
                >
                  Next Step
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step Components
function WelcomeStep() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Welcome to MarketSage</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Africa's leading marketing automation platform. Let's get you set up for success.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl mb-2">📧</div>
            <h3 className="font-semibold mb-2">Email Marketing</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Advanced email campaigns with AI optimization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl mb-2">📱</div>
            <h3 className="font-semibold mb-2">Multi-Channel</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              SMS, WhatsApp, and social media integration
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl mb-2">🤖</div>
            <h3 className="font-semibold mb-2">AI-Powered</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Intelligent automation and predictive analytics
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OrganizationStep() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Organization Profile</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Company Name</label>
          <input 
            type="text" 
            className="w-full p-2 border rounded-md"
            placeholder="Your Company Name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Industry</label>
          <select className="w-full p-2 border rounded-md">
            <option value="">Select your industry</option>
            <option value="fintech">Fintech</option>
            <option value="ecommerce">E-commerce</option>
            <option value="saas">SaaS</option>
            <option value="retail">Retail</option>
            <option value="healthcare">Healthcare</option>
            <option value="education">Education</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Country</label>
          <select className="w-full p-2 border rounded-md">
            <option value="">Select your country</option>
            <option value="nigeria">Nigeria</option>
            <option value="kenya">Kenya</option>
            <option value="ghana">Ghana</option>
            <option value="south-africa">South Africa</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Website URL</label>
          <input 
            type="url" 
            className="w-full p-2 border rounded-md"
            placeholder="https://yourcompany.com"
          />
        </div>
      </div>
    </div>
  );
}

function CompletionStep() {
  return (
    <div className="text-center space-y-6">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-2xl font-bold">Setup Complete!</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Your MarketSage platform is now configured and ready to use.
      </p>

      <div className="space-y-4">
        <Button className="w-full" size="lg">
          Go to Dashboard
        </Button>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button variant="outline">
            View Documentation
          </Button>
          <Button variant="outline">
            Schedule Training
          </Button>
        </div>
      </div>
    </div>
  );
}