"use client";

import Link from "next/link";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  UserPlus, 
  Search, 
  MoreHorizontal, 
  UserCog, 
  Mail, 
  ShieldCheck, 
  ShieldAlert, 
  Filter,
  Download,
  Check,
  Plus
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function UsersPage() {
  const users = [
    {
      id: "user_1",
      name: "John Doe",
      email: "john.doe@example.com",
      role: "ADMIN",
      status: "ACTIVE",
      lastLogin: "2025-05-06T10:30:00Z",
      avatar: "JD",
    },
    {
      id: "user_2",
      name: "Jane Smith",
      email: "jane.smith@example.com",
      role: "USER",
      status: "ACTIVE",
      lastLogin: "2025-05-05T16:45:00Z",
      avatar: "JS",
    },
    {
      id: "user_3",
      name: "Robert Johnson",
      email: "robert.johnson@example.com",
      role: "USER",
      status: "INACTIVE",
      lastLogin: "2025-04-29T09:15:00Z",
      avatar: "RJ",
    },
    {
      id: "user_4",
      name: "Sarah Williams",
      email: "sarah.williams@example.com",
      role: "IT_ADMIN",
      status: "ACTIVE",
      lastLogin: "2025-05-06T08:20:00Z",
      avatar: "SW",
    },
    {
      id: "user_5",
      name: "Michael Brown",
      email: "michael.brown@example.com",
      role: "USER",
      status: "ACTIVE",
      lastLogin: "2025-05-03T14:10:00Z",
      avatar: "MB",
    },
  ];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100";
      case "ADMIN":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "IT_ADMIN":
        return "bg-indigo-100 text-indigo-800 hover:bg-indigo-100";
      default:
        return "bg-slate-100 text-slate-800 hover:bg-slate-100";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
      case "SUSPENDED":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">User Management</h3>
        <p className="text-sm text-muted-foreground">
          Manage users, roles, and permissions.
        </p>
      </div>
      <Separator />
      
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users..."
              className="pl-8 pr-4 w-full"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage user accounts and permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left font-medium text-muted-foreground">User</th>
                  <th className="p-4 text-left font-medium text-muted-foreground">Role</th>
                  <th className="p-4 text-left font-medium text-muted-foreground">Status</th>
                  <th className="p-4 text-left font-medium text-muted-foreground">Last Login</th>
                  <th className="p-4 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-secondary/10">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                          {user.avatar}
                        </div>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role === "SUPER_ADMIN" && <ShieldAlert className="h-3 w-3 mr-1" />}
                        {user.role === "ADMIN" && <ShieldCheck className="h-3 w-3 mr-1" />}
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={getStatusBadgeColor(user.status)}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(user.lastLogin).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/settings/users/${user.id}`}>
                            <UserCog className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4">
          <div className="text-sm text-muted-foreground">
            Showing 1-{users.length} of {users.length} users
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Invite New User</CardTitle>
          <CardDescription>
            Send an invitation for a new user to join your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" placeholder="Enter first name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" placeholder="Enter last name" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Enter email address" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select id="role" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
              <option value="IT_ADMIN">IT Admin</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Different roles have different permissions and access levels
            </p>
          </div>
          
          <div className="flex items-center justify-between space-y-0 pt-2">
            <div className="space-y-0.5">
              <Label htmlFor="send-welcome">Send welcome email</Label>
              <p className="text-sm text-muted-foreground">
                Send an automated welcome email with login instructions
              </p>
            </div>
            <Switch id="send-welcome" defaultChecked />
          </div>
        </CardContent>
        <CardFooter>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Send Invitation
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
