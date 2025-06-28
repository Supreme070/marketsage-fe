'use client'

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { 
  Cookie, 
  Shield, 
  Eye, 
  Target, 
  ChevronDown, 
  ChevronUp,
  Check,
  X
} from 'lucide-react';
import { visitorTracker, type TrackingConsent } from '@/lib/leadpulse/visitor-tracking';

interface CookieConsentBannerProps {
  onConsentUpdate?: (consent: TrackingConsent) => void;
}

export default function CookieConsentBanner({ onConsentUpdate }: CookieConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consent, setConsent] = useState<TrackingConsent>({
    essential: true,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    // Check if consent has already been given
    const existingConsent = localStorage.getItem('leadpulse_consent');
    if (!existingConsent) {
      setIsVisible(true);
    }
  }, []);

  const handleConsentChange = (type: keyof TrackingConsent, value: boolean) => {
    if (type === 'essential') return; // Essential cookies cannot be disabled
    
    const newConsent = { ...consent, [type]: value };
    setConsent(newConsent);
  };

  const handleAcceptAll = () => {
    const fullConsent: TrackingConsent = {
      essential: true,
      analytics: true,
      marketing: true
    };
    
    setConsent(fullConsent);
    visitorTracker.updateConsent(fullConsent);
    onConsentUpdate?.(fullConsent);
    setIsVisible(false);
  };

  const handleAcceptSelected = () => {
    visitorTracker.updateConsent(consent);
    onConsentUpdate?.(consent);
    setIsVisible(false);
  };

  const handleRejectAll = () => {
    const minimalConsent: TrackingConsent = {
      essential: true,
      analytics: false,
      marketing: false
    };
    
    setConsent(minimalConsent);
    visitorTracker.updateConsent(minimalConsent);
    onConsentUpdate?.(minimalConsent);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/50 to-transparent">
      <Card className="max-w-4xl mx-auto border-blue-200 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Cookie className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  🍪 We value your privacy
                </h3>
                <Shield className="w-5 h-5 text-green-500" />
              </div>
              
              <p className="text-gray-600 mb-4">
                LeadPulse uses cookies and similar technologies to enhance your experience, 
                analyze website performance, and provide personalized insights. 
                Your privacy is important to us.
              </p>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3 mb-4">
                <Button 
                  onClick={handleAcceptAll}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Accept All
                </Button>
                
                <Button 
                  onClick={handleRejectAll}
                  variant="outline"
                  className="border-gray-300"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject All
                </Button>
                
                <Button
                  onClick={() => setShowDetails(!showDetails)}
                  variant="ghost"
                  className="text-blue-600 hover:text-blue-700"
                >
                  Customize Settings
                  {showDetails ? (
                    <ChevronUp className="w-4 h-4 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 ml-2" />
                  )}
                </Button>
              </div>

              {/* Detailed Settings */}
              {showDetails && (
                <div className="border-t pt-4 space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    {/* Essential Cookies */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-green-500" />
                          <span className="font-medium text-gray-900">Essential</span>
                        </div>
                        <Switch 
                          checked={consent.essential}
                          disabled={true}
                          className="opacity-50"
                        />
                      </div>
                      <p className="text-sm text-gray-600">
                        Required for basic website functionality, security, and session management. 
                        Cannot be disabled.
                      </p>
                      <div className="text-xs text-gray-500">
                        <strong>Data:</strong> Session ID, security tokens, preferences
                      </div>
                    </div>

                    {/* Analytics Cookies */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Eye className="w-5 h-5 text-blue-500" />
                          <span className="font-medium text-gray-900">Analytics</span>
                        </div>
                        <Switch 
                          checked={consent.analytics}
                          onCheckedChange={(checked) => handleConsentChange('analytics', checked)}
                        />
                      </div>
                      <p className="text-sm text-gray-600">
                        Help us understand how you use our website to improve performance 
                        and user experience.
                      </p>
                      <div className="text-xs text-gray-500">
                        <strong>Data:</strong> Page views, clicks, session duration, device info
                      </div>
                    </div>

                    {/* Marketing Cookies */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Target className="w-5 h-5 text-purple-500" />
                          <span className="font-medium text-gray-900">Marketing</span>
                        </div>
                        <Switch 
                          checked={consent.marketing}
                          onCheckedChange={(checked) => handleConsentChange('marketing', checked)}
                        />
                      </div>
                      <p className="text-sm text-gray-600">
                        Enable personalized content and targeted marketing based on your 
                        interests and behavior.
                      </p>
                      <div className="text-xs text-gray-500">
                        <strong>Data:</strong> Campaign attribution, interests, cross-site tracking
                      </div>
                    </div>
                  </div>

                  {/* Privacy Information */}
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                    <p className="mb-2">
                      <strong>🔒 Your Privacy Rights:</strong>
                    </p>
                    <ul className="space-y-1 text-xs">
                      <li>• You can change these preferences anytime in Settings</li>
                      <li>• We never sell your personal data to third parties</li>
                      <li>• All data is processed securely and stored in compliance with GDPR</li>
                      <li>• You can request data deletion or export at any time</li>
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button 
                      onClick={handleAcceptSelected}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Save Preferences
                    </Button>
                    <Button 
                      onClick={() => setShowDetails(false)}
                      variant="outline"
                      className="px-6"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Footer Links */}
              <div className="flex gap-4 mt-4 text-xs text-gray-500">
                <a href="/privacy" className="hover:text-blue-600 underline">
                  Privacy Policy
                </a>
                <a href="/cookies" className="hover:text-blue-600 underline">
                  Cookie Policy
                </a>
                <a href="/terms" className="hover:text-blue-600 underline">
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}