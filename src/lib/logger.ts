/**
 * Centralized logging utility for the application
 */

// Log levels
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

// Interface for structured log entries
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  path?: string;
  user?: string;
}

/**
 * Log a message at the specified level
 */
function log(level: LogLevel, message: string, context?: any, path?: string, user?: string) {
  const timestamp = new Date().toISOString();
  
  const logEntry: LogEntry = {
    timestamp,
    level,
    message,
    ...(context && { context }),
    ...(path && { path }),
    ...(user && { user }),
  };

  // In production, you would send to a proper logging service
  // For now, format the log based on environment
  if (process.env.NODE_ENV === 'production') {
    // In production, log as JSON for better parsing
    console.log(JSON.stringify(logEntry));
  } else {
    // In development, use formatted logs for readability
    const colorize = getColorizer(level);
    const prefix = `[${timestamp.split('T')[1].replace('Z', '')}] ${colorize(level)}:`;
    
    if (context) {
      console.log(prefix, message, context);
    } else {
      console.log(prefix, message);
    }
  }

  return logEntry;
}

/**
 * Get a colorizing function for log levels in development
 */
function getColorizer(level: LogLevel): (text: string) => string {
  const colors = {
    [LogLevel.DEBUG]: '\x1b[34m', // Blue
    [LogLevel.INFO]: '\x1b[32m',  // Green
    [LogLevel.WARN]: '\x1b[33m',  // Yellow
    [LogLevel.ERROR]: '\x1b[31m', // Red
    [LogLevel.FATAL]: '\x1b[35m', // Purple
  };
  
  const reset = '\x1b[0m';
  return (text: string) => `${colors[level]}${text}${reset}`;
}

// Export individual logging functions
export const logger = {
  debug: (message: string, context?: any, path?: string, user?: string) => 
    log(LogLevel.DEBUG, message, context, path, user),
    
  info: (message: string, context?: any, path?: string, user?: string) => 
    log(LogLevel.INFO, message, context, path, user),
    
  warn: (message: string, context?: any, path?: string, user?: string) => 
    log(LogLevel.WARN, message, context, path, user),
    
  error: (message: string, context?: any, path?: string, user?: string) => 
    log(LogLevel.ERROR, message, context, path, user),
    
  fatal: (message: string, context?: any, path?: string, user?: string) => 
    log(LogLevel.FATAL, message, context, path, user),
}; 