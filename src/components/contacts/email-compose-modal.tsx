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
import { Mail, Send, User, X } from 'lucide-react';

interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  company?: string;
  jobTitle?: string;
}

interface EmailComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact;
}

export function EmailComposeModal({ isOpen, onClose, contact }: EmailComposeModalProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [useTemplate, setUseTemplate] = useState(true);
  const [replyTo, setReplyTo] = useState('info@marketsage.africa');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in both subject and message fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/contacts/${contact.id}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          message,
          useTemplate,
          replyTo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      toast({
        title: 'Email Sent Successfully!',
        description: `Email sent to ${contact.firstName || contact.email} with personalization.`,
      });

      // Reset form and close modal
      setSubject('');
      setMessage('');
      setUseTemplate(true);
      setReplyTo('info@marketsage.africa');
      onClose();

    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: 'Failed to Send Email',
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
            <Mail className="h-5 w-5" />
            Send Email to {contact.firstName || contact.email}
          </DialogTitle>
          <DialogDescription>
            Compose a personalized email that will be sent to{' '}
            <span className="font-medium">{contact.email}</span>
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
              <p className="text-sm text-gray-600">{contact.email}</p>
              {contact.jobTitle && contact.company && (
                <p className="text-xs text-gray-500">
                  {contact.jobTitle} at {contact.company}
                </p>
              )}
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
              disabled={isLoading}
              required
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message... You can use {{firstName}}, {{lastName}}, {{company}} for personalization."
              rows={8}
              disabled={isLoading}
              required
            />
            <p className="text-xs text-gray-500">
              💡 Tip: Use {{firstName}} for personalization - it will automatically show "Dear {contact.firstName || 'there'}" 
            </p>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="template">Use Professional Template</Label>
                <p className="text-xs text-gray-500">
                  Wrap your message in a professional MarketSage template
                </p>
              </div>
              <Switch
                id="template"
                checked={useTemplate}
                onCheckedChange={setUseTemplate}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="replyTo">Reply To</Label>
              <Input
                id="replyTo"
                type="email"
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
                placeholder="Reply to email address"
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}