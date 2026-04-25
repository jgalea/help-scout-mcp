import { config } from './config.js';

export interface LogContext {
  requestId?: string;
  duration?: number;
  [key: string]: unknown;
}

/**
 * Field names whose values are likely to contain customer PII or message
 * content. These are redacted from tool-call argument logs unless the
 * operator has explicitly opted in (LOG_LEVEL=debug AND LOG_INCLUDE_PII=true).
 *
 * Hits stay loud — we still emit the field name and the redacted length —
 * so debugging is possible without leaking the body.
 */
const PII_FIELDS = new Set([
  'text', 'body', 'email', 'customerEmail', 'cc', 'bcc',
  'customer', 'firstName', 'lastName', 'subject', 'searchTerms',
  'contentTerms', 'subjectTerms',
]);

/**
 * Recursively redact known-PII fields from an arbitrary argument object.
 * Strings get a length-only marker (`[REDACTED 42 chars]`); everything
 * else collapses to `[REDACTED]`. Non-PII fields pass through unchanged
 * so tool/arg shape stays inspectable.
 */
export function redactArgs(args: unknown): unknown {
  if (!args || typeof args !== 'object') return args;
  if (Array.isArray(args)) {
    return args.map((item) => redactArgs(item));
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(args as Record<string, unknown>)) {
    if (PII_FIELDS.has(k)) {
      out[k] = typeof v === 'string'
        ? `[REDACTED ${v.length} chars]`
        : '[REDACTED]';
    } else if (v && typeof v === 'object') {
      out[k] = redactArgs(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export class Logger {
  private level: string;

  constructor() {
    this.level = config.logging.level;
  }

  private shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(this.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  private log(level: string, message: string, context: LogContext = {}): void {
    if (!this.shouldLog(level)) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    };

    // Write logs to stderr to avoid interfering with MCP protocol on stdout
    console.error(JSON.stringify(logEntry));
  }

  error(message: string, context: LogContext = {}): void {
    this.log('error', message, context);
  }

  warn(message: string, context: LogContext = {}): void {
    this.log('warn', message, context);
  }

  info(message: string, context: LogContext = {}): void {
    this.log('info', message, context);
  }

  debug(message: string, context: LogContext = {}): void {
    this.log('debug', message, context);
  }
}

export const logger = new Logger();