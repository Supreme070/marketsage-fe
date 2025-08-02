import { useEffect, useState, useCallback } from "react";

interface AuditStreamEvent {
  type: "connected" | "audit_log";
  data?: any;
}

export function useAuditStream(enabled = true) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<AuditStreamEvent | null>(null);

  const connect = useCallback(() => {
    if (!enabled) return;

    const eventSource = new EventSource("/api/admin/audit/stream");

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as AuditStreamEvent;
        setLastEvent(data);
      } catch (error) {
        console.error("Failed to parse audit stream event:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("Audit stream error:", error);
      setIsConnected(false);
      eventSource.close();

      // Reconnect after 5 seconds
      setTimeout(() => {
        connect();
      }, 5000);
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [enabled]);

  useEffect(() => {
    const cleanup = connect();
    return () => {
      if (cleanup) cleanup();
    };
  }, [connect]);

  return {
    isConnected,
    lastEvent,
  };
}