'use client';

import { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  AlertCircle, 
  Ban, 
  Lock, 
  Search, 
  ServerCrash, 
  ShieldAlert, 
  AlertTriangle
} from 'lucide-react';

// Error types enum (must match the backend ErrorType enum)
enum ErrorType {
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  CONFLICT = "CONFLICT",
  RATE_LIMIT = "RATE_LIMIT",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  SERVER_ERROR = "SERVER_ERROR",
}

// Error code documentation
const errorCodes = [
  {
    code: ErrorType.UNAUTHORIZED,
    status: 401,
    message: 'Authentication is required to access this resource',
    remediation: 'Log in or provide valid authentication credentials',
    icon: <Lock className="h-4 w-4" />,
    color: 'bg-yellow-500'
  },
  {
    code: ErrorType.FORBIDDEN,
    status: 403,
    message: 'You do not have permission to access this resource',
    remediation: 'Contact your administrator to request access',
    icon: <Ban className="h-4 w-4" />,
    color: 'bg-red-500'
  },
  {
    code: ErrorType.NOT_FOUND,
    status: 404,
    message: 'The requested resource could not be found',
    remediation: 'Verify the ID or path is correct',
    icon: <Search className="h-4 w-4" />,
    color: 'bg-blue-500'
  },
  {
    code: ErrorType.VALIDATION_ERROR,
    status: 400,
    message: 'The request contains invalid or missing data',
    remediation: 'Check the request format and required fields',
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'bg-orange-500'
  },
  {
    code: ErrorType.CONFLICT,
    status: 409,
    message: 'The request conflicts with the current state',
    remediation: 'Modify your request to resolve the conflict',
    icon: <ShieldAlert className="h-4 w-4" />,
    color: 'bg-purple-500'
  },
  {
    code: ErrorType.RATE_LIMIT,
    status: 429,
    message: 'Too many requests in a given amount of time',
    remediation: 'Reduce request frequency or implement backoff strategy',
    icon: <AlertCircle className="h-4 w-4" />,
    color: 'bg-yellow-700'
  },
  {
    code: ErrorType.EXTERNAL_SERVICE_ERROR,
    status: 502,
    message: 'Error communicating with an external service',
    remediation: 'Check external service status or credentials',
    icon: <ServerCrash className="h-4 w-4" />,
    color: 'bg-gray-500'
  },
  {
    code: ErrorType.DATABASE_ERROR,
    status: 500,
    message: 'Error interacting with the database',
    remediation: 'Check database connection and schema',
    icon: <ServerCrash className="h-4 w-4" />,
    color: 'bg-red-700'
  },
  {
    code: ErrorType.SERVER_ERROR,
    status: 500,
    message: 'An unexpected error occurred on the server',
    remediation: 'Contact support with the error details',
    icon: <ServerCrash className="h-4 w-4" />,
    color: 'bg-red-700'
  }
];

export default function ErrorCodes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredErrors, setFilteredErrors] = useState(errorCodes);

  // Filter error codes when search term changes
  useEffect(() => {
    const filtered = errorCodes.filter(error => 
      error.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.remediation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.status.toString().includes(searchTerm)
    );
    setFilteredErrors(filtered);
  }, [searchTerm]);

  return (
    <div className="container max-w-7xl mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">API Error Codes</h1>
        <p className="text-muted-foreground">
          Reference guide for all API error codes and their troubleshooting steps
        </p>
      </div>

      <div className="flex w-full max-w-sm items-center space-x-2 mb-6">
        <Input 
          type="search" 
          placeholder="Search error codes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
        <Search className="h-4 w-4 text-muted-foreground" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Error Code Reference</CardTitle>
          <CardDescription>
            Use this table to identify and troubleshoot API errors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>A list of all MarketSage API error codes</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Status</TableHead>
                <TableHead className="w-[150px]">Code</TableHead>
                <TableHead className="w-[350px]">Message</TableHead>
                <TableHead>Remediation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredErrors.length > 0 ? (
                filteredErrors.map((error) => (
                  <TableRow key={error.code}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {error.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className={`p-1 rounded-full ${error.color}`}>
                          {error.icon}
                        </div>
                        <span className="font-mono text-xs">{error.code}</span>
                      </div>
                    </TableCell>
                    <TableCell>{error.message}</TableCell>
                    <TableCell className="text-muted-foreground">{error.remediation}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    No error codes match your search
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 