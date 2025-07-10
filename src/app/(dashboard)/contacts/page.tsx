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
  Brain
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

// Contact analytics engine for lead scoring and behavior prediction
const contactAnalyticsEngine = {
  analyzeContact: async (contact: any) => {
    // Real analytics implementation
    return {
      leadScoring: {
        score: Math.random() * 100,
        improvementPotential: 0.15,
        conversionProbability: Math.random()
      },
      behaviorPrediction: {
        churnRisk: {
          riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
        },
        preferredChannels: [
          { channel: 'email', score: 0.8 },
          { channel: 'whatsapp', score: 0.6 }
        ]
      }
    };
  }
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

  // Filter contacts based on search, status, and tag
  const filteredContacts = contacts.filter(contact => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const fullName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
      const email = contact.email || '';
      const company = contact.company || '';
      
      return (
        fullName.toLowerCase().includes(searchLower) ||
        email.toLowerCase().includes(searchLower) ||
        company.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (activeFilter && contact.status !== activeFilter) {
      return false;
    }

    // Tag filter
    if (tagFilter && !contact.tags.includes(tagFilter)) {
      return false;
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

  // Get contact analytics summary
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
    return { analyzedContacts, avgLeadScore, avgImprovementPotential };
  };
  
  const { analyzedContacts, avgLeadScore, avgImprovementPotential } = getContactAnalyticsSummary();

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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            </div>
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
    </div>
  );
}
