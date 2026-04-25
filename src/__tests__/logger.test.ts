describe('Logger', () => {
  const originalConsoleError = console.error;
  let mockConsoleError: jest.Mock;

  beforeEach(() => {
    // Mock console.error since Logger writes all output to stderr via console.error
    mockConsoleError = jest.fn();
    console.error = mockConsoleError;
    
    // Set log level to debug to capture all messages
    process.env.LOG_LEVEL = 'debug';
  });

  afterEach(() => {
    // Restore original console.error
    console.error = originalConsoleError;
    jest.clearAllMocks();
  });

  describe('log levels', () => {
    it('should log debug messages', async () => {
      // Import logger after setting environment
      const { logger } = await import('../utils/logger.js');
      logger.debug('debug message', { extra: 'data' });
      expect(mockConsoleError).toHaveBeenCalled();
      const call = mockConsoleError.mock.calls[0];
      expect(call[0]).toContain('debug message');
    });

    it('should log info messages', async () => {
      const { logger } = await import('../utils/logger.js');
      logger.info('info message', { extra: 'data' });
      expect(mockConsoleError).toHaveBeenCalled();
      const call = mockConsoleError.mock.calls[0];
      expect(call[0]).toContain('info message');
    });

    it('should log warn messages', async () => {
      const { logger } = await import('../utils/logger.js');
      logger.warn('warn message', { extra: 'data' });
      expect(mockConsoleError).toHaveBeenCalled();
      const call = mockConsoleError.mock.calls[0];
      expect(call[0]).toContain('warn message');
    });

    it('should log error messages', async () => {
      const { logger } = await import('../utils/logger.js');
      logger.error('error message', { extra: 'data' });
      expect(mockConsoleError).toHaveBeenCalled();
      const call = mockConsoleError.mock.calls[0];
      expect(call[0]).toContain('error message');
    });
  });

  describe('structured logging', () => {
    it('should include metadata in log output', async () => {
      const { logger } = await import('../utils/logger.js');
      const metadata = { requestId: '123', userId: 'user-456' };
      logger.info('test message', metadata);
      
      expect(mockConsoleError).toHaveBeenCalled();
      const call = mockConsoleError.mock.calls[0];
      const logString = call[0];
      expect(logString).toContain('requestId');
      expect(logString).toContain('123');
    });

    it('should handle logging without metadata', async () => {
      const { logger } = await import('../utils/logger.js');
      logger.info('simple message');
      expect(mockConsoleError).toHaveBeenCalled();
      const call = mockConsoleError.mock.calls[0];
      expect(call[0]).toContain('simple message');
    });

    it('should handle complex metadata objects', async () => {
      const { logger } = await import('../utils/logger.js');
      const complexData = {
        nested: { deep: { value: 'test' } },
        array: [1, 2, 3],
        error: new Error('test error'),
      };
      
      logger.error('complex log', complexData);
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe('timestamp formatting', () => {
    it('should include timestamps in log output', async () => {
      const { logger } = await import('../utils/logger.js');
      logger.info('timestamp test');
      expect(mockConsoleError).toHaveBeenCalled();
      const call = mockConsoleError.mock.calls[0];
      const logString = call[0];
      // Should contain ISO timestamp format
      expect(logString).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
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