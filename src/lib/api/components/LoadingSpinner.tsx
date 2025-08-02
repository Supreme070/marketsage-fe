'use client';

import type React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'gray' | 'white';
  className?: string;
  text?: string;
  overlay?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const colorClasses = {
  primary: 'text-blue-600',
  secondary: 'text-purple-600',
  gray: 'text-gray-400',
  white: 'text-white',
};

export function LoadingSpinner({
  size = 'md',
  color = 'primary',
  className = '',
  text,
  overlay = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={`flex items-center justify-center ${overlay ? 'flex-col' : ''}`}>
      <svg
        className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {text && (
        <p className={`mt-2 text-sm ${colorClasses[color]} animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 shadow-lg">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
}

interface LoadingStateProps {
  loading: boolean;
  error?: Error | null;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  className?: string;
}

export function LoadingState({
  loading,
  error,
  children,
  loadingComponent,
  errorComponent,
  className = '',
}: LoadingStateProps) {
  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        {loadingComponent || <LoadingSpinner text="Loading..." />}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        {errorComponent || (
          <div className="text-center">
            <div className="text-red-600 mb-2">
              <svg
                className="h-12 w-12 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <p className="text-red-600 font-medium">Error loading data</p>
            <p className="text-gray-500 text-sm mt-1">{error.message}</p>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
}

interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

export function Skeleton({ className = '', animate = true }: SkeletonProps) {
  return (
    <div
      className={`bg-gray-200 rounded ${animate ? 'animate-pulse' : ''} ${className}`}
    />
  );
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className = '' }: SkeletonTextProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={`h-4 ${
            index === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  className?: string;
  showAvatar?: boolean;
  lines?: number;
}

export function SkeletonCard({
  className = '',
  showAvatar = false,
  lines = 3,
}: SkeletonCardProps) {
  return (
    <div className={`p-4 border border-gray-200 rounded-lg ${className}`}>
      <div className="flex space-x-3">
        {showAvatar && <Skeleton className="h-10 w-10 rounded-full" />}
        <div className="flex-1">
          <Skeleton className="h-4 w-1/2 mb-2" />
          <SkeletonText lines={lines} />
        </div>
      </div>
    </div>
  );
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className = '',
}: SkeletonTableProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`header-${index}`} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              className="h-4 flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Higher-order component for adding loading states
export function withLoadingState<P extends object>(
  Component: React.ComponentType<P>,
  loadingProps?: {
    loadingComponent?: React.ReactNode;
    errorComponent?: React.ReactNode;
  }
) {
  return function WrappedComponent(
    props: P & { loading?: boolean; error?: Error | null }
  ) {
    const { loading, error, ...componentProps } = props;

    return (
      <LoadingState
        loading={loading || false}
        error={error || null}
        loadingComponent={loadingProps?.loadingComponent}
        errorComponent={loadingProps?.errorComponent}
      >
        <Component {...(componentProps as P)} />
      </LoadingState>
    );
  };
}