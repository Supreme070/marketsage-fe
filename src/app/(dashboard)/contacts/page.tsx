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
  Phone
} from "lucide-react";
import { SampleContact } from "@/data/sampleContacts";

// Enhance the sample contacts with the properties needed for the UI
const enhanceContacts = (contacts: SampleContact[]) => {
  return contacts.map((contact, index) => ({
    ...contact,
    id: index.toString(), // Add unique ID for React keys
    name: contact.firstName && contact.lastName 
      ? `${contact.firstName} ${contact.lastName}` 
      : contact.company || 'Unknown',
    position: contact.jobTitle || '',
    // Generate a random status for demo purposes
    status: ["ACTIVE", "UNSUBSCRIBED", "BOUNCED"][Math.floor(Math.random() * 3)],
    // Ensure tags is an array
    tags: contact.tags || [],
    // Handle location data structure
    location: {
      city: contact.city || '',
      country: contact.country || ''
    }
  }));
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<(SampleContact & {
    id: string;
    name: string;
    status: string;
    position?: string;
    location?: { city: string; country: string };
  })[]>([]);
  
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  // Load contacts on the client side
  useEffect(() => {
    import('@/data/sampleContacts').then(module => {
      const enhancedContacts = enhanceContacts(module.allAfricanContacts);
      setContacts(enhancedContacts);
    });
  }, []);

  const itemsPerPage = 10;
  const filteredContacts = contacts.filter(contact => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const name = contact.name || '';
      const email = contact.email || '';
      const company = contact.company || '';
      
      return (
        name.toLowerCase().includes(searchLower) ||
        email.toLowerCase().includes(searchLower) ||
        company.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (activeFilter && contact.status !== activeFilter) {
      return false;
    }

    // Tag filter
    if (tagFilter && !(contact.tags || []).includes(tagFilter)) {
      return false;
    }

    return true;
  });

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
    (contact.tags || []).forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  // Get top 5 most common tags
  const topTags = Object.entries(tagCounts)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 5);

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Contacts</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Contacts</CardTitle>
          <CardDescription>
            Manage your {contacts.length} contacts from across Africa.
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

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">{contact.name || 'Unknown'}</TableCell>
                    <TableCell>{contact.email || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{contact.company || 'N/A'}</span>
                        <span className="text-xs text-muted-foreground">{contact.position || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{contact.location?.city || contact.city || 'N/A'}</span>
                        <span className="text-xs text-muted-foreground">{contact.location?.country || contact.country || 'N/A'}</span>
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
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(contact.tags) && contact.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                        {Array.isArray(contact.tags) && contact.tags.length > 2 && (
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
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="mr-2 h-4 w-4" /> Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MessageSquare className="mr-2 h-4 w-4" /> Send SMS
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Phone className="mr-2 h-4 w-4" /> Call
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
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
        </CardContent>
      </Card>
    </div>
  );
}
