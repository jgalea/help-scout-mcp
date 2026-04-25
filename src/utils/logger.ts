import { config } from './config.js';

export interface LogContext {
  requestId?: string;
  duration?: number;
  [key: string]: unknown;
}

/**
 * Resolve log format from env on every read so tests / launchers can
 * change LOG_FORMAT after the module is loaded. Default `json` emits
 * single-line JSON suitable for ingestion by Datadog / Better Stack /
 * CloudWatch / journald. `text` keeps a human-readable form for local
 * dev where console rendering matters more than parseability.
 */
function resolveLogFormat(): 'json' | 'text' {
  const raw = (process.env.LOG_FORMAT || '').toLowerCase();
  return raw === 'text' ? 'text' : 'json';
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

/**
 * Render a log entry as a human-readable single line. Used when
 * LOG_FORMAT=text (local dev convenience). Format:
 *
 *   2026-04-25T12:34:56.789Z [info] Tool call started requestId=abc123 tool=searchConversations
 *
 * Object/array values get JSON.stringify'd inline. Newlines in message
 * stay literal — log aggregators that don't expect them will split,
 * which is acceptable for the local-dev path.
 */
function formatTextLine(entry: Record<string, unknown>): string {
  const { timestamp, level, msg, ...rest } = entry as {
    timestamp: string;
    level: string;
    msg: string;
    [k: string]: unknown;
  };
  const pairs = Object.entries(rest)
    .map(([k, v]) => {
      if (v === null || v === undefined) return `${k}=${v}`;
      if (typeof v === 'string') return `${k}=${v}`;
      if (typeof v === 'number' || typeof v === 'boolean') return `${k}=${v}`;
      try {
        return `${k}=${JSON.stringify(v)}`;
      } catch {
        return `${k}=[unserializable]`;
      }
    })
    .join(' ');
  return `${timestamp} [${level}] ${msg}${pairs ? ' ' + pairs : ''}`;
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

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      msg: message,
      ...context,
    };

    const line = resolveLogFormat() === 'text'
      ? formatTextLine(entry)
      : JSON.stringify(entry);

    // Write logs to stderr (atomic, unbuffered single line) to avoid
    // interfering with MCP protocol on stdout. Direct process.stderr
    // bypasses console's per-arg formatting overhead.
    process.stderr.write(line + '\n');
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