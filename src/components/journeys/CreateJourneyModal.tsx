"use client";

import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

// Import UI components individually
import { Dialog } from "@/components/ui/dialog";
import { DialogContent } from "@/components/ui/dialog";
import { DialogDescription } from "@/components/ui/dialog";
import { DialogFooter } from "@/components/ui/dialog";
import { DialogHeader } from "@/components/ui/dialog";
import { DialogTitle } from "@/components/ui/dialog";
import { DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormControl } from "@/components/ui/form";
import { FormField } from "@/components/ui/form";
import { FormItem } from "@/components/ui/form";
import { FormLabel } from "@/components/ui/form";
import { FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  name: z.string().min(1, "Journey name is required"),
  description: z.string().optional(),
  stages: z.array(
    z.object({
      name: z.string().min(1, "Stage name is required"),
      description: z.string().optional(),
      order: z.number().optional(),
      isEntryPoint: z.boolean().optional().default(false),
      isExitPoint: z.boolean().optional().default(false),
    })
  ).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateJourneyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: FormValues) => void;
}

export function CreateJourneyModal({
  open,
  onOpenChange,
  onSubmit,
}: CreateJourneyModalProps) {
  const [includeFirstStage, setIncludeFirstStage] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      stages: includeFirstStage ? [{ name: "Awareness", isEntryPoint: true, order: 0 }] : [],
    },
  });

  const handleSubmit = (values: FormValues) => {
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create New Journey</DialogTitle>
          <DialogDescription>
            Define your customer journey to track and optimize their experience.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Journey Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Customer Onboarding" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the purpose of this journey"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center space-x-2">
              <Switch
                id="include-first-stage"
                checked={includeFirstStage}
                onCheckedChange={(checked) => {
                  setIncludeFirstStage(checked);
                  if (checked) {
                    form.setValue("stages", [
                      { name: "Awareness", isEntryPoint: true, order: 0 },
                    ]);
                  } else {
                    form.setValue("stages", []);
                  }
                }}
              />
              <label
                htmlFor="include-first-stage"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Create first stage automatically
              </label>
            </div>

            {includeFirstStage && (
              <FormField
                control={form.control}
                name="stages.0.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Stage Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Journey</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 