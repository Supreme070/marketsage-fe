"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  HelpCircle,
  Book,
  FileText,
  PlayCircle,
  MessageCircle,
  Mail,
  Phone,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Info,
  BarChart3,
  Users,
  LayoutGrid,
  MessageSquare,
  Send,
  User,
  X,
  Loader2
} from "lucide-react";

import {
  CustomCard,
  CustomCardHeader,
  CustomCardTitle,
  CustomCardDescription,
  CustomCardContent,
  CustomCardFooter,
} from "@/components/ui/custom-card";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useToast } from "@/components/ui/use-toast";

export default function HelpPage() {
  // State for chat functionality
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    sender: "user" | "agent";
    message: string;
    timestamp: Date;
  }>>([
    {
      id: "1",
      sender: "agent",
      message: "Hello! Welcome to MarketSage support. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [isSendingChat, setIsSendingChat] = useState(false);

  // State for ticket submission
  const [ticketData, setTicketData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [activeTab, setActiveTab] = useState("faq");

  const { toast } = useToast();

  // Handle chat message submission
  const handleSendChatMessage = () => {
    if (!chatMessage.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      sender: "user" as const,
      message: chatMessage,
      timestamp: new Date(),
    };
    setChatMessages([...chatMessages, userMessage]);
    setChatMessage("");
    
    // Simulate agent typing
    setIsSendingChat(true);
    
    // Simulate agent response after delay
    setTimeout(() => {
      const agentMessage = {
        id: (Date.now() + 1).toString(),
        sender: "agent" as const,
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
    
    if (lowerMessage.includes("whatsapp") || lowerMessage.includes("template")) {
      return "For WhatsApp template approvals, ensure your content complies with WhatsApp Business guidelines. You can find more details in our WhatsApp setup guide, or I can help troubleshoot specific template issues.";
    } else if (lowerMessage.includes("email") || lowerMessage.includes("campaign")) {
      return "To improve your email campaigns, consider optimizing your subject lines, segmenting your audience, and testing different send times. Our Email Marketing Essentials guide covers these topics in detail.";
    } else if (lowerMessage.includes("bill") || lowerMessage.includes("payment") || lowerMessage.includes("invoice")) {
      return "For billing inquiries, please check your account dashboard under Settings > Billing. If you need further assistance, I can connect you with our billing department.";
    } else if (lowerMessage.includes("sms") || lowerMessage.includes("text")) {
      return "Our SMS delivery rates in Nigeria typically exceed 98%. For best practices on SMS campaigns, check our SMS guide or let me know if you're experiencing specific delivery issues.";
    } else {
      return "Thank you for your message. I can help with that. Could you provide more details so I can better assist you?";
    }
  };

  // Handle ticket form input changes
  const handleTicketInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTicketData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle ticket submission
  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!ticketData.firstName || !ticketData.lastName || !ticketData.email || !ticketData.subject || !ticketData.message) {
      toast({
        title: "Missing information",
        description: "Please fill out all fields in the form.",
        variant: "destructive"
      });
      return;
    }

    // Submit ticket logic
    setIsSubmittingTicket(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmittingTicket(false);
      
      // Reset form
      setTicketData({
        firstName: "",
        lastName: "",
        email: "",
        subject: "",
        message: "",
      });
      
      // Show success message
      toast({
        title: "Ticket submitted successfully",
        description: "We've received your support request and will respond shortly.",
      });
    }, 1500);
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <h1 className="text-3xl font-bold tracking-tight text-secondary dark:text-white">Help & Support</h1>
        <div className="flex items-center gap-2">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for help articles..."
              className="pl-8 pr-4 w-full"
            />
          </div>
        </div>
      </div>

      <div className="bg-primary/10 rounded-lg p-6 text-center">
        <div className="flex justify-center mb-4">
          <HelpCircle className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-secondary dark:text-white mb-2">
          How can we help you today?
        </h2>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
          Find answers to common questions, learn how to use MarketSage, or contact our support team for assistance.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <Button className="h-auto py-3 px-4 flex flex-col items-center" asChild>
            <a href="#faq">
              <FileText className="h-6 w-6 mb-2" />
              <span>View FAQs</span>
            </a>
          </Button>
          <Button className="h-auto py-3 px-4 flex flex-col items-center" asChild>
            <a href="#guides">
              <Book className="h-6 w-6 mb-2" />
              <span>Quick Start Guides</span>
            </a>
          </Button>
          <Button 
            className="h-auto py-3 px-4 flex flex-col items-center" 
            onClick={() => {
              setActiveTab("contact");
              window.location.hash = "contact";
            }}
          >
            <MessageCircle className="h-6 w-6 mb-2" />
            <span>Contact Support</span>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-secondary/5 dark:bg-secondary/20 w-full justify-start p-0 h-auto">
          <TabsTrigger
            value="faq"
            className="rounded-none data-[state=active]:bg-background border-b-2 border-transparent data-[state=active]:border-primary py-2 px-4"
            id="faq"
          >
            FAQ
          </TabsTrigger>
          <TabsTrigger
            value="guides"
            className="rounded-none data-[state=active]:bg-background border-b-2 border-transparent data-[state=active]:border-primary py-2 px-4"
            id="guides"
          >
            Quick Start Guides
          </TabsTrigger>
          <TabsTrigger
            value="videos"
            className="rounded-none data-[state=active]:bg-background border-b-2 border-transparent data-[state=active]:border-primary py-2 px-4"
          >
            Video Tutorials
          </TabsTrigger>
          <TabsTrigger
            value="contact"
            className="rounded-none data-[state=active]:bg-background border-b-2 border-transparent data-[state=active]:border-primary py-2 px-4"
            id="contact"
          >
            Contact Support
          </TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center text-secondary dark:text-primary">
                <Mail className="mr-2 h-5 w-5" />
                Email Marketing
              </h3>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="faq-email-1">
                  <AccordionTrigger className="text-sm">
                    How do I create my first email campaign?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    To create your first email campaign, navigate to the Email section in the sidebar, then click "Campaigns" and select "Create Campaign." Follow the step-by-step process to design, configure, and schedule your campaign.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-email-2">
                  <AccordionTrigger className="text-sm">
                    How can I improve my email open rates?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    To improve open rates, craft compelling subject lines, send at optimal times, segment your audience, maintain a clean list, and personalize content. MarketSage's analytics can help you identify what works best for your audience.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-email-3">
                  <AccordionTrigger className="text-sm">
                    What's the best time to send emails in Nigeria?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    For Nigerian audiences, early morning (7-9 AM) and early evening (7-9 PM) typically see higher open rates. However, you should test different times with your specific audience and use MarketSage's optimization features.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center text-secondary dark:text-primary">
                <MessageCircle className="mr-2 h-5 w-5" />
                WhatsApp Marketing
              </h3>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="faq-whatsapp-1">
                  <AccordionTrigger className="text-sm">
                    How do I get my WhatsApp templates approved?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    Create templates that comply with WhatsApp's guidelines: be clear, avoid prohibited content, use approved format, and include required variables. Submit through MarketSage, and our system will guide you through the approval process.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-whatsapp-2">
                  <AccordionTrigger className="text-sm">
                    What is the 24-hour conversation window?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    The 24-hour window allows businesses to send free-form messages to customers within 24 hours of their last message. After this window closes, you can only send template messages until the customer messages you again.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-whatsapp-3">
                  <AccordionTrigger className="text-sm">
                    Can multiple team members use the WhatsApp inbox?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    Yes, MarketSage's multi-agent inbox allows multiple team members to access and respond to WhatsApp conversations without the need for QR code scanning or device sharing. You can assign conversations, track agent performance, and maintain seamless communication.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center text-secondary dark:text-primary">
                <LayoutGrid className="mr-2 h-5 w-5" />
                Automation & Workflows
              </h3>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="faq-workflow-1">
                  <AccordionTrigger className="text-sm">
                    How do I set up a multi-channel automation?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    Go to the Workflows section, create a new workflow, and use the visual builder to combine different channel actions (email, SMS, WhatsApp) with conditions and delays. Connect the nodes to create a seamless multi-channel experience.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-workflow-2">
                  <AccordionTrigger className="text-sm">
                    Can I create automated responses for WhatsApp?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    Yes, you can set up automated responses for WhatsApp using workflows. Create triggers based on specific customer messages or actions, then configure appropriate responses using approved templates or within the 24-hour window.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-workflow-3">
                  <AccordionTrigger className="text-sm">
                    How do I track workflow performance?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    MarketSage provides detailed analytics for each workflow. Navigate to the workflow details page to see engagement metrics, conversion rates, and node-by-node performance. Use these insights to optimize your automation flows.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          <div className="bg-secondary/5 dark:bg-secondary/10 rounded-lg p-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold mb-1">Can't find what you're looking for?</h3>
              <p className="text-muted-foreground">Our support team is ready to help with any questions you have.</p>
            </div>
            <Button 
              onClick={() => {
                setActiveTab("contact");
                window.location.hash = "contact";
              }}
            >
              Contact Support
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="guides" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CustomCard>
              <CustomCardContent className="p-6">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Getting Started with Email Marketing</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Learn how to create and send your first email campaign in just 10 minutes.
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <a href="/help/guides/email-marketing">
                    Read Guide <ChevronRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CustomCardContent>
            </CustomCard>

            <CustomCard>
              <CustomCardContent className="p-6">
                <div className="rounded-full bg-accent/10 w-12 h-12 flex items-center justify-center mb-4">
                  <MessageCircle className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-lg font-semibold mb-2">WhatsApp Business Setup Guide</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Step-by-step instructions for setting up and verifying your WhatsApp Business account.
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <a href="/help/guides/whatsapp-setup">
                    Read Guide <ChevronRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CustomCardContent>
            </CustomCard>

            <CustomCard>
              <CustomCardContent className="p-6">
                <div className="rounded-full bg-secondary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Effective SMS Campaigns</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Best practices for creating high-performing SMS campaigns for Nigerian markets.
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <a href="/help/guides/sms-campaigns">
                    Read Guide <ChevronRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CustomCardContent>
            </CustomCard>

            <CustomCard>
              <CustomCardContent className="p-6">
                <div className="rounded-full bg-green-500/10 w-12 h-12 flex items-center justify-center mb-4">
                  <LayoutGrid className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Building Your First Automation</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Learn to create powerful automated workflows that drive conversions.
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <a href="/help/guides/automation-basics">
                    Read Guide <ChevronRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CustomCardContent>
            </CustomCard>

            <CustomCard>
              <CustomCardContent className="p-6">
                <div className="rounded-full bg-purple-500/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-purple-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Advanced Contact Segmentation</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Strategies for segmenting your audience for more effective targeting.
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <a href="/help/guides/segmentation">
                    Read Guide <ChevronRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CustomCardContent>
            </CustomCard>

            <CustomCard>
              <CustomCardContent className="p-6">
                <div className="rounded-full bg-blue-500/10 w-12 h-12 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Understanding Your Analytics</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  How to interpret and act on MarketSage analytics to improve performance.
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <a href="/help/guides/analytics">
                    Read Guide <ChevronRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CustomCardContent>
            </CustomCard>
          </div>
        </TabsContent>

        <TabsContent value="videos" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CustomCard>
              <img
                src="https://same-assets.com/images/d31dce8b-3b5e-4f88-a23e-aac21f58b3b0"
                alt="Email Marketing Tutorial"
                className="w-full h-40 object-cover rounded-t-lg"
              />
              <CustomCardContent className="p-4">
                <h3 className="text-lg font-semibold mb-1">Email Marketing Essentials</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  10:25 • Learn how to create effective email campaigns
                </p>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href="/help/videos/email-marketing">
                    <PlayCircle className="mr-2 h-4 w-4" /> Watch Now
                  </a>
                </Button>
              </CustomCardContent>
            </CustomCard>

            <CustomCard>
              <img
                src="https://same-assets.com/images/1c0fccc4-3a07-4d51-9d18-5651aaab7fe1"
                alt="WhatsApp Marketing Tutorial"
                className="w-full h-40 object-cover rounded-t-lg"
              />
              <CustomCardContent className="p-4">
                <h3 className="text-lg font-semibold mb-1">WhatsApp Business API Setup</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  15:50 • Complete guide to setting up WhatsApp Business
                </p>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href="/help/videos/whatsapp-setup">
                    <PlayCircle className="mr-2 h-4 w-4" /> Watch Now
                  </a>
                </Button>
              </CustomCardContent>
            </CustomCard>

            <CustomCard>
              <img
                src="https://same-assets.com/images/f3de4f9d-d075-490a-9c66-b3ec132a46a6"
                alt="Automation Tutorial"
                className="w-full h-40 object-cover rounded-t-lg"
              />
              <CustomCardContent className="p-4">
                <h3 className="text-lg font-semibold mb-1">Building Powerful Automations</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  18:35 • Learn to create multi-channel workflows
                </p>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href="/help/videos/automation-basics">
                    <PlayCircle className="mr-2 h-4 w-4" /> Watch Now
                  </a>
                </Button>
              </CustomCardContent>
            </CustomCard>
          </div>

          <div className="text-center">
            <Button asChild variant="outline">
              <a href="/help/videos">
                View All Tutorials <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <CustomCard>
              <CustomCardHeader>
                <CustomCardTitle>Contact Support</CustomCardTitle>
                <CustomCardDescription>
                  Get help from our customer support team
                </CustomCardDescription>
              </CustomCardHeader>
              <CustomCardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="rounded-full bg-primary/10 p-2 mr-4">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Email Support</p>
                      <p className="text-sm text-muted-foreground">
                        support@marketsage.com
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Response time: Within 24 hours
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="rounded-full bg-secondary/10 p-2 mr-4">
                      <Phone className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="font-medium">Phone Support</p>
                      <p className="text-sm text-muted-foreground">
                        +234 (0) 1 234 5678
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Available Monday-Friday, 9am-5pm WAT
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="rounded-full bg-accent/10 p-2 mr-4">
                      <MessageCircle className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium">Live Chat</p>
                      <p className="text-sm text-muted-foreground">
                        Chat with our support team
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Available 24/7 for premium users
                      </p>
                    </div>
                    <Button 
                      className="ml-auto" 
                      size="sm"
                      onClick={() => setIsChatOpen(true)}
                    >
                      Start Chat
                    </Button>
                  </div>
                </div>
              </CustomCardContent>
            </CustomCard>

            <CustomCard>
              <CustomCardHeader>
                <CustomCardTitle>Submit a Support Ticket</CustomCardTitle>
                <CustomCardDescription>
                  We'll respond to your inquiry as soon as possible
                </CustomCardDescription>
              </CustomCardHeader>
              <CustomCardContent>
                <form className="space-y-4" onSubmit={handleSubmitTicket}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">First Name</label>
                      <Input 
                        name="firstName"
                        value={ticketData.firstName}
                        onChange={handleTicketInputChange}
                        placeholder="Enter your first name" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Last Name</label>
                      <Input 
                        name="lastName"
                        value={ticketData.lastName}
                        onChange={handleTicketInputChange}
                        placeholder="Enter your last name" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input 
                      name="email"
                      value={ticketData.email}
                      onChange={handleTicketInputChange}
                      placeholder="Enter your email" 
                      type="email" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subject</label>
                    <Input 
                      name="subject"
                      value={ticketData.subject}
                      onChange={handleTicketInputChange}
                      placeholder="What is your inquiry about?" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Message</label>
                    <textarea
                      name="message"
                      value={ticketData.message}
                      onChange={handleTicketInputChange}
                      className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Describe your issue or question"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmittingTicket}
                  >
                    {isSubmittingTicket ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                        Submitting...
                      </>
                    ) : (
                      "Submit Ticket"
                    )}
                  </Button>
                </form>
              </CustomCardContent>
            </CustomCard>
          </div>

          <div className="bg-secondary/5 dark:bg-secondary/10 rounded-lg p-6">
            <div className="flex items-start">
              <Info className="h-6 w-6 text-secondary mr-4 mt-1" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Nigerian Business Hours</h3>
                <p className="text-sm text-muted-foreground">
                  Our dedicated Nigerian support team is available during local business hours (9am-5pm WAT, Monday-Friday).
                  For urgent matters outside these hours, premium and enterprise customers can access our 24/7 international support.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Chat Dialog */}
      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 h-[500px] flex flex-col">
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center">
              <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
              <DialogTitle>Live Support</DialogTitle>
            </div>
            <DialogDescription>
              Chat with our support team
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
                          <User className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-medium">Support Agent</span>
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
                      <User className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-medium">Support Agent</span>
                  </div>
                  <div className="flex space-x-1 items-center h-6">
                    <div className="w-2 h-2 rounded-full bg-secondary/50 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 rounded-full bg-secondary/50 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 rounded-full bg-secondary/50 animate-bounce" style={{ animationDelay: "300ms" }}></div>
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
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
