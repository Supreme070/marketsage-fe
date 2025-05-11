"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
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
  PieChart,
  Loader2
} from "lucide-react";

// Define segment types
interface Segment {
  id: string;
  name: string;
  description?: string;
  rules: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
}

interface Rule {
  field: string;
  operator: string;
  value: string;
}

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
  const [segments, setSegments] = useState<Segment[]>([]);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [newSegment, setNewSegment] = useState({
    name: "",
    description: "",
    rules: JSON.stringify([{ field: "", operator: "=", value: "" }], null, 2)
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    rules: ""
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  
  // Fetch segments
  useEffect(() => {
    async function fetchSegments() {
      try {
        setLoading(true);
        const response = await fetch('/api/segments');
        if (!response.ok) {
          throw new Error('Failed to fetch segments');
        }
        const data = await response.json();
        setSegments(data);
      } catch (error) {
        console.error('Error fetching segments:', error);
        toast({
          title: "Error",
          description: "Failed to load segments. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchSegments();
  }, []);
  
  // Handle creating a new segment
  const handleCreateSegment = async () => {
    try {
      // Validate rules JSON
      try {
        JSON.parse(newSegment.rules);
      } catch (e) {
        toast({
          title: "Invalid Rules",
          description: "The rules must be a valid JSON array",
          variant: "destructive",
        });
        return;
      }
      
      setCreating(true);
      const response = await fetch('/api/segments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newSegment.name,
          description: newSegment.description,
          rules: newSegment.rules
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create segment');
      }

      const createdSegment = await response.json();
      
      // Add the new segment to the state
      setSegments(prev => [createdSegment, ...prev]);
      
      // Reset form and close modal
      setNewSegment({
        name: "",
        description: "",
        rules: JSON.stringify([{ field: "", operator: "=", value: "" }], null, 2)
      });
      setCreateModalOpen(false);
      
      toast({
        title: "Success",
        description: "Segment created successfully",
      });
    } catch (error) {
      console.error('Error creating segment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create segment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };
  
  // Handle editing a segment
  const handleEditSegment = async () => {
    if (!selectedSegment) return;
    
    try {
      // Validate rules JSON
      try {
        JSON.parse(editFormData.rules);
      } catch (e) {
        toast({
          title: "Invalid Rules",
          description: "The rules must be a valid JSON array",
          variant: "destructive",
        });
        return;
      }
      
      setUpdating(true);
      const response = await fetch(`/api/segments/${selectedSegment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update segment');
      }

      const updatedSegment = await response.json();
      
      // Update the segment in state
      setSegments(prev => prev.map(segment => 
        segment.id === updatedSegment.id ? updatedSegment : segment
      ));
      
      // Reset form and close modal
      setEditModalOpen(false);
      setSelectedSegment(null);
      
      toast({
        title: "Success",
        description: "Segment updated successfully",
      });
    } catch (error) {
      console.error('Error updating segment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update segment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };
  
  // Handle deleting a segment
  const handleDeleteSegment = async () => {
    if (!selectedSegment) return;
    
    try {
      setDeleting(true);
      const response = await fetch(`/api/segments/${selectedSegment.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete segment');
      }
      
      // Remove the segment from state
      setSegments(prev => prev.filter(segment => segment.id !== selectedSegment.id));
      
      // Reset and close dialog
      setDeleteDialogOpen(false);
      setSelectedSegment(null);
      
      toast({
        title: "Success",
        description: "Segment deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting segment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete segment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };
  
  // Helper function to try parsing JSON rules
  const parseRules = (rulesJson: string): Rule[] => {
    try {
      return JSON.parse(rulesJson);
    } catch (e) {
      return [];
    }
  };

  const itemsPerPage = 5;
  const filteredSegments = segments.filter(segment => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        segment.name.toLowerCase().includes(searchLower) ||
        (segment.description?.toLowerCase().includes(searchLower) || false)
      );
    }

    // Category filter - for now, we don't have categories in our API
    if (categoryFilter) {
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
  const formatCriteria = (rulesJson: string) => {
    const rules = parseRules(rulesJson);
    if (!rules.length) return "No criteria defined";
    
    return rules.map(rule => {
      let operator = rule.operator;
      switch(operator) {
        case '>': operator = 'greater than'; break;
        case '<': operator = 'less than'; break;
        case '=': operator = 'is'; break;
        case 'CONTAINS': operator = 'contains'; break;
        case 'IN': operator = 'in'; break;
        default: break;
      }
      return `${rule.field} ${operator} ${rule.value}`;
    }).join(' AND ');
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Segments</h2>
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Segment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Segment</DialogTitle>
              <DialogDescription>
                Create a dynamic segment based on contact properties and behaviors.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Segment Name</Label>
                <Input 
                  id="name" 
                  placeholder="Enter segment name"
                  value={newSegment.name}
                  onChange={(e) => setNewSegment({...newSegment, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Enter a description for this segment"
                  value={newSegment.description}
                  onChange={(e) => setNewSegment({...newSegment, description: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rules">Segment Rules (JSON)</Label>
                <Textarea 
                  id="rules" 
                  className="font-mono text-sm h-48"
                  placeholder='Enter segment rules as JSON array'
                  value={newSegment.rules}
                  onChange={(e) => setNewSegment({...newSegment, rules: e.target.value})}
                />
                <p className="text-xs text-muted-foreground">
                  Define rules as a JSON array of objects with field, operator, and value properties.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateSegment} disabled={creating || !newSegment.name.trim()}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Segment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Segment Dialog */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Segment</DialogTitle>
            <DialogDescription>
              Update the details and rules of your segment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Segment Name</Label>
              <Input 
                id="edit-name" 
                placeholder="Enter segment name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea 
                id="edit-description" 
                placeholder="Enter a description for this segment"
                value={editFormData.description || ""}
                onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-rules">Segment Rules (JSON)</Label>
              <Textarea 
                id="edit-rules" 
                className="font-mono text-sm h-48"
                placeholder='Enter segment rules as JSON array'
                value={editFormData.rules}
                onChange={(e) => setEditFormData({...editFormData, rules: e.target.value})}
              />
              <p className="text-xs text-muted-foreground">
                Define rules as a JSON array of objects with field, operator, and value properties.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditModalOpen(false);
              setSelectedSegment(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditSegment} disabled={updating || !editFormData.name.trim()}>
              {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Segment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this segment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedSegment && (
              <div className="border rounded-md p-4 bg-muted/50">
                <p className="font-medium">{selectedSegment.name}</p>
                {selectedSegment.description && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedSegment.description}</p>
                )}
                <div className="flex items-center mt-2">
                  <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Based on contact criteria</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDeleteDialogOpen(false);
              setSelectedSegment(null);
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSegment} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Segment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            </div>
            <div className="text-sm text-muted-foreground">
              {!loading && (
                <>Showing <strong>{startIndex + 1}-{endIndex}</strong> of <strong>{totalSegments}</strong> segments</>
              )}
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Criteria</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Loading segments...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : displayedSegments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      {searchQuery ? (
                        <div>No segments match your search. Try a different query.</div>
                      ) : (
                        <div>
                          <p className="mb-2">No segments found.</p>
                          <Button variant="outline" onClick={() => setCreateModalOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create your first segment
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedSegments.map((segment) => (
                    <TableRow key={segment.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{segment.name}</span>
                          <span className="text-xs text-muted-foreground">{segment.description}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <div className="text-sm truncate" title={formatCriteria(segment.rules)}>
                          {formatCriteria(segment.rules)}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(segment.createdAt)}</TableCell>
                      <TableCell>{formatDate(segment.updatedAt)}</TableCell>
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
                            <DropdownMenuItem onClick={() => {
                              setSelectedSegment(segment);
                              setEditFormData({
                                name: segment.name,
                                description: segment.description || "",
                                rules: segment.rules
                              });
                              setEditModalOpen(true);
                            }}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/campaigns/create?segmentId=${segment.id}`)}>
                              <Mail className="mr-2 h-4 w-4" /> Send Campaign
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => {
                                setSelectedSegment(segment);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {!loading && displayedSegments.length > 0 && (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
} 