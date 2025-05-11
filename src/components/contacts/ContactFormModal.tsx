"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ContactForm from "./ContactForm";

type ContactData = {
  id?: string;
  firstName: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  notes?: string | null;
  tags?: string[];
  source?: string | null;
};

type ContactFormModalProps = {
  initialData?: ContactData;
  isEdit?: boolean;
  trigger?: React.ReactNode;
  onSuccess?: (contact: any) => void;
};

export default function ContactFormModal({
  initialData,
  isEdit = false,
  trigger,
  onSuccess,
}: ContactFormModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = (contact: any) => {
    setIsOpen(false);
    if (onSuccess) {
      onSuccess(contact);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" /> Add Contact
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <ContactForm 
          initialData={initialData}
          isEdit={isEdit}
          onCancel={() => setIsOpen(false)}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
} 