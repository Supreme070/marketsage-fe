/**
 * Markdown Renderer for AI Chat
 * =============================
 * 
 * Enhanced markdown rendering with syntax highlighting, tables, and code blocks
 * optimized for AI responses in MarketSage chat interface.
 */

'use client';

import type React from 'react';
import { memo } from 'react';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'text' }) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="relative group">
      <div className="flex items-center justify-between bg-slate-800 text-slate-300 px-4 py-2 rounded-t-lg text-sm">
        <span className="font-mono">{language}</span>
        <button
          onClick={copyToClipboard}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-200 text-xs"
        >
          Copy
        </button>
      </div>
      <pre className="bg-slate-900 text-slate-100 p-4 rounded-b-lg overflow-x-auto text-sm">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
};

const InlineCode: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono text-slate-800 dark:text-slate-200">
    {children}
  </code>
);

const parseMarkdown = (content: string): React.ReactNode[] => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentCodeBlock: string[] = [];
  let currentCodeLanguage = '';
  let inCodeBlock = false;
  let listItems: string[] = [];
  let inList = false;
  let tableRows: string[] = [];
  let inTable = false;

  const flushCodeBlock = () => {
    if (currentCodeBlock.length > 0) {
      elements.push(
        <CodeBlock
          key={elements.length}
          code={currentCodeBlock.join('\n')}
          language={currentCodeLanguage}
        />
      );
      currentCodeBlock = [];
      currentCodeLanguage = '';
    }
  };

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={elements.length} className="list-disc ml-6 space-y-1">
          {listItems.map((item, index) => (
            <li key={index} className="text-slate-700 dark:text-slate-300">
              {parseInlineElements(item)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  const flushTable = () => {
    if (tableRows.length > 0) {
      const [header, ...rows] = tableRows;
      const headerCells = header.split('|').map(cell => cell.trim()).filter(Boolean);
      
      elements.push(
        <div key={elements.length} className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-slate-200 dark:border-slate-700">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800">
                {headerCells.map((cell, index) => (
                  <th key={index} className="border border-slate-200 dark:border-slate-700 px-4 py-2 text-left">
                    {parseInlineElements(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.filter(row => !row.match(/^\s*\|[\s\-\|]*\|\s*$/)).map((row, rowIndex) => {
                const cells = row.split('|').map(cell => cell.trim()).filter(Boolean);
                return (
                  <tr key={rowIndex} className="border-b border-slate-200 dark:border-slate-700">
                    {cells.map((cell, cellIndex) => (
                      <td key={cellIndex} className="border border-slate-200 dark:border-slate-700 px-4 py-2">
                        {parseInlineElements(cell)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
    }
  };

  const parseInlineElements = (text: string): React.ReactNode => {
    // Handle inline code
    let result: React.ReactNode = text;
    
    // Bold text
    result = text.replace(/\*\*(.*?)\*\*/g, (match, content) => {
      return `<strong>${content}</strong>`;
    });
    
    // Italic text
    result = result.replace(/\*(.*?)\*/g, (match, content) => {
      return `<em>${content}</em>`;
    });
    
    // Links
    result = result.replace(/\[([^\]]*)\]\(([^)]*)\)/g, (match, text, url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">${text}</a>`;
    });
    
    // Inline code
    const parts = result.split(/(`[^`]+`)/);
    return parts.map((part, index) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return <InlineCode key={index}>{part.slice(1, -1)}</InlineCode>;
      }
      return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
    });
  };

  lines.forEach((line, index) => {
    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock();
        inCodeBlock = false;
      } else {
        flushList();
        flushTable();
        inCodeBlock = true;
        currentCodeLanguage = line.slice(3).trim() || 'text';
      }
      return;
    }

    if (inCodeBlock) {
      currentCodeBlock.push(line);
      return;
    }

    // Tables
    if (line.includes('|') && line.trim().length > 0) {
      if (!inTable) {
        flushList();
        inTable = true;
      }
      tableRows.push(line);
      return;
    } else if (inTable) {
      flushTable();
      inTable = false;
    }

    // Lists
    if (line.match(/^\s*[-*+]\s/)) {
      if (!inList) {
        flushTable();
        inList = true;
      }
      listItems.push(line.replace(/^\s*[-*+]\s/, ''));
      return;
    } else if (inList && line.trim() === '') {
      // Continue list with empty line
      return;
    } else if (inList) {
      flushList();
      inList = false;
    }

    // Headers
    if (line.startsWith('#')) {
      flushList();
      flushTable();
      const level = line.match(/^#+/)?.[0].length || 1;
      const text = line.replace(/^#+\s*/, '');
      const HeaderTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements;
      
      elements.push(
        <HeaderTag
          key={elements.length}
          className={cn(
            'font-semibold text-slate-900 dark:text-white',
            level === 1 && 'text-2xl mb-4',
            level === 2 && 'text-xl mb-3',
            level === 3 && 'text-lg mb-2',
            level >= 4 && 'text-base mb-2'
          )}
        >
          {parseInlineElements(text)}
        </HeaderTag>
      );
      return;
    }

    // Blockquotes
    if (line.startsWith('>')) {
      flushList();
      flushTable();
      const text = line.replace(/^>\s*/, '');
      elements.push(
        <blockquote key={elements.length} className="border-l-4 border-slate-300 dark:border-slate-600 pl-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-r">
          <p className="text-slate-700 dark:text-slate-300 italic">
            {parseInlineElements(text)}
          </p>
        </blockquote>
      );
      return;
    }

    // Regular paragraphs
    if (line.trim().length > 0) {
      flushList();
      flushTable();
      elements.push(
        <p key={elements.length} className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
          {parseInlineElements(line)}
        </p>
      );
    } else {
      // Empty line - add spacing
      elements.push(<div key={elements.length} className="h-2" />);
    }
  });

  // Flush any remaining blocks
  flushCodeBlock();
  flushList();
  flushTable();

  return elements;
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = memo(({ content, className }) => {
  const elements = parseMarkdown(content);

  return (
    <div className={cn('prose prose-slate max-w-none', className)}>
      {elements}
    </div>
  );
});

MarkdownRenderer.displayName = 'MarkdownRenderer';