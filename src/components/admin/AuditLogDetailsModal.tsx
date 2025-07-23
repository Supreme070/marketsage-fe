"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Clock, User, Globe, Server, Database, FileText } from "lucide-react";

interface AuditLogDetailsModalProps {
  log: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AuditLogDetailsModal({ log, isOpen, onClose }: AuditLogDetailsModalProps) {
  if (!log) return null;

  const formatJson = (data: any) => {
    if (!data) return "N/A";
    return JSON.stringify(data, null, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Audit Log Details</DialogTitle>
          <DialogDescription>
            Complete details of the audit log entry
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-full max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Timestamp
                  </p>
                  <p className="font-mono text-sm">
                    {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Action</p>
                  <Badge variant="secondary">{log.action}</Badge>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Database className="h-3 w-3" /> Resource
                  </p>
                  <p className="font-medium">{log.resource}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Resource ID</p>
                  <p className="font-mono text-sm">{log.resourceId}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* User Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <User className="h-4 w-4" /> User Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">User Email</p>
                  <p className="font-medium">{log.userEmail || "System"}</p>
                </div>
                
                {log.user && (
                  <>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">User Name</p>
                      <p className="font-medium">{log.user.name || "N/A"}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">User Role</p>
                      <Badge>{log.user.role}</Badge>
                    </div>
                  </>
                )}
                
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">User ID</p>
                  <p className="font-mono text-sm">{log.userId || "N/A"}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Request Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Globe className="h-4 w-4" /> Request Information
              </h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">IP Address</p>
                  <p className="font-mono text-sm">{log.ipAddress || "N/A"}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">User Agent</p>
                  <p className="font-mono text-xs break-all">{log.userAgent || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Changes */}
            {log.changes && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Changes
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {log.changes.before && (
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 font-medium">Before</p>
                        <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">
                          {formatJson(log.changes.before)}
                        </pre>
                      </div>
                    )}
                    
                    {log.changes.after && (
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 font-medium">After</p>
                        <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">
                          {formatJson(log.changes.after)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Metadata */}
            {log.metadata && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Server className="h-4 w-4" /> Additional Metadata
                  </h3>
                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">
                    {formatJson(log.metadata)}
                  </pre>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}