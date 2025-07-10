'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Send, User, X, Info, Shield } from 'lucide-react';

interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone: string;
  company?: string;
  jobTitle?: string;
}

interface WhatsAppComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact;
}

export function WhatsAppComposeModal({ isOpen, onClose, contact }: WhatsAppComposeModalProps) {
  const [message, setMessage] = useState('');
  const [personalize, setPersonalize] = useState(true);
  const [saveToHistory, setSaveToHistory] = useState(true);
  const [skipComplianceCheck, setSkipComplianceCheck] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Calculate character count for WhatsApp limits
  const characterCount = message.length;
  const withinLimit = characterCount <= 4096;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a message to send.',
        variant: 'destructive',
      });
      return;
    }

    if (message.length > 4096) {
      toast({
        title: 'Message Too Long',
        description: 'WhatsApp message cannot exceed 4096 characters.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: contact.phone,
          message,
          contactId: contact.id,
          personalize,
          saveToHistory,
          skipComplianceCheck,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send WhatsApp message');
      }

      toast({
        title: 'WhatsApp Message Sent Successfully!',
        description: `Message sent to ${contact.firstName || contact.phone}${personalize ? ' with personalization' : ''}.`,
      });

      // Reset form and close modal
      setMessage('');
      setPersonalize(true);
      setSaveToHistory(true);
      setSkipComplianceCheck(false);
      onClose();

    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      toast({
        title: 'Failed to Send WhatsApp Message',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Send WhatsApp to {contact.firstName || contact.phone}
          </DialogTitle>
          <DialogDescription>
            Compose a personalized WhatsApp message that will be sent to{' '}
            <span className="font-medium">{contact.phone}</span>
            {contact.company && (
              <span> at {contact.company}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recipient Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <User className="h-4 w-4 text-gray-500" />
            <div>
              <p className="font-medium text-sm">
                {contact.firstName} {contact.lastName}
              </p>
              <p className="text-sm text-gray-600">{contact.phone}</p>
              {contact.jobTitle && contact.company && (
                <p className="text-xs text-gray-500">
                  {contact.jobTitle} at {contact.company}
                </p>
              )}
            </div>
          </div>

          {/* WhatsApp Compliance Notice */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">WhatsApp Business API Compliance</p>
              <p className="text-blue-700">
                Ensure the recipient has opted in to receive WhatsApp messages. Messages must comply with Meta's Business API policies.
              </p>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your WhatsApp message... Use {{firstName}}, {{lastName}}, {{company}}, {{greeting}} for personalization."
              rows={6}
              disabled={isLoading}
              required
            />
            
            {/* Character count info */}
            <div className="flex justify-between items-center text-xs">
              <div className={`${withinLimit ? 'text-gray-500' : 'text-red-600'}`}>
                {characterCount}/4096 characters
              </div>
              {!withinLimit && (
                <div className="text-red-600 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Exceeds WhatsApp limit
                </div>
              )}
              {characterCount > 3000 && withinLimit && (
                <div className="text-amber-600 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Approaching limit
                </div>
              )}
            </div>
            
            <p className="text-xs text-gray-500">
              💡 Personalization variables: {{firstName}}, {{lastName}}, {{company}}, {{greeting}}, {{date}}, {{time}}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="personalize">Enable Personalization</Label>
                <p className="text-xs text-gray-500">
                  Replace variables like {{firstName}} with actual contact data
                </p>
              </div>
              <Switch
                id="personalize"
                checked={personalize}
                onCheckedChange={setPersonalize}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="saveToHistory">Save to History</Label>
                <p className="text-xs text-gray-500">
                  Keep a record of this WhatsApp message in your history
                </p>
              </div>
              <Switch
                id="saveToHistory"
                checked={saveToHistory}
                onCheckedChange={setSaveToHistory}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="skipCompliance">Skip Compliance Check (Admin Only)</Label>
                <p className="text-xs text-gray-500">
                  Bypass WhatsApp Business API compliance validation
                </p>
              </div>
              <Switch
                id="skipCompliance"
                checked={skipComplianceCheck}
                onCheckedChange={setSkipComplianceCheck}
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || characterCount === 0 || !withinLimit}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send WhatsApp
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}