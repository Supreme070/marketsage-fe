"use client";

import { useState } from "react";
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
  Edit,
  Trash2,
  Users,
  Mail,
  Copy,
  FileText,
  PieChart
} from "lucide-react";

// Sample segment data
const sampleSegments = [
  {
    id: "1",
    name: "High Engagement",
    contacts: 243,
    criteria: [
      { field: "emailOpenRate", operator: ">", value: "30%" },
      { field: "clickRate", operator: ">", value: "10%" }
    ],
    lastUpdated: "2024-05-05T12:30:00Z",
    description: "Contacts with high email engagement",
    category: "Engagement"
  },
  {
    id: "2",
    name: "New Subscribers",
    contacts: 156,
    criteria: [
      { field: "dateAdded", operator: ">", value: "Last 30 days" }
    ],
    lastUpdated: "2024-05-04T09:15:00Z",
    description: "Contacts added in the last 30 days",
    category: "Lifecycle"
  },
  {
    id: "3",
    name: "Nigeria - Lagos",
    contacts: 342,
    criteria: [
      { field: "country", operator: "=", value: "Nigeria" },
      { field: "city", operator: "=", value: "Lagos" }
    ],
    lastUpdated: "2024-05-03T14:20:00Z",
    description: "Contacts from Lagos, Nigeria",
    category: "Location"
  },
  {
    id: "4",
    name: "Enterprise Customers",
    contacts: 87,
    criteria: [
      { field: "companySize", operator: ">", value: "250" },
      { field: "industry", operator: "IN", value: "Finance, Technology, Manufacturing" }
    ],
    lastUpdated: "2024-05-02T11:10:00Z",
    description: "Large enterprise customers",
    category: "Business"
  },
  {
    id: "5",
    name: "Cart Abandoners",
    contacts: 128,
    criteria: [
      { field: "event", operator: "=", value: "cart_abandoned" },
      { field: "eventDate", operator: ">", value: "Last 7 days" }
    ],
    lastUpdated: "2024-05-01T16:45:00Z",
    description: "Contacts who abandoned their cart recently",
    category: "Behavior"
  },
  {
    id: "6",
    name: "Cold Leads",
    contacts: 294,
    criteria: [
      { field: "lastEngagement", operator: "<", value: "90 days" },
      { field: "tags", operator: "CONTAINS", value: "lead" }
    ],
    lastUpdated: "2024-04-30T10:30:00Z",
    description: "Leads with no engagement in 90+ days",
    category: "Engagement"
  },
  {
    id: "7",
    name: "High-Value Prospects",
    contacts: 76,
    criteria: [
      { field: "leadScore", operator: ">", value: "80" },
      { field: "stage", operator: "=", value: "Prospect" }
    ],
    lastUpdated: "2024-04-29T13:25:00Z",
    description: "High-scoring prospects likely to convert",
    category: "Scoring"
  },
  {
    id: "8",
    name: "South African Retail",
    contacts: 109,
    criteria: [
      { field: "country", operator: "=", value: "South Africa" },
      { field: "industry", operator: "=", value: "Retail" }
    ],
    lastUpdated: "2024-04-28T15:15:00Z",
    description: "Retail industry contacts in South Africa",
    category: "Industry"
  }
];

// Categories for filtering
const categories = [
  "Engagement",
  "Lifecycle",
  "Location",
  "Business",
  "Behavior",
  "Scoring",
  "Industry"
];

export default function SegmentsPage() {
  const [segments] = useState(sampleSegments);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const itemsPerPage = 5;
  const filteredSegments = segments.filter(segment => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        segment.name.toLowerCase().includes(searchLower) ||
        segment.description.toLowerCase().includes(searchLower) ||
        segment.criteria.some(c => 
          c.field.toLowerCase().includes(searchLower) || 
          c.value.toLowerCase().includes(searchLower)
        )
      );
    }

    // Category filter
    if (categoryFilter && segment.category !== categoryFilter) {
      return false;
    }

    return true;
  });

  const totalSegments = filteredSegments.length;
  const totalPages = Math.max(1, Math.ceil(totalSegments / itemsPerPage));
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalSegments);
  const displayedSegments = filteredSegments.slice(startIndex, endIndex);

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Helper function to format criteria into readable text
  const formatCriteria = (criteria: Array<{ field: string, operator: string, value: string }>) => {
    return criteria.map(c => {
      let operator = c.operator;
      switch(operator) {
        case '>': operator = 'greater than'; break;
        case '<': operator = 'less than'; break;
        case '=': operator = 'is'; break;
        case 'CONTAINS': operator = 'contains'; break;
        case 'IN': operator = 'in'; break;
        default: break;
      }
      return `${c.field} ${operator} ${c.value}`;
    }).join(' AND ');
  };

  // Count segments by category
  const categoryCounts: Record<string, number> = {};
  segments.forEach(segment => {
    categoryCounts[segment.category] = (categoryCounts[segment.category] || 0) + 1;
  });

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Segments</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Segment
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Segments</CardTitle>
          <CardDescription>
            Create dynamic segments based on contact properties and behaviors.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search segments..."
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
                    {categoryFilter && (
                      <Badge variant="secondary" className="ml-2 px-1">1</Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category}
                      className="flex items-center justify-between"
                      onClick={() => {
                        setCategoryFilter(categoryFilter === category ? null : category);
                        setPage(1);
                      }}
                    >
                      <span className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${categoryFilter === category ? "bg-primary" : "bg-transparent border border-muted"}`}></div>
                        <span>{category}</span>
                      </span>
                      <Badge variant="outline" className="ml-2">{categoryCounts[category] || 0}</Badge>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing <strong>{startIndex + 1}-{endIndex}</strong> of <strong>{totalSegments}</strong> segments
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contacts</TableHead>
                  <TableHead>Criteria</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedSegments.map((segment) => (
                  <TableRow key={segment.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{segment.name}</span>
                        <span className="text-xs text-muted-foreground">{segment.description}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                        {segment.contacts.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <div className="text-sm truncate" title={formatCriteria(segment.criteria)}>
                        {formatCriteria(segment.criteria)}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(segment.lastUpdated)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{segment.category}</Badge>
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
                            <Mail className="mr-2 h-4 w-4" /> Send Campaign
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" /> Create List
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" /> Export
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <PieChart className="mr-2 h-4 w-4" /> View Stats
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
              Showing <strong>{startIndex + 1}-{endIndex}</strong> of <strong>{totalSegments}</strong> segments
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