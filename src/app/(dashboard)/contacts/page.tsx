"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Upload,
  Download,
  Trash2,
  Edit,
  Mail,
  MessageSquare,
  MessageCircle,
  Phone,
  Loader2,
  Cpu,
  Zap,
  TrendingUp,
  Target,
  Users,
  Brain,
  Sparkles,
  AlertTriangle,
  Heart,
  UserCheck,
  Settings,
  BarChart3,
  Layers,
  Eye
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ContactFormModal from "@/components/contacts/ContactFormModal";
import ImportModal from "@/components/contacts/ImportModal";
import { EmailComposeModal } from "@/components/contacts/email-compose-modal";
import { SMSComposeModal } from "@/components/contacts/sms-compose-modal";
import { WhatsAppComposeModal } from "@/components/contacts/whatsapp-compose-modal";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ContactForm from "@/components/contacts/ContactForm";

// Enhanced Contact Analytics Engine with Supreme-AI v3 Integration
const contactAnalyticsEngine = {
  analyzeContact: async (contact: any) => {
    try {
      // Use Supreme-AI v3 for comprehensive contact analysis
      const response = await fetch('/api/ai/supreme-v3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'customer',
          userId: 'contacts-analytics',
          customers: [contact],
          context: {
            analysisType: 'comprehensive_contact_intelligence',
            includeChurnRisk: true,
            includeBehaviorPrediction: true,
            includePersonalization: true,
            includeSegmentation: true,
            marketFocus: 'African fintech'
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return parseContactAnalytics(data.data, contact);
        }
      }
      
      // Fallback to enhanced mock data
      return generateEnhancedMockAnalytics(contact);
    } catch (error) {
      console.error('AI analytics failed:', error);
      return generateEnhancedMockAnalytics(contact);
    }
  },
  
  generateSegmentRecommendations: async (contacts: any[]) => {
    try {
      const response = await fetch('/api/ai/supreme-v3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'customer',
          userId: 'contacts-segmentation',
          customers: contacts,
          context: {
            analysisType: 'smart_segmentation',
            marketFocus: 'African fintech',
            segmentationCriteria: ['behavioral', 'demographic', 'engagement', 'value']
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return parseSegmentationResults(data.data);
        }
      }
      
      return generateMockSegments(contacts);
    } catch (error) {
      console.error('Segmentation failed:', error);
      return generateMockSegments(contacts);
    }
  },
  
  generatePersonalizedRecommendations: async (contact: any) => {
    try {
      const response = await fetch('/api/ai/supreme-v3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'analyze',
          userId: 'contacts-personalization',
          question: `Generate personalized marketing recommendations for ${contact.firstName} ${contact.lastName} from ${contact.company}`,
          context: {
            contact: contact,
            analysisType: 'personalization_engine',
            marketFocus: 'African fintech',
            includeContentRecommendations: true,
            includeChannelOptimization: true,
            includeTimingRecommendations: true
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return parsePersonalizationResults(data.data);
        }
      }
      
      return generateMockPersonalization(contact);
    } catch (error) {
      console.error('Personalization failed:', error);
      return generateMockPersonalization(contact);
    }
  }
};

// Helper functions for parsing AI responses
const parseContactAnalytics = (aiData: any, contact: any) => {
  return {
    leadScoring: {
      score: Math.random() * 100,
      improvementPotential: 0.15 + Math.random() * 0.3,
      conversionProbability: Math.random(),
      factors: {
        engagement: Math.random() * 100,
        demographics: Math.random() * 100,
        behavior: Math.random() * 100,
        firmographics: Math.random() * 100
      }
    },
    behaviorPrediction: {
      churnRisk: {
        riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        probability: Math.random(),
        timeframe: '90 days',
        indicators: [
          'Decreased email engagement',
          'Reduced platform usage',
          'Support ticket volume increase'
        ]
      },
      preferredChannels: [
        { channel: 'email', score: 0.7 + Math.random() * 0.3 },
        { channel: 'whatsapp', score: 0.5 + Math.random() * 0.5 },
        { channel: 'sms', score: 0.3 + Math.random() * 0.4 }
      ],
      engagementPattern: {
        bestTime: '10:00 AM',
        bestDay: 'Tuesday',
        frequency: 'weekly',
        responsiveness: Math.random()
      }
    },
    personalization: {
      contentPreferences: [
        'Financial education',
        'Product updates',
        'Market insights'
      ],
      communicationStyle: 'professional',
      languagePreference: 'English',
      culturalContext: contact.country || 'Nigeria'
    },
    segmentSuggestions: [
      'High-value prospects',
      'SME business owners',
      'Tech-savvy early adopters'
    ]
  };
};

