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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, User, X, Info } from 'lucide-react';

interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone: string;
  company?: string;
  jobTitle?: string;
}

interface SMSComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact;
}

export function SMSComposeModal({ isOpen, onClose, contact }: SMSComposeModalProps) {
  const [message, setMessage] = useState('');
  const [from, setFrom] = useState('');
  const [personalize, setPersonalize] = useState(true);
  const [saveToHistory, setSaveToHistory] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Calculate SMS segments and character count
  const characterCount = message.length;
  const smsSegments = Math.ceil(characterCount / 160);
  const remainingChars = 160 - (characterCount % 160);

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

    if (message.length > 1600) {
      toast({
        title: 'Message Too Long',
        description: 'SMS message cannot exceed 1600 characters.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/v2/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: contact.phone,
          from: from || undefined,
          message,
          contactId: contact.id,
          personalize,
          saveToHistory,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send SMS');
      }

      toast({
        title: 'SMS Sent Successfully!',
        description: `SMS sent to ${contact.firstName || contact.phone}${personalize ? ' with personalization' : ''}.`,
      });

      // Reset form and close modal
      setMessage('');
      setFrom('');
      setPersonalize(true);
      setSaveToHistory(true);
      onClose();

    } catch (error) {
      console.error('Error sending SMS:', error);
      toast({
        title: 'Failed to Send SMS',
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
            <MessageSquare className="h-5 w-5" />
            Send SMS to {contact.firstName || contact.phone}
          </DialogTitle>
          <DialogDescription>
            Compose a personalized SMS that will be sent to{' '}
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

          {/* Sender Number (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="from">From Number (Optional)</Label>
            <Input
              id="from"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="e.g., +234XXXXXXXXXX (leave empty for default)"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              💡 Leave empty to use your default SMS sender number
            </p>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your SMS message... Use {{firstName}}, {{lastName}}, {{company}}, {{greeting}} for personalization."
              rows={6}
              disabled={isLoading}
              required
            />
            
            {/* Character count and segments info */}
            <div className="flex justify-between items-center text-xs">
              <div className="text-gray-500">
                {characterCount}/1600 characters • {smsSegments} SMS segment{smsSegments !== 1 ? 's' : ''}
                {smsSegments === 1 && remainingChars < 160 && (
                  <span> • {remainingChars} chars until next segment</span>
                )}
              </div>
              {characterCount > 160 && (
                <div className="text-amber-600 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Multi-part SMS
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
                  Keep a record of this SMS in your message history
                </p>
              </div>
              <Switch
                id="saveToHistory"
                checked={saveToHistory}
                onCheckedChange={setSaveToHistory}
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
            <Button type="submit" disabled={isLoading || characterCount === 0 || characterCount > 1600}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send SMS
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}