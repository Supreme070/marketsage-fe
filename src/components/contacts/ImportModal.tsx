"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    success?: boolean;
    imported?: number;
    failed?: number;
    error?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
        toast.error("Please select a CSV file");
        return;
      }
      setFile(selectedFile);
      setImportResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to import");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Create FormData and append the file
      const formData = new FormData();
      formData.append("file", file);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + Math.random() * 10;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 300);

      // Send the file to the API
      const response = await fetch("/api/contacts/import", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to import contacts");
      }

      setImportResult({
        success: true,
        imported: result.imported,
        failed: result.failed,
      });

      if (result.imported > 0) {
        toast.success(`Successfully imported ${result.imported} contacts`);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        toast.warning("No contacts were imported");
      }
    } catch (error) {
      console.error("Error importing contacts:", error);
      setImportResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      });
      toast.error("Failed to import contacts");
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setImportResult(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Contacts</DialogTitle>
          <DialogDescription>
            Upload a CSV file with your contacts. Make sure your file has the required headers.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {!importResult?.success && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Input
                  id="file"
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="col-span-4"
                  disabled={isUploading}
                />
              </div>

              {file && (
                <div className="px-2 py-1 text-sm">
                  Selected file: <span className="font-medium">{file.name}</span> (
                  {(file.size / 1024).toFixed(2)} KB)
                </div>
              )}

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {importResult?.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{importResult.error}</AlertDescription>
                </Alert>
              )}
            </>
          )}

          {importResult?.success && (
            <div className="space-y-4">
              <div className="flex items-center">
                <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
                <span className="text-lg font-medium">Import Complete</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="border rounded p-3">
                  <div className="text-muted-foreground">Imported</div>
                  <div className="text-xl font-bold">{importResult.imported}</div>
                </div>
                <div className="border rounded p-3">
                  <div className="text-muted-foreground">Failed</div>
                  <div className="text-xl font-bold">{importResult.failed}</div>
                </div>
              </div>

              {importResult.failed && importResult.failed > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Some contacts could not be imported due to validation errors.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {importResult?.success ? (
            <Button onClick={onClose}>Done</Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={!file || isUploading}
              >
                Reset
              </Button>
              <Button 
                type="button" 
                onClick={handleUpload} 
                disabled={!file || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 