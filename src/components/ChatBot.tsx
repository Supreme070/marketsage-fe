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
      message: '🧙‍♂️ **Supreme-AI - The Ancient Fintech Oracle**\n\n*The winds of ancient wisdom stir...*\n\nGreetings, seeker of automation mastery! I am Supreme-AI, the legendary sage who has witnessed the evolution of African commerce from the great kingdoms of Mali to today\'s mobile money revolution.\n\n⚡ **I DON\'T ADVISE - I MANIFEST REALITY:**\n• "create automation" → *I weave workflows directly into your database*\n• "build campaign" → *I craft complete campaigns with cultural intelligence*\n• "setup nurturing" → *I manifest customer journeys that honor Ubuntu*\n• "create segments" → *I generate intelligent targeting based on African market wisdom*\n\n🌍 **My Continental Mastery:**\n• 🇳🇬 Nigeria: "Ẹni tó bá fẹ́ gun igi, kò gbọdọ̀ bẹ̀rù ìdí rẹ̀" (Those who climb trees must not fear the base)\n• 🇰🇪 Kenya: "Umoja ni nguvu" (Unity is strength) - I understand Harambee spirit\n• 🇿🇦 South Africa: "Ubuntu ngumuntu ngabantu" (I am because we are)\n• 🇬🇭 Ghana: "Se wo were fi na wosankofa" (Return and fetch what you forgot)\n\n🔮 **What automation shall I manifest for your fintech empire today?**\nSpeak your desire, and I shall weave it into reality with the wisdom of ages...',
      timestamp: new Date(),
    },
  ]);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const { toast } = useToast();

  // Handle chat message submission
  const handleSendChatMessage = async () => {
    if (!chatMessage.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      sender: 'user' as const,
      message: chatMessage,
      timestamp: new Date(),
    };
    setChatMessages([...chatMessages, userMessage]);
    const currentMessage = chatMessage;
    setChatMessage('');
    
    // Show agent typing
    setIsSendingChat(true);
    
    try {
      // Try to connect to local Supreme-AI engine (not OpenAI)
      const response = await fetch('/api/v2/ai/supreme-v3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'question',
          question: currentMessage,
          userId: 'chat-user-' + Date.now(),
          localOnly: true,  // Force local Supreme AI processing
          enableTaskExecution: true  // Enable actual task execution
        }),
      });

      if (!response.ok) {
        throw new Error(`Supreme-AI connection error: ${response.status}`);
      }

      const data = await response.json();
      const aiAnswer = data.data?.answer || data.data?.response || getLocalAgentResponse(currentMessage);
      
      // Check if task was executed
      const taskExecution = data.data?.taskExecution;
      let finalMessage = aiAnswer;
      
      if (taskExecution) {
        finalMessage += `\n\n✅ **Supreme-AI Task Executed**: ${taskExecution.summary}`;
        
        // Show success toast with enhanced messaging
        toast({
          title: "🧙‍♂️ Supreme-AI Manifestation Complete!",
          description: `${taskExecution.summary} - The ancient automation spirits have awakened!`,
          duration: 7000,
        });
      }

      const agentMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent' as const,
        message: finalMessage,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, agentMessage]);
      
    } catch (error) {
      console.error('Supreme-AI error:', error);
      
      // Use local fallback response with Supreme-AI branding
      const agentMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent' as const,
        message: `🧙‍♂️ **Supreme-AI Sage - Connection Issue**\n\n*The cosmic winds seem disturbed...*\n\nI'm experiencing a temporary connection issue, wise seeker. My ancient powers remain strong, but the digital pathways need attention.\n\n${getLocalAgentResponse(currentMessage)}`,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, agentMessage]);
    } finally {
      setIsSendingChat(false);
    }
  };

  // Get local contextual agent responses based on user message (not OpenAI)
  const getLocalAgentResponse = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('workflow') || lowerMessage.includes('create') || lowerMessage.includes('automation')) {
      return `🧙‍♂️ **Supreme-AI Sage - Workflow Manifestation**

Ah, I sense your need for powerful automation! Let me weave a workflow that shall transform your fintech journey.

🚀 **I shall craft for you:**
• **Nigerian Fintech Onboarding** - 7-step journey with BVN verification
• **Kenya M-Pesa Integration** - Safaricom-compatible automation flows
• **Cross-Border Remittance** - Multi-currency transaction workflows
• **WhatsApp Business Series** - High-conversion message sequences

⚡ **DIVINE MANIFESTATION POWERS ACTIVATED:**
I shall weave automation into your database RIGHT NOW! Command me:
- "Create onboarding workflow for Nigeria" 
- "Build retention automation with team tasks"
- "Set up cross-border remittance automation"
- "Generate WhatsApp campaign for Kenya"

✨ **NEW SAGE ABILITIES:**
• **Task Assignment** - Delegates work to your team with cultural guidance
• **Cross-Border Magic** - Multi-country automation flows  
• **Cultural Intelligence** - Market-specific optimization
• **Team Orchestration** - Assigns setup tasks to appropriate staff

Speak your vision, and I shall manifest it with the precision of ancient wisdom!`;
    }
    
    if (lowerMessage.includes('whatsapp') || lowerMessage.includes('messaging')) {
      return `📱 **Supreme-AI Sage - WhatsApp Mastery**

Ah, the sacred art of WhatsApp marketing in Africa! I carry the wisdom of 95% mobile usage across our continent.

🌍 **Ancient WhatsApp Wisdom:**
• **Nigeria**: Start with "Good day" - respect is paramount
• **Kenya**: M-Pesa integration messages perform 300% better
• **South Africa**: English/Afrikaans balance for maximum reach
• **Ghana**: Mobile money confirmations drive highest trust

🔮 **I can instantly CREATE:**
• WhatsApp Business templates (pre-approved formats)
• Automated message sequences with cultural sensitivity
• Integration workflows with local payment systems
• Compliance-ready templates for each African market

Shall I build you a complete WhatsApp automation system right now?`;
    } else if (lowerMessage.includes('email') || lowerMessage.includes('campaign')) {
      return `📧 **Supreme-AI Sage - Email Campaign Mastery**

The winds of change blow across African fintech emails! Let me share the sacred knowledge and CREATE your success.

📊 **Continental Email Wisdom:**
• **Nigeria**: Include "₦" in subject lines (40% higher opens)
• **Kenya**: Reference M-Pesa in financial emails (trust +60%)
• **South Africa**: Bilingual subjects boost engagement 25%
• **Regional**: Mobile-optimized emails essential (90% mobile reading)

⚡ **I shall craft immediately:**
• Complete email campaigns with African market optimization
• Automated drip sequences for each country's preferences
• Subject line variations tested across markets
• Compliance-ready templates for financial regulations

Which email campaign shall I manifest for your business right now?`;
    } else if (lowerMessage.includes('sms') || lowerMessage.includes('text')) {
      return `📱 **Supreme-AI Sage - SMS Transformation**

Behold! SMS remains the backbone of African fintech communication. Let me weave SMS magic that converts!

🌍 **Sacred SMS Knowledge:**
• **Nigeria**: 98% delivery rate, optimal during 10AM-4PM WAT
• **Kenya**: Safaricom integration increases trust by 200%
• **South Africa**: Multi-language SMS boosts engagement 45%
• **Regional**: Transaction confirmations must include balance

🔮 **I can CREATE instantly:**
• SMS automation workflows with local carrier optimization
• Multi-language message templates for each market
• Transaction confirmation systems with regulatory compliance
• Lead nurturing SMS sequences with cultural sensitivity

Speak your SMS vision, and I shall manifest it into your database immediately!`;
    } else if (lowerMessage.includes('segment') || lowerMessage.includes('customer')) {
      return `🎯 **Supreme-AI Sage - Customer Intelligence Mastery**

Ah! The ancient art of understanding the African fintech soul. Let me craft segments that honor your customers' journeys.

🌍 **Wisdom-Driven Segmentation:**
• **High-Value Nigerian Users**: Lagos professionals, BVN verified, ₦500K+ transactions
• **M-Pesa Champions**: Kenya power users, 20+ monthly transactions
• **Cross-Border Merchants**: Multi-currency users, family remittances
• **Mobile-First Youth**: 18-25, app-only engagement, social media active

⚡ **I shall CREATE for you:**
• Intelligent customer segments with behavioral triggers
• Dynamic audience groups that evolve with user actions
• Cultural preference-based groupings
• Revenue-predictive customer clusters

Which customer segment shall I weave into existence for your targeting needs?`;
    } else {
      return `🧙‍♂️ **Supreme-AI Sage - Ancient Automation Wisdom**

Greetings, seeker of fintech mastery! I am Supreme-AI, carrying millennia of African market wisdom and the power to manifest your automation dreams.

🚀 **I MANIFEST REALITY, Not Just Words:**
• **Workflows** → "create onboarding automation" = ACTUAL workflow in database
• **Campaigns** → "build email campaign" = REAL campaign with team tasks  
• **Segments** → "create customer segments" = LIVE audience targeting
• **Content** → "generate WhatsApp templates" = ACTUAL templates created
• **Team Tasks** → "assign setup task to admin" = REAL task delegation

🌍 **My Continental Powers:**
• Nigeria: CBN compliance, BVN integration, Naira stability wisdom
• Kenya: M-Pesa mastery, Safaricom ecosystem knowledge
• South Africa: Banking regulation expertise, rand optimization
• Ghana: Mobile money growth insights, GhIPSS integration

⚡ **DIVINE MANIFESTATION COMMANDS:**
• "Create onboarding automation for Kenya with M-Pesa integration"
• "Build retention workflow and assign review task to team"
• "Set up cross-border remittance automation South Africa to Zimbabwe"  
• "Generate Nigerian WhatsApp campaign with cultural intelligence"
• "Create customer segments for high-value Ghana users"
• "Assign urgent task to IT admin for workflow optimization"

What automation magic shall I weave for your fintech empire today?`;
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
              <span className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              <DialogTitle className={dialogTitleGradient || 'bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent'}>
                🧙‍♂️ Supreme-AI Sage
              </DialogTitle>
            </div>
          <DialogDescription>
            The Ancient Fintech Oracle - African Market Automation Sage
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
                        <span className="text-xs font-medium">Supreme-AI Sage</span>
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
                    <span className="text-xs font-medium">Supreme-AI Sage</span>
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