"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Copy,
  ExternalLink,
  Trash2,
  Edit,
  Mail,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

// Sample data for email templates
const templates = [
  {
    id: "1",
    name: "Welcome Email",
    category: "Onboarding",
    status: "ACTIVE",
    lastModified: "2023-04-15",
    createdBy: "Admin",
  },
  {
    id: "2",
    name: "Monthly Newsletter",
    category: "Newsletter",
    status: "ACTIVE",
    lastModified: "2023-04-20",
    createdBy: "Admin",
  },
  {
    id: "3",
    name: "Product Announcement",
    category: "Marketing",
    status: "DRAFT",
    lastModified: "2023-04-22",
    createdBy: "Marketing Team",
  },
  {
    id: "4",
    name: "Abandoned Cart Reminder",
    category: "Sales",
    status: "ACTIVE",
    lastModified: "2023-04-10",
    createdBy: "Admin",
  },
  {
    id: "5",
    name: "Event Registration Confirmation",
    category: "Events",
    status: "ACTIVE",
    lastModified: "2023-04-05",
    createdBy: "Events Team",
  },
  {
    id: "6",
    name: "Customer Feedback Request",
    category: "Feedback",
    status: "DRAFT",
    lastModified: "2023-04-18",
    createdBy: "Customer Success",
  },
];

export default function EmailTemplatesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Calculate unique categories and their counts
  const categories: Record<string, number> = {};
  templates.forEach((template) => {
    categories[template.category] = (categories[template.category] || 0) + 1;
  });

  // Calculate status counts
  const statusCounts = {
    ACTIVE: templates.filter((t) => t.status === "ACTIVE").length,
    DRAFT: templates.filter((t) => t.status === "DRAFT").length,
  };

  // Filter templates based on search query and filters
  const filteredTemplates = templates.filter((template) => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      if (!template.name.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Category filter
    if (categoryFilter && template.category !== categoryFilter) {
      return false;
    }

    // Status filter
    if (statusFilter && template.status !== statusFilter) {
      return false;
    }

    return true;
  });

  const handleCreateTemplate = () => {
    router.push("/email/templates/editor");
  };

  const handleEditTemplate = (id: string) => {
    router.push(`/email/templates/editor?id=${id}`);
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Email Templates</h2>
        <Button onClick={handleCreateTemplate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Templates</CardTitle>
          <CardDescription>
            Create and manage your email templates for campaigns.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search templates..."
                  className="pl-8 w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                    {(categoryFilter || statusFilter) && (
                      <Badge variant="secondary" className="ml-2 px-1">
                        {categoryFilter && statusFilter ? "2" : "1"}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {Object.entries(categories).map(([category, count]) => (
                    <DropdownMenuItem
                      key={category}
                      className="flex items-center justify-between"
                      onClick={() => setCategoryFilter(categoryFilter === category ? null : category)}
                    >
                      <span className="flex items-center space-x-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            categoryFilter === category
                              ? "bg-primary"
                              : "bg-transparent border border-muted"
                          }`}
                        ></div>
                        <span>{category}</span>
                      </span>
                      <Badge variant="outline" className="ml-2">
                        {count}
                      </Badge>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex items-center justify-between"
                    onClick={() =>
                      setStatusFilter(statusFilter === "ACTIVE" ? null : "ACTIVE")
                    }
                  >
                    <span className="flex items-center space-x-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          statusFilter === "ACTIVE"
                            ? "bg-primary"
                            : "bg-transparent border border-muted"
                        }`}
                      ></div>
                      <span>Active</span>
                    </span>
                    <Badge variant="outline" className="ml-2">
                      {statusCounts.ACTIVE}
                    </Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center justify-between"
                    onClick={() =>
                      setStatusFilter(statusFilter === "DRAFT" ? null : "DRAFT")
                    }
                  >
                    <span className="flex items-center space-x-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          statusFilter === "DRAFT"
                            ? "bg-primary"
                            : "bg-transparent border border-muted"
                        }`}
                      ></div>
                      <span>Draft</span>
                    </span>
                    <Badge variant="outline" className="ml-2">
                      {statusCounts.DRAFT}
                    </Badge>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing <strong>{filteredTemplates.length}</strong> of{" "}
              <strong>{templates.length}</strong> templates
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">
                      {template.name}
                    </TableCell>
                    <TableCell>{template.category}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          template.status === "ACTIVE"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {template.status.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{template.lastModified}</TableCell>
                    <TableCell>{template.createdBy}</TableCell>
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
                          <DropdownMenuItem onClick={() => handleEditTemplate(template.id)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" /> Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="mr-2 h-4 w-4" /> Send Test
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" /> Duplicate
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
        </CardContent>
      </Card>
    </div>
  );
}
