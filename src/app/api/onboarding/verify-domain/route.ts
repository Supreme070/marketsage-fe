import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import dns from 'dns';
import { promisify } from 'util';

const resolveTxt = promisify(dns.resolveTxt);
const resolveCname = promisify(dns.resolveCname);
const resolveMx = promisify(dns.resolveMx);

const verifyDomainSchema = z.object({
  domain: z.string().min(1, 'Domain is required').refine(
    (domain) => {
      // Basic domain validation
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.([a-zA-Z]{2,})+$/;
      return domainRegex.test(domain);
    },
    'Invalid domain format'
  ),
});

interface DNSVerificationResult {
  domain: string;
  spfVerified: boolean;
  dkimVerified: boolean;
  dmarcVerified: boolean;
  mxVerified: boolean;
  overallStatus: 'pending' | 'partial' | 'verified' | 'failed';
  lastChecked: Date;
  details: {
    spf: { found: boolean; value?: string; error?: string };
    dkim: { found: boolean; value?: string; error?: string };
    dmarc: { found: boolean; value?: string; error?: string };
    mx: { found: boolean; value?: string; error?: string };
  };
}

async function verifyTXTRecord(hostname: string, expectedValues: string[]): Promise<{ found: boolean; value?: string; error?: string }> {
  try {
    const records = await resolveTxt(hostname);
    const flatRecords = records.flat();
    
    for (const record of flatRecords) {
      for (const expected of expectedValues) {
        if (record.includes(expected)) {
          return { found: true, value: record };
        }
      }
    }
    
    return { found: false, error: 'Expected TXT record not found' };
  } catch (error) {
    return { found: false, error: `DNS lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

async function verifyCNAMERecord(hostname: string, expectedValue: string): Promise<{ found: boolean; value?: string; error?: string }> {
  try {
    const records = await resolveCname(hostname);
    
    for (const record of records) {
      if (record.includes(expectedValue) || record === expectedValue) {
        return { found: true, value: record };
      }
    }
    
    return { found: false, error: 'Expected CNAME record not found' };
  } catch (error) {
    return { found: false, error: `DNS lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

async function verifyMXRecord(hostname: string): Promise<{ found: boolean; value?: string; error?: string }> {
  try {
    const records = await resolveMx(hostname);
    
    if (records && records.length > 0) {
      const mxValues = records.map(mx => `${mx.priority} ${mx.exchange}`).join(', ');
      return { found: true, value: mxValues };
    }
    
    return { found: false, error: 'No MX records found' };
  } catch (error) {
    return { found: false, error: `DNS lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { domain } = verifyDomainSchema.parse(body);

    logger.info('Starting domain verification', { 
      domain, 
      userId: session.user.id,
      organizationId: session.user.organizationId 
    });

    // Perform DNS verification checks
    const verificationPromises = [
      // SPF Record
      verifyTXTRecord(domain, ['v=spf1', 'include:marketsage.africa']),
      
      // DKIM Record
      verifyCNAMERecord(`marketsage._domainkey.${domain}`, 'marketsage.dkim.marketsage.africa'),
      
      // DMARC Record
      verifyTXTRecord(`_dmarc.${domain}`, ['v=DMARC1']),
      
      // MX Record (optional)
      verifyMXRecord(domain)
    ];

    const [spfResult, dkimResult, dmarcResult, mxResult] = await Promise.all(verificationPromises);

    // Calculate overall status
    const verifiedCount = [spfResult.found, dkimResult.found, dmarcResult.found].filter(Boolean).length;
    let overallStatus: 'pending' | 'partial' | 'verified' | 'failed';

    if (verifiedCount === 3) {
      overallStatus = 'verified';
    } else if (verifiedCount > 0) {
      overallStatus = 'partial';
    } else {
      overallStatus = 'failed';
    }

    const result: DNSVerificationResult = {
      domain,
      spfVerified: spfResult.found,
      dkimVerified: dkimResult.found,
      dmarcVerified: dmarcResult.found,
      mxVerified: mxResult.found,
      overallStatus,
      lastChecked: new Date(),
      details: {
        spf: spfResult,
        dkim: dkimResult,
        dmarc: dmarcResult,
        mx: mxResult
      }
    };

    logger.info('Domain verification completed', {
      domain,
      overallStatus,
      verifiedCount,
      userId: session.user.id
    });

    return NextResponse.json(result);

  } catch (error) {
    logger.error('Domain verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Domain verification failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain parameter is required' },
        { status: 400 }
      );
    }

    // Return cached verification status if available
    // For now, we'll just perform a fresh verification
    const body = { domain };
    return POST(request);

  } catch (error) {
    logger.error('Failed to get domain verification status', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { error: 'Failed to get verification status' },
      { status: 500 }
    );
  }
}