"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Filter, 
  User, 
  Mail, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Pause,
  Play,
  SkipForward,
  Eye,
  Edit,
  MoreHorizontal,
  MapPin,
  Calendar,
  Phone
} from "lucide-react";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  location: string;
  joinDate: string;
  currentJourney: string;
  journeyStep: string;
  progress: number;
  status: "active" | "paused" | "completed" | "dropped";
  lastActivity: string;
  totalEngagement: number;
}

interface JourneyStep {
  id: string;
  name: string;
  type: "email" | "sms" | "whatsapp" | "delay" | "condition";
  status: "completed" | "current" | "pending" | "skipped";
  completedAt?: string;
  duration?: string;
  engagement?: number;
}

export function ContactJourneyTracking() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJourney, setSelectedJourney] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Mock data for contacts
  const contacts: Contact[] = [
    {
      id: "1",
      name: "Adebayo Ogundimu",
      email: "adebayo@example.com",
      phone: "+234 801 234 5678",
      location: "Lagos, Nigeria",
      joinDate: "2024-01-15",
      currentJourney: "Welcome Onboarding",
      journeyStep: "Follow-up Email",
      progress: 60,
      status: "active",
      lastActivity: "2 hours ago",
      totalEngagement: 78
    },
    {
      id: "2", 
      name: "Fatima Abdullahi",
      email: "fatima@example.com",
      phone: "+234 802 345 6789",
      location: "Abuja, Nigeria",
      joinDate: "2024-01-12",
      currentJourney: "Product Discovery",
      journeyStep: "Product Demo",
      progress: 85,
      status: "active",
      lastActivity: "1 hour ago",
      totalEngagement: 92
    },
    {
      id: "3",
      name: "Chinedu Okwu",
      email: "chinedu@example.com",
      location: "Port Harcourt, Nigeria",
      joinDate: "2024-01-10",
      currentJourney: "Re-engagement",
      journeyStep: "Final CTA",
      progress: 95,
      status: "completed",
      lastActivity: "3 days ago",
      totalEngagement: 65
    },
    {
      id: "4",
      name: "Aisha Mohammed",
      email: "aisha@example.com",
      phone: "+234 803 456 7890",
      location: "Kano, Nigeria",
      joinDate: "2024-01-08",
      currentJourney: "Welcome Onboarding",
      journeyStep: "Welcome Email",
      progress: 20,
      status: "paused",
      lastActivity: "1 day ago",
      totalEngagement: 45
    },
    {
      id: "5",
      name: "Emeka Nwankwo",
      email: "emeka@example.com",
      location: "Enugu, Nigeria",
      joinDate: "2024-01-05",
      currentJourney: "Seasonal Promotion",
      journeyStep: "Condition Check",
      progress: 40,
      status: "dropped",
      lastActivity: "5 days ago",
      totalEngagement: 23
    }
  ];

  // Mock journey steps for selected contact
  const journeySteps: JourneyStep[] = [
    {
      id: "1",
      name: "Welcome Email",
      type: "email",
      status: "completed",
      completedAt: "2024-01-15 10:30",
      duration: "2m",
      engagement: 95
    },
    {
      id: "2",
      name: "Wait 1 Day",
      type: "delay",
      status: "completed",
      completedAt: "2024-01-16 10:30",
      duration: "24h"
    },
    {
      id: "3",
      name: "Follow-up Email",
      type: "email",
      status: "current",
      engagement: 78
    },
    {
      id: "4",
      name: "Condition: Opened Email?",
      type: "condition",
      status: "pending"
    },
    {
      id: "5",
      name: "Product Demo SMS",
      type: "sms",
      status: "pending"
    },
    {
      id: "6",
      name: "Final WhatsApp Follow-up",
      type: "whatsapp",
      status: "pending"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 border-green-200";
      case "paused": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "completed": return "bg-blue-100 text-blue-800 border-blue-200";
      case "dropped": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case "email": return <Mail className="h-4 w-4" />;
      case "sms": return <MessageSquare className="h-4 w-4" />;
      case "whatsapp": return <MessageSquare className="h-4 w-4 text-green-600" />;
      case "delay": return <Clock className="h-4 w-4" />;
      case "condition": return <CheckCircle className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "current": return <Play className="h-4 w-4 text-blue-600" />;
      case "pending": return <Clock className="h-4 w-4 text-gray-400" />;
      case "skipped": return <SkipForward className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesJourney = selectedJourney === "all" || contact.currentJourney === selectedJourney;
    const matchesStatus = selectedStatus === "all" || contact.status === selectedStatus;
    
    return matchesSearch && matchesJourney && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Contact Journey Tracking</CardTitle>
          <CardDescription>
            Monitor and manage individual contact progress through journeys
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div>
              <Select value={selectedJourney} onValueChange={setSelectedJourney}>
                <SelectTrigger>
                  <SelectValue placeholder="All Journeys" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Journeys</SelectItem>
                  <SelectItem value="Welcome Onboarding">Welcome Onboarding</SelectItem>
                  <SelectItem value="Product Discovery">Product Discovery</SelectItem>
                  <SelectItem value="Re-engagement">Re-engagement</SelectItem>
                  <SelectItem value="Seasonal Promotion">Seasonal Promotion</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="dropped">Dropped</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Contacts ({filteredContacts.length})</CardTitle>
            <CardDescription>Click on a contact to view their journey details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedContact?.id === contact.id ? "ring-2 ring-blue-500 bg-blue-50" : ""
                  }`}
                  onClick={() => setSelectedContact(contact)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={contact.avatar} />
                        <AvatarFallback>
                          {contact.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{contact.name}</h4>
                          <Badge className={`text-xs ${getStatusColor(contact.status)}`}>
                            {contact.status}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>{contact.email}</span>
                          </div>
                          {contact.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>{contact.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{contact.location}</span>
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-medium">{contact.currentJourney}</span>
                            <span className="text-muted-foreground">{contact.progress}%</span>
                          </div>
                          <Progress value={contact.progress} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            Current: {contact.journeyStep}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium">{contact.totalEngagement}%</div>
                      <p className="text-xs text-muted-foreground">Engagement</p>
                      <p className="text-xs text-muted-foreground mt-1">{contact.lastActivity}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Journey Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedContact ? "Journey Details" : "Select Contact"}
            </CardTitle>
            <CardDescription>
              {selectedContact 
                ? `${selectedContact.name}'s journey progress`
                : "Click on a contact to view their journey details"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedContact ? (
              <div className="space-y-4">
                {/* Contact Summary */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {selectedContact.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{selectedContact.name}</h4>
                      <p className="text-sm text-muted-foreground">{selectedContact.email}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Journey:</span>
                      <p className="font-medium">{selectedContact.currentJourney}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Progress:</span>
                      <p className="font-medium">{selectedContact.progress}%</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className={`text-xs ${getStatusColor(selectedContact.status)}`}>
                        {selectedContact.status}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Engagement:</span>
                      <p className="font-medium">{selectedContact.totalEngagement}%</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Journey Steps */}
                <div className="space-y-3">
                  <h4 className="font-medium">Journey Steps</h4>
                  {journeySteps.map((step, index) => (
                    <div key={step.id} className="relative">
                      {/* Connection Line */}
                      {index < journeySteps.length - 1 && (
                        <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200"></div>
                      )}
                      
                      <div className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="flex-shrink-0">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            step.status === "completed" ? "bg-green-100" :
                            step.status === "current" ? "bg-blue-100" :
                            "bg-gray-100"
                          }`}>
                            {getStepIcon(step.type)}
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{step.name}</span>
                            {getStepStatusIcon(step.status)}
                          </div>
                          
                          <div className="text-xs text-muted-foreground space-y-1">
                            {step.completedAt && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{step.completedAt}</span>
                              </div>
                            )}
                            {step.duration && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{step.duration}</span>
                              </div>
                            )}
                            {step.engagement && (
                              <div className="flex items-center gap-1">
                                <span>Engagement: {step.engagement}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Actions */}
                <div className="space-y-2">
                  <h4 className="font-medium">Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                    <Button variant="outline" size="sm">
                      <SkipForward className="h-4 w-4 mr-2" />
                      Skip Step
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Journey
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Profile
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Select a contact to view their journey details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 