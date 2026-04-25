describe('Logger', () => {
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  let stderrWrites: string[];
  let stderrSpy: jest.SpyInstance;

  beforeEach(() => {
    stderrWrites = [];
    // Spy on process.stderr.write — Logger writes single-line entries
    // there directly (not via console.error) for atomic line writes.
    stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation((chunk: any) => {
      stderrWrites.push(typeof chunk === 'string' ? chunk : chunk.toString());
      return true;
    });

    process.env.LOG_LEVEL = 'debug';
    process.env.LOG_FORMAT = 'json';
  });

  afterEach(() => {
    stderrSpy.mockRestore();
    process.stderr.write = originalStderrWrite;
    delete process.env.LOG_FORMAT;
    jest.clearAllMocks();
  });

  describe('log levels', () => {
    it('should log debug messages', async () => {
      const { logger } = await import('../utils/logger.js');
      logger.debug('debug message', { extra: 'data' });
      expect(stderrWrites.length).toBe(1);
      expect(stderrWrites[0]).toContain('debug message');
    });

    it('should log info messages', async () => {
      const { logger } = await import('../utils/logger.js');
      logger.info('info message', { extra: 'data' });
      expect(stderrWrites.length).toBe(1);
      expect(stderrWrites[0]).toContain('info message');
    });

    it('should log warn messages', async () => {
      const { logger } = await import('../utils/logger.js');
      logger.warn('warn message', { extra: 'data' });
      expect(stderrWrites.length).toBe(1);
      expect(stderrWrites[0]).toContain('warn message');
    });

    it('should log error messages', async () => {
      const { logger } = await import('../utils/logger.js');
      logger.error('error message', { extra: 'data' });
      expect(stderrWrites.length).toBe(1);
      expect(stderrWrites[0]).toContain('error message');
    });
  });

  describe('JSON shape (LOG_FORMAT=json, default)', () => {
    it('emits single-line JSON ending in \\n', async () => {
      const { logger } = await import('../utils/logger.js');
      logger.info('hello');
      expect(stderrWrites.length).toBe(1);
      const line = stderrWrites[0];
      expect(line.endsWith('\n')).toBe(true);
      // exactly one newline at the end (line is single-line JSON)
      expect(line.match(/\n/g)?.length).toBe(1);
      const parsed = JSON.parse(line.trimEnd());
      expect(parsed.msg).toBe('hello');
      expect(parsed.level).toBe('info');
      expect(typeof parsed.timestamp).toBe('string');
    });

    it('uses `msg` (not `message`) for the human-readable text', async () => {
      const { logger } = await import('../utils/logger.js');
      logger.info('field-name check');
      const parsed = JSON.parse(stderrWrites[0].trimEnd());
      expect(parsed.msg).toBe('field-name check');
      expect(parsed.message).toBeUndefined();
    });

    it('propagates structured context fields verbatim', async () => {
      const { logger } = await import('../utils/logger.js');
      logger.info('Tool call started', {
        requestId: 'abc123',
        tool: 'searchConversations',
        mailboxId: '123',
        durationMs: 42,
        hasError: false,
      });
      const parsed = JSON.parse(stderrWrites[0].trimEnd());
      expect(parsed).toMatchObject({
        msg: 'Tool call started',
        level: 'info',
        requestId: 'abc123',
        tool: 'searchConversations',
        mailboxId: '123',
        durationMs: 42,
        hasError: false,
      });
    });

    it('emits a valid ISO-8601 timestamp', async () => {
      const { logger } = await import('../utils/logger.js');
      logger.info('timestamp test');
      const parsed = JSON.parse(stderrWrites[0].trimEnd());
      expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('handles complex metadata without crashing', async () => {
      const { logger } = await import('../utils/logger.js');
      logger.error('complex log', {
        nested: { deep: { value: 'test' } },
        array: [1, 2, 3],
        error: new Error('test error'),
      });
      // JSON.stringify of Error returns '{}', but the line must still parse.
      const parsed = JSON.parse(stderrWrites[0].trimEnd());
      expect(parsed.msg).toBe('complex log');
    });

    it('handles logging without metadata', async () => {
      const { logger } = await import('../utils/logger.js');
      logger.info('simple message');
      const parsed = JSON.parse(stderrWrites[0].trimEnd());
      expect(parsed.msg).toBe('simple message');
    });
  });

  describe('LOG_FORMAT=text', () => {
    beforeEach(() => {
      process.env.LOG_FORMAT = 'text';
    });

    it('emits human-readable single line, not JSON', async () => {
      const { logger } = await import('../utils/logger.js');
      logger.info('Tool call started', { requestId: 'abc123', tool: 'searchConversations' });
      const line = stderrWrites[0];
      expect(line.endsWith('\n')).toBe(true);
      // Text mode: no leading `{`
      expect(line.startsWith('{')).toBe(false);
      expect(line).toContain('[info]');
      expect(line).toContain('Tool call started');
      expect(line).toContain('requestId=abc123');
      expect(line).toContain('tool=searchConversations');
    });
  });

  describe('redactArgs', () => {
    it('redacts top-level PII string fields by length', async () => {
      const { redactArgs } = await import('../utils/logger.js');
      const out = redactArgs({
        conversationId: '12345',
        text: 'Hello world',
        customerEmail: 'user@example.com',
      }) as Record<string, unknown>;
      expect(out.conversationId).toBe('12345');
      expect(out.text).toBe('[REDACTED 11 chars]');
      expect(out.customerEmail).toBe('[REDACTED 16 chars]');
    });

    it('redacts non-string PII fields with a generic marker', async () => {
      const { redactArgs } = await import('../utils/logger.js');
      const out = redactArgs({
        cc: ['a@example.com', 'b@example.com'],
        customer: { id: 7 },
      }) as Record<string, unknown>;
      expect(out.cc).toBe('[REDACTED]');
      expect(out.customer).toBe('[REDACTED]');
    });

    it('recursively redacts nested objects but keeps non-PII shape', async () => {
      const { redactArgs } = await import('../utils/logger.js');
      const out = redactArgs({
        threads: [
          { type: 'customer', text: 'secret message', draft: true },
        ],
      }) as Record<string, unknown>;
      const threads = out.threads as Array<Record<string, unknown>>;
      expect(threads[0].type).toBe('customer');
      expect(threads[0].draft).toBe(true);
      expect(threads[0].text).toBe('[REDACTED 14 chars]');
    });

    it('returns primitives and null/undefined unchanged', async () => {
      const { redactArgs } = await import('../utils/logger.js');
      expect(redactArgs(null)).toBeNull();
      expect(redactArgs(undefined)).toBeUndefined();
      expect(redactArgs('plain')).toBe('plain');
      expect(redactArgs(42)).toBe(42);
    });
  });
});