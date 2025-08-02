"use client";

import type React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  X, 
  User, 
  Building,
  Megaphone,
  Ticket,
  FileText,
  ArrowRight,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchResult {
  id: string;
  type: 'user' | 'organization' | 'campaign' | 'ticket' | 'document';
  title: string;
  subtitle?: string;
  metadata?: Record<string, any>;
  url: string;
}

interface GlobalSearchProps {
  onClose: () => void;
}

export function GlobalSearch({ onClose }: GlobalSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const debouncedQuery = useDebounce(query, 300);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Search API call
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/search?q=${encodeURIComponent(debouncedQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.results);
          setSelectedIndex(0);
        }
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [results, selectedIndex, onClose]);

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url);
    onClose();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'user':
        return User;
      case 'organization':
        return Building;
      case 'campaign':
        return Megaphone;
      case 'ticket':
        return Ticket;
      case 'document':
        return FileText;
      default:
        return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'user':
        return 'bg-blue-100 text-blue-700';
      case 'organization':
        return 'bg-purple-100 text-purple-700';
      case 'campaign':
        return 'bg-green-100 text-green-700';
      case 'ticket':
        return 'bg-orange-100 text-orange-700';
      case 'document':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const typeLabels = {
    user: 'Users',
    organization: 'Organizations',
    campaign: 'Campaigns',
    ticket: 'Support Tickets',
    document: 'Documents'
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="relative top-20 mx-auto max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="relative border-b border-gray-200">
          <div className="flex items-center px-4 py-3">
            <Search className="h-5 w-5 text-gray-400 mr-3" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search users, organizations, campaigns, tickets..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 border-0 focus:ring-0 text-base placeholder:text-gray-400"
            />
            {isLoading && (
              <Loader2 className="h-5 w-5 text-gray-400 animate-spin mr-3" />
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Search Results */}
        <ScrollArea className="max-h-[60vh]">
          {query.length >= 2 && !isLoading && results.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-gray-500">No results found for "{query}"</p>
              <p className="text-sm text-gray-400 mt-2">Try searching with different keywords</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="py-2">
              {Object.entries(groupedResults).map(([type, typeResults]) => (
                <div key={type} className="mb-4">
                  <div className="px-4 py-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {typeLabels[type as keyof typeof typeLabels] || type}
                    </h3>
                  </div>
                  {typeResults.map((result, index) => {
                    const Icon = getIcon(result.type);
                    const globalIndex = results.findIndex(r => r.id === result.id);
                    const isSelected = globalIndex === selectedIndex;

                    return (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={cn(
                          "w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors",
                          isSelected && "bg-gray-50"
                        )}
                      >
                        <div className={cn(
                          "p-2 rounded-lg",
                          getTypeColor(result.type)
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {result.title}
                            </span>
                            {result.metadata?.status && (
                              <Badge variant="outline" className="text-xs">
                                {result.metadata.status}
                              </Badge>
                            )}
                          </div>
                          {result.subtitle && (
                            <p className="text-sm text-gray-500 mt-0.5">
                              {result.subtitle}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          {query.length < 2 && (
            <div className="p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    router.push('/admin/users/new');
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-sm text-gray-700">Create new user</span>
                </button>
                <button
                  onClick={() => {
                    router.push('/admin/campaigns/new');
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-sm text-gray-700">Create new campaign</span>
                </button>
                <button
                  onClick={() => {
                    router.push('/admin/support/tickets/new');
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-sm text-gray-700">Create support ticket</span>
                </button>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Search Tips */}
        {query.length === 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              <span className="font-medium">Pro tip:</span> Use shortcuts like 
              <kbd className="mx-1 px-1.5 py-0.5 text-xs bg-white rounded border border-gray-300">u:</kbd>
              for users,
              <kbd className="mx-1 px-1.5 py-0.5 text-xs bg-white rounded border border-gray-300">c:</kbd>
              for campaigns
            </p>
          </div>
        )}
      </div>
    </div>
  );
}