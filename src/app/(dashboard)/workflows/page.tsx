"use client";

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
  Copy,
  MoreHorizontal,
  Trash2,
  Edit,
  Eye,
  Play,
  PauseCircle,
  BarChart,
  Workflow,
} from "lucide-react";
import { useRouter } from "next/navigation";

// Sample data for workflows
const workflows = [
  {
    id: "1",
    name: "Welcome Sequence",
    description: "New subscriber onboarding series",
    status: "ACTIVE",
    triggers: ["Contact added to list"],
    steps: 5,
    contacts: 248,
    createdAt: "2023-03-15",
  },
  {
    id: "2",
    name: "Abandoned Cart Recovery",
    description: "Follow up on abandoned shopping carts",
    status: "ACTIVE",
    triggers: ["Cart abandoned"],
    steps: 3,
    contacts: 156,
    createdAt: "2023-04-20",
  },
  {
    id: "3",
    name: "Post-Purchase Feedback",
    description: "Gather feedback after purchase completion",
    status: "INACTIVE",
    triggers: ["Purchase completed"],
    steps: 4,
    contacts: 0,
    createdAt: "2023-05-05",
  },
  {
    id: "4",
    name: "Re-Engagement Campaign",
    description: "Win back inactive subscribers",
    status: "ACTIVE",
    triggers: ["No activity for 30 days"],
    steps: 6,
    contacts: 342,
    createdAt: "2023-02-10",
  },
  {
    id: "5",
    name: "VIP Customer Rewards",
    description: "Special offers for high-value customers",
    status: "PAUSED",
    triggers: ["Tag added: VIP"],
    steps: 4,
    contacts: 86,
    createdAt: "2023-05-18",
  },
];

export default function WorkflowsPage() {
  const router = useRouter();

  const handleCreateWorkflow = () => {
    router.push(`/workflows/new-workflow`);
  };

  const handleEdit = (id: string) => {
    router.push(`/workflows/${id}`);
  };

  const handleView = (id: string) => {
    router.push(`/workflows/${id}`);
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Workflows</h2>
        <Button onClick={handleCreateWorkflow}>
          <Plus className="mr-2 h-4 w-4" />
          Create Workflow
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Workflows</CardTitle>
          <CardDescription>
            Automate your marketing processes with visual workflows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Workflow</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Steps</TableHead>
                  <TableHead>Active Contacts</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workflows.map((workflow) => (
                  <TableRow key={workflow.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{workflow.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {workflow.description}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          workflow.status === "ACTIVE"
                            ? "default"
                            : workflow.status === "PAUSED"
                            ? "outline"
                            : "secondary"
                        }
                      >
                        {workflow.status.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {workflow.triggers.map((trigger) => trigger)}
                    </TableCell>
                    <TableCell>{workflow.steps}</TableCell>
                    <TableCell>{workflow.contacts.toLocaleString()}</TableCell>
                    <TableCell>{workflow.createdAt}</TableCell>
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
                          <DropdownMenuItem onClick={() => handleView(workflow.id)}>
                            <Eye className="mr-2 h-4 w-4" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(workflow.id)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          {workflow.status === "INACTIVE" ||
                          workflow.status === "PAUSED" ? (
                            <DropdownMenuItem>
                              <Play className="mr-2 h-4 w-4" /> Activate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem>
                              <PauseCircle className="mr-2 h-4 w-4" /> Pause
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <BarChart className="mr-2 h-4 w-4" /> Statistics
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

          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing <strong>5</strong> of <strong>5</strong> workflows
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
