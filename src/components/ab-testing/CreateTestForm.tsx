"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { createABTest, ABTestFormData, ABTestVariantFormData } from "@/lib/ab-testing-service";
import { Loader2, Plus, X, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CreateTestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (id: string) => void;
  entityType?: string;
  entityId?: string;
}

export function CreateTestForm({
  open,
  onOpenChange,
  onSubmit,
  entityType: initialEntityType,
  entityId: initialEntityId,
}: CreateTestFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ABTestFormData>({
    name: "",
    description: "",
    entityType: initialEntityType || "EMAIL_CAMPAIGN",
    entityId: initialEntityId || "",
    testType: "SIMPLE_AB",
    testElements: ["subject"],
    winnerMetric: "OPEN_RATE",
    winnerThreshold: 0.95,
    distributionPercent: 0.5,
    variants: [
      {
        name: "Control",
        content: { subject: "" },
        trafficPercent: 0.5,
      },
      {
        name: "Variant A",
        content: { subject: "" },
        trafficPercent: 0.5,
      },
    ],
  });

  const handleChange = (
    key: keyof ABTestFormData,
    value: string | string[] | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleVariantChange = (
    index: number,
    key: keyof ABTestVariantFormData,
    value: string | number | Record<string, any>
  ) => {
    const newVariants = [...formData.variants];
    
    if (key === "content") {
      newVariants[index] = {
        ...newVariants[index],
        content: {
          ...newVariants[index].content,
          ...(value as Record<string, any>),
        },
      };
    } else {
      newVariants[index] = {
        ...newVariants[index],
        [key]: value,
      };
    }
    
    setFormData((prev) => ({
      ...prev,
      variants: newVariants,
    }));
  };

  const addVariant = () => {
    // Set equal traffic distribution
    const count = formData.variants.length + 1;
    const percent = 1 / count;
    
    const variants = formData.variants.map((v) => ({
      ...v,
      trafficPercent: percent,
    }));
    
    variants.push({
      name: `Variant ${String.fromCharCode(65 + variants.length - 1)}`, // A, B, C, etc.
      content: { subject: "" },
      trafficPercent: percent,
    });
    
    setFormData((prev) => ({
      ...prev,
      variants,
    }));
  };

  const removeVariant = (index: number) => {
    if (formData.variants.length <= 2) {
      toast.error("At least two variants are required");
      return;
    }
    
    const variants = formData.variants.filter((_, i) => i !== index);
    
    // Redistribute traffic percentages
    const percent = 1 / variants.length;
    variants.forEach((v) => {
      v.trafficPercent = percent;
    });
    
    setFormData((prev) => ({
      ...prev,
      variants,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validate form
      if (!formData.name) {
        toast.error("Test name is required");
        return;
      }
      
      if (!formData.entityId) {
        toast.error("Entity ID is required");
        return;
      }
      
      // Create test
      const id = await createABTest(formData);
      
      if (id) {
        toast.success("A/B test created successfully");
        onOpenChange(false);
        
        if (onSubmit) {
          onSubmit(id);
        }
      }
    } catch (error) {
      console.error("Error creating A/B test:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create A/B Test</DialogTitle>
          <DialogDescription>
            Create a new A/B test to optimize your marketing campaigns
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Test Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g. Subject Line Test - May Campaign"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="What are you testing and why?"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="entityType">Entity Type</Label>
                <Select
                  value={formData.entityType}
                  onValueChange={(value) => handleChange("entityType", value)}
                  disabled={!!initialEntityType}
                >
                  <SelectTrigger id="entityType">
                    <SelectValue placeholder="Select entity type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMAIL_CAMPAIGN">Email Campaign</SelectItem>
                    <SelectItem value="SMS_CAMPAIGN">SMS Campaign</SelectItem>
                    <SelectItem value="WHATSAPP_CAMPAIGN">WhatsApp Campaign</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="entityId">Campaign ID</Label>
                <Input
                  id="entityId"
                  value={formData.entityId}
                  onChange={(e) => handleChange("entityId", e.target.value)}
                  placeholder="Campaign ID"
                  required
                  disabled={!!initialEntityId}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="testType">Test Type</Label>
                <Select
                  value={formData.testType}
                  onValueChange={(value) => handleChange("testType", value)}
                >
                  <SelectTrigger id="testType">
                    <SelectValue placeholder="Select test type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SIMPLE_AB">Simple A/B Test</SelectItem>
                    <SelectItem value="MULTIVARIATE">Multivariate Test</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="winnerMetric">Winner Metric</Label>
                <Select
                  value={formData.winnerMetric}
                  onValueChange={(value) => handleChange("winnerMetric", value)}
                >
                  <SelectTrigger id="winnerMetric">
                    <SelectValue placeholder="Select winner metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN_RATE">Open Rate</SelectItem>
                    <SelectItem value="CLICK_RATE">Click Rate</SelectItem>
                    <SelectItem value="CONVERSION_RATE">Conversion Rate</SelectItem>
                    <SelectItem value="REPLY_RATE">Reply Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>What are you testing?</Label>
              <Select
                value={formData.testElements[0]}
                onValueChange={(value) => handleChange("testElements", [value])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select element to test" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subject">Subject Line</SelectItem>
                  <SelectItem value="preheader">Preheader</SelectItem>
                  <SelectItem value="content">Email Content</SelectItem>
                  <SelectItem value="cta">Call to Action</SelectItem>
                  <SelectItem value="send_time">Send Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="distributionPercent">
                Test Distribution Percentage (10-100%)
              </Label>
              <Input
                id="distributionPercent"
                type="number"
                min={10}
                max={100}
                step={5}
                value={Math.round(formData.distributionPercent * 100)}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (value >= 10 && value <= 100) {
                    handleChange("distributionPercent", value / 100);
                  }
                }}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Percentage of your audience that will be included in the test
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Variants</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addVariant}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Variant
                </Button>
              </div>

              {formData.variants.map((variant, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Input
                          value={variant.name}
                          onChange={(e) =>
                            handleVariantChange(index, "name", e.target.value)
                          }
                          className="w-48"
                          placeholder="Variant Name"
                        />
                        <div className="ml-4">
                          <Label className="text-xs mb-1 block">
                            Traffic: {Math.round(variant.trafficPercent * 100)}%
                          </Label>
                        </div>
                      </div>
                      
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVariant(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div>
                      <Label className="mb-1 block">
                        {formData.testElements[0] === 'subject'
                          ? 'Subject Line'
                          : formData.testElements[0] === 'preheader'
                          ? 'Preheader'
                          : formData.testElements[0] === 'cta'
                          ? 'Call to Action'
                          : formData.testElements[0] === 'send_time'
                          ? 'Send Time'
                          : 'Content'}
                      </Label>
                      <Input
                        value={variant.content[formData.testElements[0]] || ''}
                        onChange={(e) =>
                          handleVariantChange(index, "content", {
                            [formData.testElements[0]]: e.target.value,
                          })
                        }
                        placeholder={`Enter ${formData.testElements[0]} variant`}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Test
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 