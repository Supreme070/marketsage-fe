import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { z } from "zod";
import { 
  generateFunnelReport 
} from "@/lib/enhanced-conversions";
import { 
  handleApiError, 
  unauthorized, 
  forbidden,
  notFound,
  validationError 
} from "@/lib/errors";

// Schema for validating funnel report requests
const reportSchema = z.object({
  funnelId: z.string().min(1, "Funnel ID is required"),
  startDate: z.string().transform(val => new Date(val)),
  endDate: z.string().transform(val => new Date(val))
});

// POST endpoint to generate a new funnel report
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }
  
  try {
    const body = await request.json();
    
    // Validate the request body
    const result = reportSchema.safeParse(body);
    
    if (!result.success) {
      return validationError(result.error.format());
    }
    
    const { funnelId, startDate, endDate } = result.data;
    
    // Verify the funnel exists and the user has permission
    const funnel = await prisma.conversionFunnel.findUnique({
      where: { id: funnelId },
      select: {
        id: true,
        name: true,
        createdById: true
      }
    });
    
    if (!funnel) {
      return notFound("Conversion funnel not found");
    }
    
    // Check permissions (only admin or creator can generate reports)
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
    const isOwner = funnel.createdById === session.user.id;
    
    if (!isAdmin && !isOwner) {
      return forbidden();
    }
    
    // Generate the report
    const report = await generateFunnelReport(funnelId, startDate, endDate);
    
    if (!report) {
      return NextResponse.json(
        { error: "Failed to generate funnel report" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(report);
  } catch (error) {
    return handleApiError(error, "/api/conversion-funnels/reports/route.ts [POST]");
  }
}

// GET endpoint to retrieve all reports for a funnel
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const funnelId = searchParams.get("funnelId");
    const reportId = searchParams.get("id");
    
    if (!funnelId && !reportId) {
      return NextResponse.json(
        { error: "Either funnelId or report id is required" },
        { status: 400 }
      );
    }
    
    // If a specific report ID is provided
    if (reportId) {
      const report = await prisma.conversionFunnelReport.findUnique({
        where: { id: reportId },
        include: {
          funnel: {
            select: {
              id: true,
              name: true,
              createdById: true
            }
          }
        }
      });
      
      if (!report) {
        return notFound("Funnel report not found");
      }
      
      // Check permissions
      const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
      const isOwner = report.funnel.createdById === session.user.id;
      
      if (!isAdmin && !isOwner) {
        return forbidden();
      }
      
      // Parse the data from JSON
      const reportData = JSON.parse(report.data);
      
      return NextResponse.json({
        id: report.id,
        funnelId: report.funnelId,
        funnelName: report.funnel.name,
        startDate: report.startDate,
        endDate: report.endDate,
        createdAt: report.createdAt,
        ...reportData
      });
    }
    
    // If funnel ID is provided, return all reports for that funnel
    const funnel = await prisma.conversionFunnel.findUnique({
      where: { id: funnelId },
      select: {
        id: true,
        createdById: true
      }
    });
    
    if (!funnel) {
      return notFound("Conversion funnel not found");
    }
    
    // Check permissions
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
    const isOwner = funnel.createdById === session.user.id;
    
    if (!isAdmin && !isOwner) {
      return forbidden();
    }
    
    const reports = await prisma.conversionFunnelReport.findMany({
      where: { funnelId },
      orderBy: {
        createdAt: "desc"
      }
    });
    
    // Add a summary to each report
    const reportsWithSummary = reports.map(report => {
      const data = JSON.parse(report.data);
      return {
        id: report.id,
        funnelId: report.funnelId,
        startDate: report.startDate,
        endDate: report.endDate,
        createdAt: report.createdAt,
        totalEntries: data.totalEntries,
        totalConversions: data.totalConversions,
        conversionRate: data.conversionRate,
        totalValue: data.totalValue
      };
    });
    
    return NextResponse.json(reportsWithSummary);
  } catch (error) {
    return handleApiError(error, "/api/conversion-funnels/reports/route.ts [GET]");
  }
} 