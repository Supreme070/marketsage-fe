'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, User, MessagesSquare, Bot } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

type ChatMessage = {
  id: string;
  sender: 'user' | 'agent';
  message: string;
  timestamp: Date;
};

export interface ChatBotProps {
  initialOpen?: boolean;
  variant?: 'fixed' | 'inline';
  buttonText?: string;
  showInitially?: boolean;
  customButtonClassName?: string;
  customIconClassName?: string;
  dialogTitleGradient?: string;
  pulseColors?: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
}

export default function ChatBot({ 
  initialOpen = false,
  variant = 'fixed',
  buttonText = 'Chat',
  showInitially = true,
  customButtonClassName = '',
  customIconClassName = '',
  dialogTitleGradient = '',
  pulseColors = {
    primary: 'bg-secondary/50',
    secondary: 'bg-secondary/50',
    tertiary: 'bg-secondary/50'
  }
}: ChatBotProps) {
  const [isChatOpen, setIsChatOpen] = useState(initialOpen);
  const [chatMessage, setChatMessage] = useState('');
  const [showButton, setShowButton] = useState(showInitially);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'agent',
      message: 'Hello! Welcome to MarketSage. How can I assist you today?',
      timestamp: new Date(),
    },
  ]);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const { toast } = useToast();

  // Handle chat message submission
  const handleSendChatMessage = () => {
    if (!chatMessage.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      sender: 'user' as const,
      message: chatMessage,
      timestamp: new Date(),
    };
    setChatMessages([...chatMessages, userMessage]);
    setChatMessage('');
    
    // Simulate agent typing
    setIsSendingChat(true);
    
    // Simulate agent response after delay
    setTimeout(() => {
      const agentMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent' as const,
        message: getAgentResponse(chatMessage),
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, agentMessage]);
      setIsSendingChat(false);
    }, 1500);
  };

  // Get contextual agent responses based on user message
  const getAgentResponse = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('whatsapp') || lowerMessage.includes('template')) {
      return "For WhatsApp template approvals, ensure your content complies with WhatsApp Business guidelines. You can find more details in our WhatsApp setup guide, or I can help troubleshoot specific template issues.";
    } else if (lowerMessage.includes('email') || lowerMessage.includes('campaign')) {
      return "To improve your email campaigns, consider optimizing your subject lines, segmenting your audience, and testing different send times. Our Email Marketing Essentials guide covers these topics in detail.";
    } else if (lowerMessage.includes('bill') || lowerMessage.includes('payment') || lowerMessage.includes('invoice')) {
      return "For billing inquiries, please check your account dashboard under Settings > Billing. If you need further assistance, I can connect you with our billing department.";
    } else if (lowerMessage.includes('sms') || lowerMessage.includes('text')) {
      return "Our SMS delivery rates in Nigeria typically exceed 98%. For best practices on SMS campaigns, check our SMS guide or let me know if you're experiencing specific delivery issues.";
    } else {
      return "Thank you for your message. I can help with that. Could you provide more details so I can better assist you?";
    }
  };

  // When component mounts, show chat button after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButton(true);
    }, showInitially ? 0 : 3000);
    
    return () => clearTimeout(timer);
  }, [showInitially]);

  // Fixed chat button at the bottom right of the screen
  const FixedChatButton = () => {
    if (!showButton) return null;
    
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          onClick={() => setIsChatOpen(true)}
          className={`rounded-full shadow-lg p-4 h-auto ${customButtonClassName}`}
          size="lg"
        >
          <Bot className={customIconClassName || "h-5 w-5 mr-2"} />
          {buttonText}
        </Button>
      </div>
    );
  };

  // Inline chat button
  const InlineChatButton = () => {
    return (
      <Button 
        onClick={() => setIsChatOpen(true)}
        className={`rounded-md shadow-sm ${customButtonClassName}`}
        size="sm"
      >
        <MessagesSquare className={customIconClassName || "h-4 w-4 mr-2"} />
        {buttonText}
      </Button>
    );
  };

  return (
    <>
      {variant === 'fixed' ? <FixedChatButton /> : <InlineChatButton />}
      
      {/* Chat Dialog */}
      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 h-[500px] flex flex-col">
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center">
              <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
              <DialogTitle className={dialogTitleGradient || ''}>
                AI Assistant
              </DialogTitle>
            </div>
            <DialogDescription>
              Get instant help with your questions
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/10"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {msg.sender === "agent" && (
                      <>
                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-secondary/20">
                          <Bot className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-medium">MarketSage AI</span>
                      </>
                    )}
                    {msg.sender === "user" && (
                      <span className="text-xs ml-auto">You</span>
                    )}
                  </div>
                  <p className="text-sm">{msg.message}</p>
                  <p className="text-xs opacity-70 mt-1 text-right">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            
            {isSendingChat && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-3 bg-secondary/10">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-secondary/20">
                      <Bot className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-medium">MarketSage AI</span>
                  </div>
                  <div className="flex space-x-1 items-center h-6">
                    <div className={`w-2 h-2 rounded-full ${pulseColors.primary} animate-bounce`} style={{ animationDelay: "0ms" }}></div>
                    <div className={`w-2 h-2 rounded-full ${pulseColors.secondary} animate-bounce`} style={{ animationDelay: "150ms" }}></div>
                    <div className={`w-2 h-2 rounded-full ${pulseColors.tertiary} animate-bounce`} style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="border-t p-4">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChatMessage();
              }}
              className="flex items-center space-x-2"
            >
              <Input
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button 
                type="submit" 
                size="icon"
                disabled={!chatMessage.trim() || isSendingChat}
                className="bg-gradient-to-r from-teal-500 to-amber-500 hover:from-amber-500 hover:to-teal-500"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 