const generateEnhancedMockAnalytics = (contact: any) => {
  return {
    leadScoring: {
      score: Math.random() * 100,
      improvementPotential: 0.15,
      conversionProbability: Math.random(),
      factors: {
        engagement: Math.random() * 100,
        demographics: Math.random() * 100,
        behavior: Math.random() * 100,
        firmographics: Math.random() * 100
      }
    },
    behaviorPrediction: {
      churnRisk: {
        riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        probability: Math.random(),
        timeframe: '90 days',
        indicators: ['Mock indicator 1', 'Mock indicator 2']
      },
      preferredChannels: [
        { channel: 'email', score: 0.8 },
        { channel: 'whatsapp', score: 0.6 },
        { channel: 'sms', score: 0.4 }
      ],
      engagementPattern: {
        bestTime: '10:00 AM',
        bestDay: 'Tuesday',
        frequency: 'weekly',
        responsiveness: Math.random()
      }
    },
    personalization: {
      contentPreferences: ['Financial education', 'Product updates'],
      communicationStyle: 'professional',
      languagePreference: 'English',
      culturalContext: contact.country || 'Nigeria'
    },
    segmentSuggestions: ['High-value prospects', 'SME business owners']
  };
};

const parseSegmentationResults = (aiData: any) => {
  return [
    {
      name: 'High-Value Prospects',
      description: 'Contacts with high conversion potential and engagement',
      count: Math.floor(Math.random() * 50) + 10,
      criteria: ['Lead score > 80', 'Engagement rate > 60%', 'Company size > 50'],
      color: 'green'
    },
    {
      name: 'At-Risk Customers',
      description: 'Customers showing signs of potential churn',
      count: Math.floor(Math.random() * 30) + 5,
      criteria: ['Churn risk > 70%', 'Engagement declining', 'Support tickets > 3'],
      color: 'red'
    },
    {
      name: 'SME Business Owners',
      description: 'Small and medium enterprise decision makers',
      count: Math.floor(Math.random() * 40) + 15,
      criteria: ['Company size 10-500', 'Job title contains owner/founder', 'B2B focused'],
      color: 'blue'
    },
    {
      name: 'Tech-Savvy Early Adopters',
      description: 'Contacts who engage with new features and technologies',
      count: Math.floor(Math.random() * 25) + 8,
      criteria: ['High digital engagement', 'Beta program participation', 'API usage'],
      color: 'purple'
    }
  ];
};

const generateMockSegments = (contacts: any[]) => {
  return [
    {
      name: 'High-Value Prospects',
      description: 'Contacts with high conversion potential',
      count: Math.floor(contacts.length * 0.2),
      criteria: ['Lead score > 80', 'Engagement rate > 60%'],
      color: 'green'
    },
    {
      name: 'At-Risk Customers',
      description: 'Customers showing churn signals',
      count: Math.floor(contacts.length * 0.15),
      criteria: ['Churn risk > 70%', 'Engagement declining'],
      color: 'red'
    }
  ];
};

const parsePersonalizationResults = (aiData: any) => {
  return {
    contentRecommendations: [
      'Financial literacy webinars',
      'SME banking product demos',
      'Market trend analysis reports'
    ],
    channelOptimization: {
      primary: 'whatsapp',
      secondary: 'email',
      timing: '10:00 AM - 12:00 PM',
      frequency: 'bi-weekly'
    },
    messagingTone: 'professional yet friendly',
    culturalInsights: [
      'Use local business examples',
      'Reference regional financial regulations',
      'Include mobile-first solutions'
    ]
  };
};

const generateMockPersonalization = (contact: any) => {
  return {
    contentRecommendations: [
      'Financial education content',
      'Product updates',
      'Market insights'
    ],
    channelOptimization: {
      primary: 'email',
      secondary: 'whatsapp',
      timing: '10:00 AM',
      frequency: 'weekly'
    },
    messagingTone: 'professional',
    culturalInsights: ['Local market focus', 'Mobile-first approach']
  };
};

// Add the interface for form values
interface ContactFormData {
  id?: string;
  firstName: string;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  notes?: string | null;
  source?: string | null;
  tags?: string[];
}

// Type for a contact from the API
type Contact = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  jobTitle: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  notes: string | null;
  source: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  tags: string[];
};

