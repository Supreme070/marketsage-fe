"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname, useRouter } from "next/navigation";

export default function TasksLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const isKanbanActive = pathname === "/tasks/kanban";
  const isListActive = pathname === "/tasks";
  
  const handleTabChange = (value: string) => {
    if (value === "kanban") {
      router.push("/tasks/kanban");
    } else {
      router.push("/tasks");
    }
  };
  
  return (
    <div className="flex flex-col space-y-6">
      <Tabs value={isKanbanActive ? "kanban" : "list"} onValueChange={handleTabChange} className="w-full">
        <div className="flex justify-center my-4">
          <TabsList className="grid w-[400px] grid-cols-2">
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          </TabsList>
        </div>
      </Tabs>
      
      {children}
    </div>
  );
} 