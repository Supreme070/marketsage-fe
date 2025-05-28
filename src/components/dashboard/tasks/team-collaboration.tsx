"use client";

import { useState } from "react";
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
  MoreHorizontal
} from "lucide-react";

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
}

export function TeamCollaboration() {
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");

  // Mock data for team members
  const teamMembers: TeamMember[] = [
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
  ];

  // Mock data for handoffs
  const handoffs: Handoff[] = [
    {
      id: "1",
      from: teamMembers[0],
      to: teamMembers[2],
      task: "Lead Qualification - Lagos Tech",
      description: "Marketing qualified lead ready for sales follow-up. High intent signals detected.",
      dueDate: "2024-02-10",
      priority: "high",
      status: "pending",
      comments: 3
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
      comments: 5
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
      comments: 2
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
      comments: 8
    }
  ];

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
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Handoff
              </Button>
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
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="cross-team">Cross-Team</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks or people..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Quick Actions</label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
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
              {handoffs.map((handoff) => (
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
                      <Button variant="outline" size="sm" className="text-xs">
                        View Details
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
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
                  rows={2}
                  className="flex-1"
                />
                <div className="flex flex-col gap-2">
                  <Button size="sm">
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