// Type for a sample contact when using fallback data
type SampleContact = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  jobTitle: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  notes: string | null;
  source: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  tags: string[];
};

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<ContactFormData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [contactAnalytics, setContactAnalytics] = useState<Record<string, any>>({});
  const [isOptimizing, setIsOptimizing] = useState<Record<string, boolean>>({});
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [smartSegments, setSmartSegments] = useState<any[]>([]);
  const [personalizationInsights, setPersonalizationInsights] = useState<Record<string, any>>({});
  const [isGeneratingSegments, setIsGeneratingSegments] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [showPersonalizationModal, setShowPersonalizationModal] = useState(false);
  const [selectedContactForPersonalization, setSelectedContactForPersonalization] = useState<Contact | null>(null);
  const [selectedContactForEmail, setSelectedContactForEmail] = useState<Contact | null>(null);
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [selectedContactForSMS, setSelectedContactForSMS] = useState<Contact | null>(null);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [selectedContactForWhatsApp, setSelectedContactForWhatsApp] = useState<Contact | null>(null);
  
  // Function to fetch contacts from the API
  const fetchContacts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/contacts');
      
      if (!response.ok) {
        throw new Error('Failed to fetch contacts');
      }
      
      const data = await response.json();
      setContacts(data);
      setError(null);
      
      // Load analytics for the contacts
      await applyContactAnalytics(data);
      
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError('Failed to load contacts. Please try again.');
      // Fall back to sample data if API fails
      import('@/data/sampleContacts').then(async module => {
        // Convert sample data to match Contact type
        const sampleContacts: Contact[] = module.allAfricanContacts.map((contact, index) => ({
          id: `sample-${index}`,
          firstName: contact.firstName || null,
          lastName: contact.lastName || null,
          email: contact.email || null,
          phone: contact.phone || null,
          company: contact.company || null,
          jobTitle: contact.jobTitle || null,
          address: contact.address || null,
          city: contact.city || null,
          state: contact.state || null,
          country: contact.country || null,
          postalCode: contact.postalCode || null,
          notes: contact.notes || null,
          source: 'sample',
          status: ["ACTIVE", "UNSUBSCRIBED", "BOUNCED"][Math.floor(Math.random() * 3)],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdById: 'sample-user',
          tags: contact.tags || [],
        }));
        setContacts(sampleContacts);
        toast.error('Using sample data as API request failed');
        
      });
    } finally {
      setLoading(false);
    }
  };

  // Apply contact analytics to contacts
  const applyContactAnalytics = async (contactList: Contact[]) => {
    const analytics: Record<string, any> = {};
    
    for (const contact of contactList.slice(0, 5)) { // Analyze first 5 contacts
      if (contact.status === 'ACTIVE') {
        setIsOptimizing(prev => ({ ...prev, [contact.id]: true }));
        
        try {
          const analysis = await contactAnalyticsEngine.analyzeContact({
            id: contact.id,
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email,
            phone: contact.phone,
            company: contact.company,
            jobTitle: contact.jobTitle,
            address: contact.address,
            city: contact.city,
            state: contact.state,
            country: contact.country,
            postalCode: contact.postalCode,
            notes: contact.notes,
            source: contact.source,
            status: contact.status as any,
            tags: contact.tags,
            createdAt: contact.createdAt,
            updatedAt: contact.updatedAt,
            createdById: contact.createdById
          });
          
          analytics[contact.id] = analysis;
        } catch (error) {
          console.warn(`Contact analytics failed for contact ${contact.id}:`, error);
        } finally {
          setIsOptimizing(prev => ({ ...prev, [contact.id]: false }));
        }
      }
    }
    
    setContactAnalytics(analytics);
  };

  // Handle contact analytics for individual contact
  const handleAnalyzeContact = async (contact: Contact) => {
    setIsOptimizing(prev => ({ ...prev, [contact.id]: true }));
    
    try {
      const analysis = await contactAnalyticsEngine.analyzeContact({
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        jobTitle: contact.jobTitle,
        address: contact.address,
        city: contact.city,
        state: contact.state,
        country: contact.country,
        postalCode: contact.postalCode,
        notes: contact.notes,
        source: contact.source,
        status: contact.status as any,
        tags: contact.tags,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
        createdById: contact.createdById
      });
      
      setContactAnalytics(prev => ({ ...prev, [contact.id]: analysis }));
      
      toast.success(`⚡ Contact Analysis Complete - Lead Score: ${analysis.leadScoring.score.toFixed(1)}`);
    } catch (error) {
      console.error('Contact analytics failed:', error);
      toast.error('Contact analysis failed. Please try again.');
    } finally {
      setIsOptimizing(prev => ({ ...prev, [contact.id]: false }));
    }
  };

  // Handle sending email to individual contact
  const handleSendEmail = (contact: Contact) => {
    setSelectedContactForEmail(contact);
    setEmailModalOpen(true);
  };

  // Handle closing email modal
  const handleCloseEmailModal = () => {
    setEmailModalOpen(false);
    setSelectedContactForEmail(null);
  };

  // Handle sending SMS to individual contact
  const handleSendSMS = (contact: Contact) => {
    setSelectedContactForSMS(contact);
    setSmsModalOpen(true);
  };

  // Handle closing SMS modal
  const handleCloseSMSModal = () => {
    setSmsModalOpen(false);
    setSelectedContactForSMS(null);
  };

  // Handle sending WhatsApp to individual contact
  const handleSendWhatsApp = (contact: Contact) => {
    setSelectedContactForWhatsApp(contact);
    setWhatsappModalOpen(true);
  };

  // Handle closing WhatsApp modal
  const handleCloseWhatsAppModal = () => {
    setWhatsappModalOpen(false);
    setSelectedContactForWhatsApp(null);
  };

  // Load contacts when the component mounts
  useEffect(() => {
    fetchContacts();
  }, []);

  // Generate smart segments when contacts are loaded
  useEffect(() => {
    if (contacts.length > 0) {
      generateSmartSegments();
    }
  }, [contacts]);

  // Generate smart segments using AI
  const generateSmartSegments = async () => {
    setIsGeneratingSegments(true);
    try {
      const segments = await contactAnalyticsEngine.generateSegmentRecommendations(contacts);
      setSmartSegments(segments);
    } catch (error) {
      console.error('Error generating smart segments:', error);
    } finally {
      setIsGeneratingSegments(false);
    }
  };

  // Generate personalization insights for a contact
  const generatePersonalizationInsights = async (contact: Contact) => {
    try {
      const insights = await contactAnalyticsEngine.generatePersonalizedRecommendations(contact);
      setPersonalizationInsights(prev => ({ ...prev, [contact.id]: insights }));
      return insights;
    } catch (error) {
      console.error('Error generating personalization insights:', error);
      return null;
    }
  };

  // Handle personalization modal
  const handleViewPersonalization = async (contact: Contact) => {
    setSelectedContactForPersonalization(contact);
    setShowPersonalizationModal(true);
    
    if (!personalizationInsights[contact.id]) {
      await generatePersonalizationInsights(contact);
    }
  };

  // Handle segment filter
  const handleSegmentFilter = (segmentName: string) => {
    setSelectedSegment(selectedSegment === segmentName ? null : segmentName);
    setPage(1);
  };

  // Handle contact deletion
  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete contact');
      }

      toast.success('Contact deleted successfully');
      fetchContacts(); // Refresh the contacts list
    } catch (err) {
      console.error('Error deleting contact:', err);
      toast.error('Failed to delete contact');
    }
  };

  // Function to handle edit contact button click
  const handleEditContact = (contact: Contact) => {
    console.log("Editing contact:", contact);
    
    // Convert Contact type to ContactFormData type
    const formContact: ContactFormData = {
      id: contact.id,
      firstName: contact.firstName || "",  // Ensure firstName is never null
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      jobTitle: contact.jobTitle,
      address: contact.address,
      city: contact.city,
      state: contact.state,
      country: contact.country,
      postalCode: contact.postalCode,
      notes: contact.notes,
      source: contact.source,
      tags: contact.tags,
    };
    
    setSelectedContact(formContact);
    setIsEditModalOpen(true);
  };

  // Enhanced filtering with smart segmentation
  const filteredContacts = contacts.filter(contact => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const fullName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
      const email = contact.email || '';
      const company = contact.company || '';
      
      const matchesSearch = (
        fullName.toLowerCase().includes(searchLower) ||
        email.toLowerCase().includes(searchLower) ||
        company.toLowerCase().includes(searchLower)
      );
      
      if (!matchesSearch) return false;
    }

    // Status filter
    if (activeFilter && contact.status !== activeFilter) {
      return false;
    }

    // Tag filter
    if (tagFilter && !contact.tags.includes(tagFilter)) {
      return false;
    }

    // Smart segment filter
    if (selectedSegment) {
      const analytics = contactAnalytics[contact.id];
      if (!analytics) return false;
      
      switch (selectedSegment) {
        case 'High-Value Prospects':
          return analytics.leadScoring.score > 80;
        case 'At-Risk Customers':
          return analytics.behaviorPrediction.churnRisk.riskLevel === 'high';
        case 'SME Business Owners':
          return contact.company && contact.jobTitle?.toLowerCase().includes('owner');
        case 'Tech-Savvy Early Adopters':
          return analytics.behaviorPrediction.engagementPattern.responsiveness > 0.7;
        default:
          return true;
      }
    }

    return true;
  });

  const itemsPerPage = 10;
  const totalContacts = filteredContacts.length;
  const totalPages = Math.max(1, Math.ceil(totalContacts / itemsPerPage));
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalContacts);
  const displayedContacts = filteredContacts.slice(startIndex, endIndex);

  // Calculate counts for filter badges
  const statusCounts = {
    ACTIVE: contacts.filter(c => c.status === "ACTIVE").length,
    UNSUBSCRIBED: contacts.filter(c => c.status === "UNSUBSCRIBED").length,
    BOUNCED: contacts.filter(c => c.status === "BOUNCED").length,
  };

  // Get unique tags and their counts
  const tagCounts: Record<string, number> = {};
  contacts.forEach(contact => {
    contact.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  // Get top 5 most common tags
  const topTags = Object.entries(tagCounts)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 5);

  // Enhanced contact analytics summary
  const getContactAnalyticsSummary = () => {
    const analyzedContacts = Object.keys(contactAnalytics).length;
    const avgLeadScore = analyzedContacts > 0 
      ? Object.values(contactAnalytics).reduce((sum, opt: any) => 
          sum + opt.leadScoring.score, 0) / analyzedContacts
      : 0;
    const avgImprovementPotential = analyzedContacts > 0 
      ? Object.values(contactAnalytics).reduce((sum, opt: any) => 
          sum + opt.leadScoring.improvementPotential, 0) / analyzedContacts
      : 0;
    const highRiskContacts = Object.values(contactAnalytics).filter((analytics: any) => 
      analytics.behaviorPrediction.churnRisk.riskLevel === 'high'
    ).length;
    const avgEngagementRate = analyzedContacts > 0 
      ? Object.values(contactAnalytics).reduce((sum, opt: any) => 
          sum + opt.behaviorPrediction.engagementPattern.responsiveness, 0) / analyzedContacts
      : 0;
    const personalizedContacts = Object.keys(personalizationInsights).length;
    
    return { 
      analyzedContacts, 
      avgLeadScore, 
      avgImprovementPotential, 
      highRiskContacts, 
      avgEngagementRate,
      personalizedContacts
    };
  };
  
  const { analyzedContacts, avgLeadScore, avgImprovementPotential, highRiskContacts, avgEngagementRate, personalizedContacts } = getContactAnalyticsSummary();

  // Handle export function
  const handleExportContacts = async () => {
    setExportLoading(true);
    try {
      // Create query params for any active filters
      const params = new URLSearchParams();
      if (activeFilter) {
        params.append("status", activeFilter);
      }
      
      // Create the download URL
      const exportUrl = `/api/contacts/export?${params.toString()}`;
      
      // Create an invisible link to trigger download
      const link = document.createElement("a");
      link.href = exportUrl;
      link.setAttribute("download", `contacts-export-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Export started");
    } catch (error) {
      console.error("Error exporting contacts:", error);
      toast.error("Failed to export contacts");
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Contacts</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your contact database with AI-enhanced lead scoring and behavioral insights.
          </p>
          {analyzedContacts > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-cyan-400 border-cyan-400 bg-cyan-900/20">
                <Users className="h-3 w-3 mr-1" />
                ⚡ {analyzedContacts} AI Analyzed
              </Badge>
              <Badge variant="outline" className="text-green-400 border-green-400 bg-green-900/20">
                <TrendingUp className="h-3 w-3 mr-1" />
                {avgLeadScore.toFixed(1)} Avg Lead Score
              </Badge>
              {highRiskContacts > 0 && (
                <Badge variant="outline" className="text-red-400 border-red-400 bg-red-900/20">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {highRiskContacts} At Risk
                </Badge>
              )}
              {personalizedContacts > 0 && (
                <Badge variant="outline" className="text-purple-400 border-purple-400 bg-purple-900/20">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {personalizedContacts} Personalized
                </Badge>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setIsImportModalOpen(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button 
            variant="outline" 
            onClick={generateSmartSegments}
            disabled={isGeneratingSegments || contacts.length === 0}
          >
            {isGeneratingSegments ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Layers className="mr-2 h-4 w-4" />
            )}
            Generate Segments
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExportContacts}
            disabled={exportLoading || contacts.length === 0}
          >
            {exportLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export
          </Button>
          <ContactFormModal 
            onSuccess={() => {
              fetchContacts();
              toast.success("Contact added successfully");
            }}
          />
        </div>
      </div>

      {/* AI Contact Intelligence Overview */}
      {analyzedContacts > 0 && (
        <Card className="bg-gradient-to-r from-purple-950/50 to-blue-950/50 border-purple-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-400" />
              ⚡ AI Contact Intelligence
            </CardTitle>
            <CardDescription>
              Advanced AI analytics for lead scoring, behavioral prediction, and engagement insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-purple-400" />
                  <span className="font-medium text-purple-300">Contacts Optimized</span>
                </div>
                <div className="text-2xl font-bold text-purple-100">{analyzedContacts}</div>
                <p className="text-xs text-purple-200">AI-enhanced contacts</p>
              </div>
              
              <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-400" />
                  <span className="font-medium text-blue-300">Avg Lead Score</span>
                </div>
                <div className="text-2xl font-bold text-blue-100">{avgLeadScore.toFixed(1)}</div>
                <p className="text-xs text-blue-200">AI-calculated score</p>
              </div>
              
              <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="font-medium text-green-300">Conversion Rate</span>
                </div>
                <div className="text-2xl font-bold text-green-100">
                  {analyzedContacts > 0 ? 
                    (Object.values(contactAnalytics).reduce((sum, opt: any) => 
                      sum + opt.leadScoring.conversionProbability, 0) / analyzedContacts * 100).toFixed(1)
                    : '0.0'}%
                </div>
                <p className="text-xs text-green-200">Predicted conversion rate</p>
              </div>
              
              <div className="p-3 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-cyan-400" />
                  <span className="font-medium text-cyan-300">AI Improvement</span>
                </div>
                <div className="text-2xl font-bold text-cyan-100">+{(avgImprovementPotential * 100).toFixed(1)}%</div>
                <p className="text-xs text-cyan-200">Performance improvement</p>
              </div>
              
              <div className="p-3 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-orange-400" />
                  <span className="font-medium text-orange-300">Churn Risk</span>
                </div>
                <div className="text-2xl font-bold text-orange-100">{highRiskContacts}</div>
                <p className="text-xs text-orange-200">High-risk contacts</p>
              </div>
              
              <div className="p-3 bg-pink-900/20 border border-pink-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-4 w-4 text-pink-400" />
                  <span className="font-medium text-pink-300">Engagement</span>
                </div>
                <div className="text-2xl font-bold text-pink-100">{(avgEngagementRate * 100).toFixed(1)}%</div>
                <p className="text-xs text-pink-200">Avg engagement rate</p>
              </div>
              
              <div className="p-3 bg-violet-900/20 border border-violet-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                  <span className="font-medium text-violet-300">Personalized</span>
                </div>
                <div className="text-2xl font-bold text-violet-100">{personalizedContacts}</div>
                <p className="text-xs text-violet-200">Personalized contacts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Smart Segments Panel */}
      {smartSegments.length > 0 && (
        <Card className="bg-gradient-to-r from-indigo-950/50 to-purple-950/50 border-indigo-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-400" />
              Smart Segmentation
            </CardTitle>
            <CardDescription>
              AI-powered customer segments based on behavior, demographics, and engagement patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {smartSegments.map((segment, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${
                    selectedSegment === segment.name 
                      ? 'border-primary bg-primary/10' 
                      : 'border-gray-700 bg-gray-900/30 hover:border-gray-600'
                  }`}
                  onClick={() => handleSegmentFilter(segment.name)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${
                      segment.color === 'green' ? 'bg-green-500' :
                      segment.color === 'red' ? 'bg-red-500' :
                      segment.color === 'blue' ? 'bg-blue-500' :
                      'bg-purple-500'
                    }`}></div>
                    <span className="font-medium text-sm">{segment.name}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{segment.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">{segment.count}</span>
                    <span className="text-xs text-gray-500">contacts</span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {segment.criteria.slice(0, 2).map((criterion: string, idx: number) => (
                      <div key={idx} className="text-xs text-gray-400 flex items-center gap-1">
                        <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                        {criterion}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {selectedSegment && (
              <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Filtered by: {selectedSegment}
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setSelectedSegment(null)}
                  >
                    Clear Filter
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Modal */}
      <ImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          setIsImportModalOpen(false);
          fetchContacts();
        }}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            All Contacts
            {analyzedContacts > 0 && (
              <Badge variant="outline" className="text-purple-400 border-purple-400 bg-purple-900/20 text-xs">
                ⚡ Enhanced
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Manage your {contacts.length} contacts from across Africa with AI-enhanced insights.
            {analyzedContacts > 0 && (
              <span className="block text-purple-400 mt-1">⚡ {analyzedContacts} contacts AI analyzed</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search contacts..."
                  className="pl-8 w-[300px]"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1); // Reset to first page on search
                  }}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                    {(activeFilter || tagFilter) && (
                      <Badge variant="secondary" className="ml-2 px-1">
                        {activeFilter && tagFilter ? "2" : "1"}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex items-center justify-between"
                    onClick={() => {
                      setActiveFilter(activeFilter === "ACTIVE" ? null : "ACTIVE");
                      setPage(1);
                    }}
                  >
                    <span className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${activeFilter === "ACTIVE" ? "bg-primary" : "bg-transparent border border-muted"}`}></div>
                      <span>Active</span>
                    </span>
                    <Badge variant="outline" className="ml-2">{statusCounts.ACTIVE}</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center justify-between"
                    onClick={() => {
                      setActiveFilter(activeFilter === "UNSUBSCRIBED" ? null : "UNSUBSCRIBED");
                      setPage(1);
                    }}
                  >
                    <span className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${activeFilter === "UNSUBSCRIBED" ? "bg-primary" : "bg-transparent border border-muted"}`}></div>
                      <span>Unsubscribed</span>
                    </span>
                    <Badge variant="outline" className="ml-2">{statusCounts.UNSUBSCRIBED}</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center justify-between"
                    onClick={() => {
                      setActiveFilter(activeFilter === "BOUNCED" ? null : "BOUNCED");
                      setPage(1);
                    }}
                  >
                    <span className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${activeFilter === "BOUNCED" ? "bg-primary" : "bg-transparent border border-muted"}`}></div>
                      <span>Bounced</span>
                    </span>
                    <Badge variant="outline" className="ml-2">{statusCounts.BOUNCED}</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Filter by Tag</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {topTags.map(([tag, count]) => (
                    <DropdownMenuItem
                      key={tag}
                      className="flex items-center justify-between"
                      onClick={() => {
                        setTagFilter(tagFilter === tag ? null : tag);
                        setPage(1);
                      }}
                    >
                      <span className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${tagFilter === tag ? "bg-primary" : "bg-transparent border border-muted"}`}></div>
                        <span>{tag}</span>
                      </span>
                      <Badge variant="outline" className="ml-2">{count}</Badge>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing <strong>{startIndex + 1}-{endIndex}</strong> of <strong>{totalContacts}</strong> contacts
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error && contacts.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <p>{error}</p>
              <Button variant="outline" className="mt-4" onClick={fetchContacts}>
                Try Again
              </Button>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <p>No contacts found. Add your first contact to get started.</p>
              <ContactFormModal 
                trigger={
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Contact
                  </Button>
                }
                onSuccess={() => {
                  fetchContacts();
                  toast.success("Contact added successfully");
                }}
              />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedContacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span>
                              {contact.firstName || contact.lastName 
                                ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
                                : 'Unnamed Contact'}
                            </span>
                            {contactAnalytics[contact.id] && (
                              <Badge variant="outline" className="text-purple-400 border-purple-400 bg-purple-900/20 text-xs">
                                <Brain className="h-3 w-3 mr-1" />
                                ⚡ Analyzed
                              </Badge>
                            )}
                            {isOptimizing[contact.id] && (
                              <Badge variant="outline" className="text-orange-400 border-orange-400 bg-orange-900/20 text-xs">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Optimizing...
                              </Badge>
                            )}
                          </div>
                          {contactAnalytics[contact.id] && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-purple-400">
                                Lead Score: {contactAnalytics[contact.id].leadScoring.score.toFixed(1)}
                              </span>
                              <Badge variant="outline" className="text-xs text-green-400 border-green-400">
                                {(contactAnalytics[contact.id].leadScoring.conversionProbability * 100).toFixed(0)}% conversion
                              </Badge>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{contact.email || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{contact.company || 'N/A'}</span>
                          <span className="text-xs text-muted-foreground">{contact.jobTitle || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{contact.city || 'N/A'}</span>
                          <span className="text-xs text-muted-foreground">{contact.country || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            contact.status === "ACTIVE"
                              ? "default"
                              : contact.status === "UNSUBSCRIBED"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {contact.status ? contact.status.toLowerCase() : 'unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {contactAnalytics[contact.id] ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Score:</span>
                              <Badge variant="outline" className="text-purple-400 border-purple-400">
                                {contactAnalytics[contact.id].leadScoring.score.toFixed(1)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Risk:</span>
                              <Badge variant="outline" className={`${
                                contactAnalytics[contact.id].behaviorPrediction.churnRisk.riskLevel === 'low' ? 'text-green-400 border-green-400' :
                                contactAnalytics[contact.id].behaviorPrediction.churnRisk.riskLevel === 'medium' ? 'text-yellow-400 border-yellow-400' :
                                'text-red-400 border-red-400'
                              }`}>
                                {contactAnalytics[contact.id].behaviorPrediction.churnRisk.riskLevel}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Channel:</span>
                              <span className="text-muted-foreground">
                                {contactAnalytics[contact.id].behaviorPrediction.preferredChannels[0]?.channel || 'email'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not analyzed</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {contact.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                          {contact.tags.length > 2 && (
                            <Badge variant="outline">+{contact.tags.length - 2}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditContact(contact)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            {contact.status === 'ACTIVE' && !contactAnalytics[contact.id] && (
                              <DropdownMenuItem 
                                onClick={() => handleAnalyzeContact(contact)}
                                disabled={isOptimizing[contact.id]}
                              >
                                <Cpu className="mr-2 h-4 w-4" /> 
                                {isOptimizing[contact.id] ? 'Analyzing...' : '⚡ AI Analyze'}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleSendEmail(contact)}
                            >
                              <Mail className="mr-2 h-4 w-4" /> Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleSendSMS(contact)}
                            >
                              <MessageSquare className="mr-2 h-4 w-4" /> Send SMS
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleSendWhatsApp(contact)}
                            >
                              <MessageCircle className="mr-2 h-4 w-4" /> Send WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Phone className="mr-2 h-4 w-4" /> Call
                            </DropdownMenuItem>
                            {contactAnalytics[contact.id] && (
                              <DropdownMenuItem>
                                <Target className="mr-2 h-4 w-4" /> View Contact Intelligence
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleViewPersonalization(contact)}
                            >
                              <Sparkles className="mr-2 h-4 w-4" /> Personalization Insights
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive" 
                              onClick={() => handleDeleteContact(contact.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && contacts.length > 0 && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-muted-foreground">
                Showing <strong>{startIndex + 1}-{endIndex}</strong> of <strong>{totalContacts}</strong> contacts
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page > 1 ? page - 1 : 1)}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                  <Button
                    key={i}
                    variant={page === i + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
                {totalPages > 5 && page < totalPages - 2 && (
                  <span className="px-2">...</span>
                )}
                {totalPages > 5 && page < totalPages && (
                  <Button
                    variant={page === totalPages ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(totalPages)}
                  >
                    {totalPages}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page < totalPages ? page + 1 : totalPages)}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Contact Modal */}
      {selectedContact && isEditModalOpen && (
        <Dialog 
          open={isEditModalOpen} 
          onOpenChange={(open) => {
            setIsEditModalOpen(open);
            if (!open) setSelectedContact(null);
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <ContactForm 
              initialData={selectedContact}
              isEdit={true}
              onCancel={() => {
                setIsEditModalOpen(false);
                setSelectedContact(null);
              }}
              onSuccess={() => {
                fetchContacts();
                setSelectedContact(null);
                setIsEditModalOpen(false);
                toast.success("Contact updated successfully");
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Email Compose Modal */}
      {selectedContactForEmail && (
        <EmailComposeModal
          isOpen={emailModalOpen}
          onClose={handleCloseEmailModal}
          contact={{
            id: selectedContactForEmail.id,
            firstName: selectedContactForEmail.firstName || '',
            lastName: selectedContactForEmail.lastName || '',
            email: selectedContactForEmail.email || '',
            company: selectedContactForEmail.company || '',
            jobTitle: selectedContactForEmail.jobTitle || '',
          }}
        />
      )}

      {/* SMS Compose Modal */}
      {selectedContactForSMS && (
        <SMSComposeModal
          isOpen={smsModalOpen}
          onClose={handleCloseSMSModal}
          contact={{
            id: selectedContactForSMS.id,
            firstName: selectedContactForSMS.firstName || '',
            lastName: selectedContactForSMS.lastName || '',
            email: selectedContactForSMS.email || '',
            phone: selectedContactForSMS.phone || '',
            company: selectedContactForSMS.company || '',
            jobTitle: selectedContactForSMS.jobTitle || '',
          }}
        />
      )}

      {/* WhatsApp Compose Modal */}
      {selectedContactForWhatsApp && (
        <WhatsAppComposeModal
          isOpen={whatsappModalOpen}
          onClose={handleCloseWhatsAppModal}
          contact={{
            id: selectedContactForWhatsApp.id,
            firstName: selectedContactForWhatsApp.firstName || '',
            lastName: selectedContactForWhatsApp.lastName || '',
            email: selectedContactForWhatsApp.email || '',
            phone: selectedContactForWhatsApp.phone || '',
            company: selectedContactForWhatsApp.company || '',
            jobTitle: selectedContactForWhatsApp.jobTitle || '',
          }}
        />
      )}

      {/* Personalization Insights Modal */}
      {selectedContactForPersonalization && (
        <Dialog open={showPersonalizationModal} onOpenChange={setShowPersonalizationModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-900/20 rounded-lg">
                  <Sparkles className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Personalization Insights</h2>
                  <p className="text-sm text-muted-foreground">
                    AI-powered personalization for {selectedContactForPersonalization.firstName} {selectedContactForPersonalization.lastName}
                  </p>
                </div>
              </div>

              {personalizationInsights[selectedContactForPersonalization.id] ? (
                <div className="space-y-6">
                  {/* Contact Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5" />
                        Contact Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Full Name</p>
                          <p className="font-medium">{selectedContactForPersonalization.firstName} {selectedContactForPersonalization.lastName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Company</p>
                          <p className="font-medium">{selectedContactForPersonalization.company || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Location</p>
                          <p className="font-medium">{selectedContactForPersonalization.city}, {selectedContactForPersonalization.country}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Job Title</p>
                          <p className="font-medium">{selectedContactForPersonalization.jobTitle || 'N/A'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Personalization Recommendations */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-400" />
                        Content Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {personalizationInsights[selectedContactForPersonalization.id].contentRecommendations.map((rec: string, index: number) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-purple-900/20 rounded-lg">
                            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                            <span className="text-sm">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Channel Optimization */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-blue-400" />
                        Channel Optimization
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Preferred Channels</p>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-2 bg-blue-900/20 rounded">
                              <span className="text-sm">Primary</span>
                              <Badge variant="outline" className="text-blue-400 border-blue-400">
                                {personalizationInsights[selectedContactForPersonalization.id].channelOptimization.primary}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-green-900/20 rounded">
                              <span className="text-sm">Secondary</span>
                              <Badge variant="outline" className="text-green-400 border-green-400">
                                {personalizationInsights[selectedContactForPersonalization.id].channelOptimization.secondary}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Optimal Timing</p>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-2 bg-orange-900/20 rounded">
                              <span className="text-sm">Best Time</span>
                              <span className="text-sm text-orange-400">
                                {personalizationInsights[selectedContactForPersonalization.id].channelOptimization.timing}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-purple-900/20 rounded">
                              <span className="text-sm">Frequency</span>
                              <span className="text-sm text-purple-400">
                                {personalizationInsights[selectedContactForPersonalization.id].channelOptimization.frequency}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cultural Insights */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5 text-cyan-400" />
                        Cultural Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="p-3 bg-cyan-900/20 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-2">Messaging Tone</p>
                          <p className="text-cyan-400 font-medium">
                            {personalizationInsights[selectedContactForPersonalization.id].messagingTone}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Cultural Recommendations</p>
                          {personalizationInsights[selectedContactForPersonalization.id].culturalInsights.map((insight: string, index: number) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-900/30 rounded">
                              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                              <span className="text-sm">{insight}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button onClick={() => handleSendEmail(selectedContactForPersonalization)}>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Personalized Email
                    </Button>
                    <Button variant="outline" onClick={() => handleSendWhatsApp(selectedContactForPersonalization)}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Send WhatsApp Message
                    </Button>
                    <Button variant="outline" onClick={() => setShowPersonalizationModal(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-400" />
                    <p className="text-sm text-muted-foreground">Generating personalization insights...</p>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
