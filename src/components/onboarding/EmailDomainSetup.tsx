"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, CheckCircle, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DNSRecord {
  type: 'TXT' | 'CNAME' | 'MX';
  name: string;
  value: string;
  description: string;
  priority?: number;
}

interface DomainVerificationStatus {
  domain: string;
  spfVerified: boolean;
  dkimVerified: boolean;
  dmarcVerified: boolean;
  mxVerified: boolean;
  overallStatus: 'pending' | 'partial' | 'verified' | 'failed';
  lastChecked: Date;
}

export function EmailDomainSetup() {
  const [domain, setDomain] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<DomainVerificationStatus | null>(null);
  const { toast } = useToast();

  // Generate DNS records based on domain
  const generateDNSRecords = (domainName: string): DNSRecord[] => {
    if (!domainName) return [];

    return [
      // SPF Record
      {
        type: 'TXT',
        name: domainName,
        value: 'v=spf1 include:marketsage.africa include:_spf.google.com ~all',
        description: 'SPF (Sender Policy Framework) - Prevents email spoofing by specifying which servers can send email for your domain.'
      },
      
      // DKIM Record
      {
        type: 'CNAME',
        name: `marketsage._domainkey.${domainName}`,
        value: 'marketsage.dkim.marketsage.africa',
        description: 'DKIM (DomainKeys Identified Mail) - Adds a digital signature to your emails for authentication.'
      },
      
      // DMARC Record
      {
        type: 'TXT',
        name: `_dmarc.${domainName}`,
        value: 'v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@marketsage.africa; ruf=mailto:dmarc-failures@marketsage.africa; sp=quarantine; adkim=r; aspf=r;',
        description: 'DMARC (Domain-based Message Authentication) - Protects your domain from unauthorized use and provides reporting.'
      },
      
      // MX Record (Optional - for receiving emails)
      {
        type: 'MX',
        name: domainName,
        value: 'mail.marketsage.africa',
        priority: 10,
        description: 'MX (Mail Exchange) - Optional: Allows your domain to receive emails through MarketSage infrastructure.'
      }
    ];
  };

  const dnsRecords = generateDNSRecords(domain);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please copy manually",
        variant: "destructive",
      });
    }
  };

  const verifyDomain = async () => {
    if (!domain) {
      toast({
        title: "Domain required",
        description: "Please enter a domain name to verify",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    
    try {
      // Call verification API
      const response = await fetch('/api/onboarding/verify-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain })
      });

      if (!response.ok) {
        throw new Error('Verification failed');
      }

      const result = await response.json();
      setVerificationStatus(result);

      if (result.overallStatus === 'verified') {
        toast({
          title: "Domain verified!",
          description: "Your domain is now ready for email sending",
        });
      } else {
        toast({
          title: "Verification incomplete",
          description: `${result.verifiedCount || 0} of 4 DNS records verified`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Verification failed",
        description: "Please check your DNS settings and try again",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const getStatusIcon = (verified: boolean) => {
    return verified ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-yellow-500" />
    );
  };

  const getOverallStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: 'Pending' },
      partial: { variant: 'destructive' as const, label: 'Partial' },
      verified: { variant: 'default' as const, label: 'Verified' },
      failed: { variant: 'destructive' as const, label: 'Failed' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Email Domain Configuration</span>
            {verificationStatus && getOverallStatusBadge(verificationStatus.overallStatus)}
          </CardTitle>
          <CardDescription>
            Configure your domain for email sending with SPF, DKIM, and DMARC records
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="domain">Your Domain</Label>
            <div className="flex gap-2">
              <Input
                id="domain"
                placeholder="yourdomain.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value.toLowerCase())}
                className="flex-1"
              />
              <Button 
                onClick={verifyDomain} 
                disabled={!domain || isVerifying}
                className="px-6"
              >
                {isVerifying ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  'Verify'
                )}
              </Button>
            </div>
          </div>

          {verificationStatus && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Verification Status</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  {getStatusIcon(verificationStatus.spfVerified)}
                  <span>SPF Record</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(verificationStatus.dkimVerified)}
                  <span>DKIM Record</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(verificationStatus.dmarcVerified)}
                  <span>DMARC Record</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(verificationStatus.mxVerified)}
                  <span>MX Record (Optional)</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Last checked: {verificationStatus.lastChecked.toLocaleString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {domain && dnsRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>DNS Records to Add</CardTitle>
            <CardDescription>
              Add these DNS records to your domain's DNS settings. Changes may take up to 48 hours to propagate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="table" className="w-full">
              <TabsList>
                <TabsTrigger value="table">Table View</TabsTrigger>
                <TabsTrigger value="instructions">Step-by-Step</TabsTrigger>
              </TabsList>
              
              <TabsContent value="table" className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200 dark:border-gray-700 text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border p-2 text-left">Type</th>
                        <th className="border p-2 text-left">Name</th>
                        <th className="border p-2 text-left">Value</th>
                        <th className="border p-2 text-left">Priority</th>
                        <th className="border p-2 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dnsRecords.map((record, index) => (
                        <tr key={index}>
                          <td className="border p-2 font-mono">{record.type}</td>
                          <td className="border p-2 font-mono text-xs">{record.name}</td>
                          <td className="border p-2 font-mono text-xs max-w-md break-all">{record.value}</td>
                          <td className="border p-2">{record.priority || '-'}</td>
                          <td className="border p-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(record.value, record.type)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
              
              <TabsContent value="instructions" className="space-y-4">
                {dnsRecords.map((record, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Badge variant="outline">{record.type}</Badge>
                        {record.type} Record
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{record.description}</p>
                      
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs font-medium">Name/Host:</Label>
                          <div className="flex items-center gap-2">
                            <code className="bg-muted px-2 py-1 rounded text-xs flex-1">{record.name}</code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(record.name, 'Name')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-xs font-medium">Value:</Label>
                          <div className="flex items-center gap-2">
                            <code className="bg-muted px-2 py-1 rounded text-xs flex-1 break-all">{record.value}</code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(record.value, 'Value')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {record.priority && (
                          <div>
                            <Label className="text-xs font-medium">Priority:</Label>
                            <code className="bg-muted px-2 py-1 rounded text-xs ml-2">{record.priority}</code>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {domain && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">DNS Provider Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'Cloudflare', url: 'https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/' },
                { name: 'Namecheap', url: 'https://www.namecheap.com/support/knowledgebase/article.aspx/317/2237/how-do-i-add-txtspfdkimdmarc-records-for-my-domain/' },
                { name: 'GoDaddy', url: 'https://www.godaddy.com/help/add-a-txt-record-19232' },
                { name: 'Google Domains', url: 'https://support.google.com/domains/answer/3290350' },
                { name: 'Route 53', url: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-creating.html' },
                { name: 'Other Providers', url: '#' }
              ].map((provider) => (
                <Button
                  key={provider.name}
                  variant="outline"
                  className="justify-between"
                  onClick={() => provider.url !== '#' && window.open(provider.url, '_blank')}
                  disabled={provider.url === '#'}
                >
                  {provider.name}
                  {provider.url !== '#' && <ExternalLink className="h-3 w-3" />}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}