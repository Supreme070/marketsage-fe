"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  MessageSquare, 
  Calendar, 
  Clock, 
  Plus,
  Search,
  Filter,
  Send,
  Paperclip,
  Bell,
  CheckCircle,
  AlertCircle,
  User,
  Target,
  ArrowRight,
  MoreHorizontal,
  Check,
  X,
  Eye,
  MessageCircle,
  Phone,
  Video
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  team: string;
  avatar?: string;
  initials: string;
  status: "online" | "away" | "offline";
  activeTasks: number;
  completionRate: number;
}

interface Handoff {
  id: string;
  from: TeamMember;
  to: TeamMember;
  task: string;
  description: string;
  dueDate: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "accepted" | "in-progress" | "completed";
  comments: number;
  createdAt: string;
}

interface Message {
  id: string;
  from: TeamMember;
  content: string;
  timestamp: string;
  type: "text" | "handoff" | "system";
}

export function TeamCollaboration() {
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [selectedHandoff, setSelectedHandoff] = useState<Handoff | null>(null);
  const [handoffForm, setHandoffForm] = useState({
    task: "",
    description: "",
    assignTo: "",
    priority: "medium",
    dueDate: ""
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [updatingHandoff, setUpdatingHandoff] = useState<string | null>(null);

  // Mock data for team members
  const [teamMembers] = useState<TeamMember[]>([
    {
      id: "1",
      name: "Adebayo Ogundimu",
      role: "Marketing Manager",
      team: "Marketing",
      initials: "AO",
      status: "online",
      activeTasks: 8,
      completionRate: 92
    },
    {
      id: "2",
      name: "Fatima Abdullahi",
      role: "Content Specialist",
      team: "Marketing",
      initials: "FA",
      status: "online",
      activeTasks: 5,
      completionRate: 88
    },
    {
      id: "3",
      name: "Tunde Bakare",
      role: "Sales Manager",
      team: "Sales",
      initials: "TB",
      status: "away",
      activeTasks: 12,
      completionRate: 95
    },
    {
      id: "4",
      name: "Ngozi Okafor",
      role: "Sales Representative",
      team: "Sales",
      initials: "NO",
      status: "online",
      activeTasks: 7,
      completionRate: 85
    },
    {
      id: "5",
      name: "Chinedu Okwu",
      role: "Technical Lead",
      team: "Technical",
      initials: "CO",
      status: "offline",
      activeTasks: 6,
      completionRate: 90
    }
  ]);

  // Initialize with mock handoffs
  useState(() => {
    const initialHandoffs: Handoff[] = [
      {
        id: "1",
        from: teamMembers[0],
        to: teamMembers[2],
        task: "Lead Qualification - Lagos Tech",
        description: "Marketing qualified lead ready for sales follow-up. High intent signals detected.",
        dueDate: "2024-02-10",
        priority: "high",
        status: "pending",
        comments: 3,
        createdAt: "2024-02-05T10:30:00Z"
      },
      {
        id: "2",
        from: teamMembers[1],
        to: teamMembers[0],
        task: "Campaign Creative Review",
        description: "Email campaign designs ready for marketing manager approval before launch.",
        dueDate: "2024-02-09",
        priority: "medium",
        status: "in-progress",
        comments: 5,
        createdAt: "2024-02-04T14:20:00Z"
      },
      {
        id: "3",
        from: teamMembers[3],
        to: teamMembers[1],
        task: "Case Study Content",
        description: "Need content team to create case study from successful Abuja client implementation.",
        dueDate: "2024-02-12",
        priority: "medium",
        status: "accepted",
        comments: 2,
        createdAt: "2024-02-03T16:45:00Z"
      },
      {
        id: "4",
        from: teamMembers[2],
        to: teamMembers[4],
        task: "CRM Integration Setup",
        description: "Configure WhatsApp integration for new enterprise client onboarding.",
        dueDate: "2024-02-11",
        priority: "urgent",
        status: "completed",
        comments: 8,
        createdAt: "2024-02-01T09:15:00Z"
      }
    ];
    setHandoffs(initialHandoffs);
  });

  // Filter handoffs based on search and team
  const filteredHandoffs = useMemo(() => {
    let filtered = handoffs;

    if (selectedTeam !== "all") {
      filtered = filtered.filter(handoff => 
        handoff.from.team.toLowerCase() === selectedTeam || 
        handoff.to.team.toLowerCase() === selectedTeam
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(handoff =>
        handoff.task.toLowerCase().includes(searchTerm.toLowerCase()) ||
        handoff.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        handoff.from.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        handoff.to.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [handoffs, selectedTeam, searchTerm]);

  // Create new handoff
  const createHandoff = () => {
    if (!handoffForm.task || !handoffForm.assignTo) return;

    const assignee = teamMembers.find(member => member.id === handoffForm.assignTo);
    if (!assignee) return;

    const newHandoff: Handoff = {
      id: Date.now().toString(),
      from: teamMembers[0], // Assuming current user is first member
      to: assignee,
      task: handoffForm.task,
      description: handoffForm.description,
      dueDate: handoffForm.dueDate,
      priority: handoffForm.priority as any,
      status: "pending",
      comments: 0,
      createdAt: new Date().toISOString()
    };

    setHandoffs(prev => [newHandoff, ...prev]);
    setHandoffForm({
      task: "",
      description: "",
      assignTo: "",
      priority: "medium",
      dueDate: ""
    });
  };

  // Update handoff status
  const updateHandoffStatus = async (handoffId: string, newStatus: Handoff['status']) => {
    setUpdatingHandoff(handoffId);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setHandoffs(prev => prev.map(handoff =>
        handoff.id === handoffId ? { ...handoff, status: newStatus } : handoff
      ));
      
      // Close details dialog if handoff is completed
      if (newStatus === 'completed' && selectedHandoff?.id === handoffId) {
        setSelectedHandoff(null);
      }
      
      console.log(`Handoff ${handoffId} status updated to: ${newStatus}`);
    } catch (error) {
      console.error("Error updating handoff status:", error);
    } finally {
      setUpdatingHandoff(null);
    }
  };

  // View handoff details
  const viewHandoffDetails = (handoff: Handoff) => {
    setSelectedHandoff(handoff);
    console.log("Opening handoff details:", handoff.task);
  };

  // Handle more options menu
  const handleMoreOptions = (handoff: Handoff) => {
    console.log("More options for:", handoff.task);
    // This could open a context menu or dropdown
  };

  // Send message
  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      from: teamMembers[0], // Assuming current user
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: "text"
    };

    setMessages(prev => [message, ...prev]);
    setNewMessage("");
    console.log("Message sent:", newMessage);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "away": return "bg-yellow-500";
      case "offline": return "bg-gray-400";
      default: return "bg-gray-400";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500 text-white";
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getHandoffStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "accepted": return "bg-blue-100 text-blue-800";
      case "in-progress": return "bg-purple-100 text-purple-800";
      case "completed": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Team Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Team Collaboration Hub</CardTitle>
              <CardDescription>
                Manage cross-team handoffs, communication, and collaborative workflows
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Handoff
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Task Handoff</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Task title"
                      value={handoffForm.task}
                      onChange={(e) => setHandoffForm(prev => ({ ...prev, task: e.target.value }))}
                    />
                    <Textarea
                      placeholder="Description and context"
                      value={handoffForm.description}
                      onChange={(e) => setHandoffForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Select
                        value={handoffForm.assignTo}
                        onValueChange={(value) => setHandoffForm(prev => ({ ...prev, assignTo: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Assign to" />
                        </SelectTrigger>
                        <SelectContent>
                          {teamMembers.map(member => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name} ({member.team})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={handoffForm.priority}
                        onValueChange={(value) => setHandoffForm(prev => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      type="date"
                      value={handoffForm.dueDate}
                      onChange={(e) => setHandoffForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                    <Button onClick={createHandoff} className="w-full">
                      Create Handoff
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Team Filter</label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Search Handoffs</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks, descriptions, or team members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Team Members</CardTitle>
            <CardDescription>Current team status and availability</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{member.initials}</AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(member.status)}`}></div>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{member.name}</h4>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {member.team}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{member.activeTasks} tasks</div>
                    <div className="text-xs text-muted-foreground">{member.completionRate}% rate</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Task Handoffs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Task Handoffs</CardTitle>
            <CardDescription>Cross-team task transfers and collaborations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredHandoffs.map((handoff) => (
                <Card key={handoff.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{handoff.from.initials}</AvatarFallback>
                        </Avatar>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{handoff.to.initials}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{handoff.task}</h4>
                        <p className="text-xs text-muted-foreground">
                          {handoff.from.name} → {handoff.to.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(handoff.priority)} variant="secondary">
                        {handoff.priority}
                      </Badge>
                      <Badge className={getHandoffStatusColor(handoff.status)} variant="secondary">
                        {handoff.status}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">{handoff.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Due {new Date(handoff.dueDate).toLocaleDateString('en-NG', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>{handoff.comments} comments</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="text-xs" onClick={() => viewHandoffDetails(handoff)}>
                        View Details
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleMoreOptions(handoff)}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Handoff Details Dialog */}
      {selectedHandoff && (
        <Dialog open={!!selectedHandoff} onOpenChange={() => setSelectedHandoff(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Task Handoff Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{selectedHandoff.from.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedHandoff.from.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedHandoff.from.role}</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <div className="flex items-center gap-2">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{selectedHandoff.to.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedHandoff.to.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedHandoff.to.role}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-1">Task Title</h4>
                  <p className="text-sm">{selectedHandoff.task}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedHandoff.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-1">Priority</h4>
                    <Badge className={getPriorityColor(selectedHandoff.priority)}>
                      {selectedHandoff.priority}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Status</h4>
                    <Badge className={getHandoffStatusColor(selectedHandoff.status)}>
                      {selectedHandoff.status}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Due Date</h4>
                    <p className="text-sm">{new Date(selectedHandoff.dueDate).toLocaleDateString('en-NG')}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Comments</h4>
                    <p className="text-sm">{selectedHandoff.comments} comments</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                {selectedHandoff.status === 'pending' && (
                  <>
                    <Button 
                      size="sm" 
                      onClick={() => updateHandoffStatus(selectedHandoff.id, 'accepted')}
                      disabled={updatingHandoff === selectedHandoff.id}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {updatingHandoff === selectedHandoff.id ? "Accepting..." : "Accept"}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => updateHandoffStatus(selectedHandoff.id, 'in-progress')}
                      disabled={updatingHandoff === selectedHandoff.id}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      {updatingHandoff === selectedHandoff.id ? "Starting..." : "Start Work"}
                    </Button>
                  </>
                )}
                {selectedHandoff.status === 'in-progress' && (
                  <Button 
                    size="sm" 
                    onClick={() => updateHandoffStatus(selectedHandoff.id, 'completed')}
                    disabled={updatingHandoff === selectedHandoff.id}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {updatingHandoff === selectedHandoff.id ? "Completing..." : "Mark Complete"}
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Add Comment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Communication Hub */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Communication</CardTitle>
          <CardDescription>Real-time updates and team discussions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Recent Updates */}
            <div className="space-y-3">
              {[
                {
                  user: "Adebayo Ogundimu",
                  action: "completed task",
                  task: "Q1 Email Campaign Strategy",
                  time: "2 minutes ago",
                  type: "completion"
                },
                {
                  user: "Tunde Bakare",
                  action: "requested handoff",
                  task: "Lead Qualification - Lagos Tech",
                  time: "15 minutes ago",
                  type: "handoff"
                },
                {
                  user: "Fatima Abdullahi",
                  action: "commented on",
                  task: "Campaign Creative Review",
                  time: "1 hour ago",
                  type: "comment"
                },
                {
                  user: "Ngozi Okafor",
                  action: "accepted handoff",
                  task: "Case Study Content",
                  time: "2 hours ago",
                  type: "acceptance"
                }
              ].map((update, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    {update.type === "completion" && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {update.type === "handoff" && <ArrowRight className="h-4 w-4 text-blue-600" />}
                    {update.type === "comment" && <MessageSquare className="h-4 w-4 text-purple-600" />}
                    {update.type === "acceptance" && <Target className="h-4 w-4 text-orange-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{update.user}</span> {update.action}{" "}
                      <span className="font-medium">{update.task}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{update.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Quick Message */}
            <div className="space-y-3">
              <h4 className="font-medium">Send Quick Update</h4>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Share an update with your team..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  rows={2}
                  className="flex-1"
                />
                <div className="flex flex-col gap-2">
                  <Button size="sm" onClick={sendMessage}>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                  <Button variant="outline" size="sm">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collaboration Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Collaboration Insights</CardTitle>
          <CardDescription>Team performance and collaboration patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">Cross-Team Tasks</span>
              </div>
              <div className="text-2xl font-bold">23</div>
              <p className="text-xs text-muted-foreground">+15% this week</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="font-medium text-sm">Avg. Handoff Time</span>
              </div>
              <div className="text-2xl font-bold">4.2h</div>
              <p className="text-xs text-muted-foreground">-30min from last week</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-sm">Success Rate</span>
              </div>
              <div className="text-2xl font-bold">94%</div>
              <p className="text-xs text-muted-foreground">+2% this week</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-sm">Team Messages</span>
              </div>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">+8% this week</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 