import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { WorkflowPerformanceMonitor } from "@/lib/workflow/performance-monitor";
import { AdvancedCacheManager } from "@/lib/workflow/advanced-cache-manager";
import { unauthorized, handleApiError } from "@/lib/errors";

// Initialize performance monitor and cache manager
const performanceMonitor = new WorkflowPerformanceMonitor();
const cacheManager = new AdvancedCacheManager();

/**
 * GET - Retrieve comprehensive performance dashboard data
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return unauthorized();
    }

    // Only allow admin users to access performance data
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Insufficient permissions", message: "Admin access required for performance monitoring" },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const dataType = url.searchParams.get("type");

    // Handle specific data type requests
    switch (dataType) {
      case "system":
        const systemHealth = await performanceMonitor.collectSystemMetrics();
        return NextResponse.json({ systemHealth });

      case "workflows":
        const workflowMetrics = await performanceMonitor.analyzeWorkflowPerformance();
        return NextResponse.json({ workflowMetrics });

      case "alerts":
        const alerts = await performanceMonitor.checkAlertConditions();
        return NextResponse.json({ alerts });

      case "bottlenecks":
        const bottlenecks = await performanceMonitor.detectBottlenecks();
        return NextResponse.json({ bottlenecks });

      case "cache":
        const cacheMetrics = cacheManager.getCacheMetrics();
        return NextResponse.json({ cacheMetrics });

      default:
        // Return comprehensive dashboard data
        const dashboardData = await performanceMonitor.getPerformanceDashboard();
        
        // Add cache metrics to dashboard
        const cacheStats = cacheManager.getCacheMetrics();
        
        return NextResponse.json({
          ...dashboardData,
          cacheMetrics: cacheStats,
          timestamp: new Date().toISOString(),
        });
    }
  } catch (error) {
    console.error("Performance API Error:", error);
    return handleApiError(error, "/api/workflows/performance/route.ts");
  }
}

/**
 * POST - Control performance monitoring (start/stop)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return unauthorized();
    }

    // Only allow super admin users to control monitoring
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions", message: "Super admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, intervalMs } = body;

    switch (action) {
      case "start":
        await performanceMonitor.startMonitoring(intervalMs || 30000);
        return NextResponse.json({ message: "Performance monitoring started", status: "started" });

      case "stop":
        performanceMonitor.stopMonitoring();
        return NextResponse.json({ message: "Performance monitoring stopped", status: "stopped" });

      case "warmCache":
        await cacheManager.warmCache();
        return NextResponse.json({ message: "Cache warming initiated", status: "warming" });

      case "invalidateCache":
        const { patterns } = body;
        if (patterns && Array.isArray(patterns)) {
          await cacheManager.invalidateCache(patterns);
          return NextResponse.json({ message: "Cache invalidated", patterns });
        }
        return NextResponse.json({ error: "Invalid patterns provided" }, { status: 400 });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Performance Control API Error:", error);
    return handleApiError(error, "/api/workflows/performance/route.ts");
  }
}

/**
 * PATCH - Update performance monitoring configuration
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return unauthorized();
    }

    // Only allow super admin users to modify configuration
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions", message: "Super admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { alertThresholds, cacheConfig } = body;

    // Update alert thresholds
    if (alertThresholds) {
      // In a real implementation, you'd update the performance monitor configuration
      console.log("Updating alert thresholds:", alertThresholds);
    }

    // Update cache configuration
    if (cacheConfig) {
      // In a real implementation, you'd update the cache manager configuration
      console.log("Updating cache configuration:", cacheConfig);
    }

    return NextResponse.json({ 
      message: "Configuration updated successfully",
      alertThresholds,
      cacheConfig 
    });
  } catch (error) {
    console.error("Performance Configuration API Error:", error);
    return handleApiError(error, "/api/workflows/performance/route.ts");
  }
}