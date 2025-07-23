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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Share2,
  Loader2,
} from "lucide-react";

interface List {
  id: string;
  name: string;
  description?: string;
  type: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
  createdById: string;
}

export default function ListsPage() {
  const [lists, setLists] = useState<List[]>([]);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<List | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    type: "STATIC",
  });
  const [newList, setNewList] = useState({
    name: "",
    description: "",
    type: "STATIC",
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  // Fetch lists from API
  useEffect(() => {
    async function fetchLists() {
      try {
        setLoading(true);
        const response = await fetch('/api/lists', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error('Failed to fetch lists');
        }
        const data = await response.json();
        setLists(data);
      } catch (error) {
        console.error('Error fetching lists:', error);
        toast({
          title: "Error",
          description: "Failed to load lists. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchLists();
  }, []);

  // Handle creating a new list
  const handleCreateList = async () => {
    try {
      setCreating(true);
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newList),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create list');
      }

      const createdList = await response.json();
      
      // Add the new list to the state
      setLists(prev => [createdList, ...prev]);
      
      // Reset form and close modal
      setNewList({
        name: "",
        description: "",
        type: "STATIC",
      });
      setCreateModalOpen(false);
      
      toast({
        title: "Success",
        description: "List created successfully",
      });
    } catch (error) {
      console.error('Error creating list:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create list. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  // Handle editing a list
  const handleEditList = async () => {
    if (!selectedList) return;
    
    try {
      setUpdating(true);
      const response = await fetch(`/api/lists/${selectedList.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update list');
      }

      const updatedList = await response.json();
      
      // Update the list in state
      setLists(prev => prev.map(list => 
        list.id === updatedList.id ? updatedList : list
      ));
      
      // Reset form and close modal
      setEditModalOpen(false);
      setSelectedList(null);
      
      toast({
        title: "Success",
        description: "List updated successfully",
      });
    } catch (error) {
      console.error('Error updating list:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update list. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Handle deleting a list
  const handleDeleteList = async () => {
    if (!selectedList) return;
    
    try {
      setDeleting(true);
      const response = await fetch(`/api/lists/${selectedList.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete list');
      }
      
      // Remove the list from state
      setLists(prev => prev.filter(list => list.id !== selectedList.id));
      
      // Reset and close dialog
      setDeleteDialogOpen(false);
      setSelectedList(null);
      
      toast({
        title: "Success",
        description: "List deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting list:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete list. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };
  
  // Navigate to manage members page
  const navigateToManageMembers = (list: List) => {
    router.push(`/list/${list.id}/members`);
  };
  
  // Navigate to send campaign page
  const navigateToSendCampaign = (list: List) => {
    router.push(`/campaigns/create?listId=${list.id}`);
  };

  const itemsPerPage = 5;
  const filteredLists = lists.filter(list => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        list.name.toLowerCase().includes(searchLower) ||
        (list.description?.toLowerCase().includes(searchLower) || false)
      );
    }

    // Status filter
    if (statusFilter) {
      return false; // We don't have status in the API response yet
    }

    // Tag filter
    if (tagFilter) {
      return false; // We don't have tags in the API response yet
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

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Lists</h2>
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New List</DialogTitle>
              <DialogDescription>
                Create a new list to organize your contacts.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">List Name</Label>
                <Input 
                  id="name" 
                  placeholder="Enter list name"
                  value={newList.name}
                  onChange={(e) => setNewList({...newList, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Enter a description for this list"
                  value={newList.description}
                  onChange={(e) => setNewList({...newList, description: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">List Type</Label>
                <Select 
                  value={newList.type} 
                  onValueChange={(value) => setNewList({...newList, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STATIC">Static</SelectItem>
                    <SelectItem value="DYNAMIC">Dynamic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateList} disabled={creating || !newList.name.trim()}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create List
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit List Dialog */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit List</DialogTitle>
            <DialogDescription>
              Update the details of your list.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">List Name</Label>
              <Input 
                id="edit-name" 
                placeholder="Enter list name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea 
                id="edit-description" 
                placeholder="Enter a description for this list"
                value={editFormData.description || ""}
                onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-type">List Type</Label>
              <Select 
                value={editFormData.type} 
                onValueChange={(value) => setEditFormData({...editFormData, type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STATIC">Static</SelectItem>
                  <SelectItem value="DYNAMIC">Dynamic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditModalOpen(false);
              setSelectedList(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditList} disabled={updating || !editFormData.name.trim()}>
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
            <DialogTitle>Delete List</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this list? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedList && (
              <div className="border rounded-md p-4 bg-muted/50">
                <p className="font-medium">{selectedList.name}</p>
                {selectedList.description && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedList.description}</p>
                )}
                <div className="flex items-center mt-2">
                  <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span className="text-sm">{selectedList.memberCount} contacts</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDeleteDialogOpen(false);
              setSelectedList(null);
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteList} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            </div>
            <div className="text-sm text-muted-foreground">
              {!loading && (
                <>Showing <strong>{startIndex + 1}-{endIndex}</strong> of <strong>{totalLists}</strong> lists</>
              )}
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contacts</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Loading lists...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : displayedLists.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      {searchQuery ? (
                        <div>No lists match your search. Try a different query.</div>
                      ) : (
                        <div>
                          <p className="mb-2">No lists found.</p>
                          <Button variant="outline" onClick={() => setCreateModalOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create your first list
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedLists.map((list) => (
                    <TableRow key={list.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{list.name}</span>
                          <span className="text-xs text-muted-foreground">{list.description}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={list.type === "STATIC" ? "default" : "secondary"}
                        >
                          {list.type.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                          {list.memberCount}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(list.createdAt)}</TableCell>
                      <TableCell>{formatDate(list.updatedAt)}</TableCell>
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
                              setSelectedList(list);
                              setEditFormData({
                                name: list.name,
                                description: list.description || "",
                                type: list.type,
                              });
                              setEditModalOpen(true);
                            }}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigateToSendCampaign(list)}>
                              <Mail className="mr-2 h-4 w-4" /> Send Campaign
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigateToManageMembers(list)}>
                              <Users className="mr-2 h-4 w-4" /> Manage Members
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => {
                                setSelectedList(list);
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

          {!loading && displayedLists.length > 0 && (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
} 