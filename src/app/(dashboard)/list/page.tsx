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
  Share2
} from "lucide-react";

// Sample list data
const sampleLists = [
  {
    id: "1",
    name: "Nigerian Prospects",
    contacts: 158,
    status: "ACTIVE",
    tags: ["prospects", "nigeria"],
    lastUpdated: "2024-05-05T10:30:00Z",
    description: "Potential customers from Nigeria",
    owner: "John Doe"
  },
  {
    id: "2",
    name: "Kenya Newsletter",
    contacts: 432,
    status: "ACTIVE",
    tags: ["newsletter", "kenya"],
    lastUpdated: "2024-05-04T14:20:00Z",
    description: "Newsletter subscribers from Kenya",
    owner: "Jane Smith"
  },
  {
    id: "3",
    name: "Ghana High-Value",
    contacts: 67,
    status: "ACTIVE",
    tags: ["highvalue", "ghana"],
    lastUpdated: "2024-05-03T09:15:00Z",
    description: "High-value leads from Ghana",
    owner: "John Doe"
  },
  {
    id: "4",
    name: "Unsubscribed",
    contacts: 211,
    status: "INACTIVE",
    tags: ["unsubscribed"],
    lastUpdated: "2024-05-02T16:45:00Z",
    description: "Contacts who have unsubscribed",
    owner: "System"
  },
  {
    id: "5",
    name: "South Africa Businesses",
    contacts: 304,
    status: "ACTIVE",
    tags: ["business", "southafrica"],
    lastUpdated: "2024-05-01T11:10:00Z",
    description: "Business contacts from South Africa",
    owner: "Jane Smith"
  },
  {
    id: "6",
    name: "Event Attendees - Lagos Conference",
    contacts: 89,
    status: "ACTIVE",
    tags: ["event", "lagos", "conference"],
    lastUpdated: "2024-04-30T15:30:00Z",
    description: "Attendees from Lagos Tech Conference 2024",
    owner: "John Doe"
  },
  {
    id: "7",
    name: "Bounced Emails",
    contacts: 43,
    status: "INACTIVE",
    tags: ["bounced", "cleanup"],
    lastUpdated: "2024-04-29T10:20:00Z",
    description: "Contacts with bounced email addresses",
    owner: "System"
  },
  {
    id: "8",
    name: "Egypt Prospects",
    contacts: 127,
    status: "ACTIVE", 
    tags: ["prospects", "egypt"],
    lastUpdated: "2024-04-28T13:40:00Z",
    description: "Potential customers from Egypt",
    owner: "Jane Smith"
  }
];

export default function ListsPage() {
  const [lists] = useState(sampleLists);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const itemsPerPage = 5;
  const filteredLists = lists.filter(list => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        list.name.toLowerCase().includes(searchLower) ||
        list.description.toLowerCase().includes(searchLower) ||
        list.owner.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter && list.status !== statusFilter) {
      return false;
    }

    // Tag filter
    if (tagFilter && !list.tags.includes(tagFilter)) {
      return false;
    }

    return true;
  });

  const totalLists = filteredLists.length;
  const totalPages = Math.max(1, Math.ceil(totalLists / itemsPerPage));
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalLists);
  const displayedLists = filteredLists.slice(startIndex, endIndex);

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get unique tags and their counts
  const tagCounts: Record<string, number> = {};
  lists.forEach(list => {
    list.tags.forEach(tag => {
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
        <h2 className="text-3xl font-bold tracking-tight">Lists</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create List
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Lists</CardTitle>
          <CardDescription>
            Manage your contact lists for campaigns and automations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search lists..."
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
                    {(statusFilter || tagFilter) && (
                      <Badge variant="secondary" className="ml-2 px-1">
                        {statusFilter && tagFilter ? "2" : "1"}
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
                      setStatusFilter(statusFilter === "ACTIVE" ? null : "ACTIVE");
                      setPage(1);
                    }}
                  >
                    <span className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${statusFilter === "ACTIVE" ? "bg-primary" : "bg-transparent border border-muted"}`}></div>
                      <span>Active</span>
                    </span>
                    <Badge variant="outline" className="ml-2">{lists.filter(l => l.status === "ACTIVE").length}</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center justify-between"
                    onClick={() => {
                      setStatusFilter(statusFilter === "INACTIVE" ? null : "INACTIVE");
                      setPage(1);
                    }}
                  >
                    <span className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${statusFilter === "INACTIVE" ? "bg-primary" : "bg-transparent border border-muted"}`}></div>
                      <span>Inactive</span>
                    </span>
                    <Badge variant="outline" className="ml-2">{lists.filter(l => l.status === "INACTIVE").length}</Badge>
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
              Showing <strong>{startIndex + 1}-{endIndex}</strong> of <strong>{totalLists}</strong> lists
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contacts</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedLists.map((list) => (
                  <TableRow key={list.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{list.name}</span>
                        <span className="text-xs text-muted-foreground">{list.description}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                        {list.contacts.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={list.status === "ACTIVE" ? "default" : "secondary"}
                      >
                        {list.status.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(list.lastUpdated)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {list.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                        {list.tags.length > 2 && (
                          <Badge variant="outline">+{list.tags.length - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{list.owner}</TableCell>
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
                            <Share2 className="mr-2 h-4 w-4" /> Share
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
              Showing <strong>{startIndex + 1}-{endIndex}</strong> of <strong>{totalLists}</strong> lists
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