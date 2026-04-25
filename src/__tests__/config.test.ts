describe('Config Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables
    jest.resetModules();
    process.env = { ...originalEnv };
    // Clear all HELPSCOUT_ vars
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('HELPSCOUT_')) {
        delete process.env[key];
      }
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validateConfig', () => {
    it('should pass with valid OAuth2 configuration using APP_ID/APP_SECRET', async () => {
      process.env.HELPSCOUT_APP_ID = 'app-id';
      process.env.HELPSCOUT_APP_SECRET = 'app-secret-of-realistic-length-32';
      process.env.HELPSCOUT_BASE_URL = 'https://api.helpscout.net/v2/';

      jest.resetModules();
      const { validateConfig } = await import('../utils/config.js');
      expect(() => validateConfig()).not.toThrow();
    });

    it('should pass with valid OAuth2 configuration using CLIENT_ID/CLIENT_SECRET', async () => {
      process.env.HELPSCOUT_CLIENT_ID = 'client-id';
      process.env.HELPSCOUT_CLIENT_SECRET = 'client-secret-of-realistic-length-32';
      process.env.HELPSCOUT_BASE_URL = 'https://api.helpscout.net/v2/';

      jest.resetModules();
      const { validateConfig } = await import('../utils/config.js');
      expect(() => validateConfig()).not.toThrow();
    });

    it('should reject legacy API_KEY without APP_ID', async () => {
      process.env.HELPSCOUT_API_KEY = 'client-id';
      process.env.HELPSCOUT_APP_SECRET = 'client-secret-of-realistic-length-32';
      process.env.HELPSCOUT_BASE_URL = 'https://api.helpscout.net/v2/';

      jest.resetModules();
      const { validateConfig } = await import('../utils/config.js');
      // API_KEY no longer used as clientId, so this should fail validation
      expect(() => validateConfig()).toThrow(/OAuth2 authentication required/);
    });

    it('should throw error when Personal Access Token is used', async () => {
      process.env.HELPSCOUT_API_KEY = 'Bearer personal-access-token';
      process.env.HELPSCOUT_BASE_URL = 'https://api.helpscout.net/v2/';

      jest.resetModules();
      const { validateConfig } = await import('../utils/config.js');
      expect(() => validateConfig()).toThrow(/Personal Access Tokens are no longer supported/);
    });

    it('should throw error when authentication is missing', async () => {
      jest.resetModules();
      const { validateConfig } = await import('../utils/config.js');
      expect(() => validateConfig()).toThrow(/OAuth2 authentication required/);
    });

    it('should throw error when only client ID is provided without secret', async () => {
      process.env.HELPSCOUT_CLIENT_ID = 'client-id';

      jest.resetModules();
      const { validateConfig } = await import('../utils/config.js');
      expect(() => validateConfig()).toThrow(/OAuth2 authentication required/);
    });

    it('should throw error when base URL uses HTTP instead of HTTPS', async () => {
      process.env.HELPSCOUT_APP_ID = 'app-id';
      process.env.HELPSCOUT_APP_SECRET = 'app-secret-of-realistic-length-32';
      process.env.HELPSCOUT_BASE_URL = 'http://api.helpscout.net/v2/';

      jest.resetModules();
      const { validateConfig } = await import('../utils/config.js');
      expect(() => validateConfig()).toThrow(/Security Error.*HTTPS/);
    });

    it('should use default base URL when not provided', async () => {
      process.env.HELPSCOUT_APP_ID = 'app-id';
      process.env.HELPSCOUT_APP_SECRET = 'app-secret-of-realistic-length-32';
      delete process.env.HELPSCOUT_BASE_URL;

      jest.resetModules();
      const { validateConfig } = await import('../utils/config.js');
      expect(() => validateConfig()).not.toThrow();
    });

    it('should handle boolean environment variables correctly', async () => {
      process.env.HELPSCOUT_APP_ID = 'app-id';
      process.env.HELPSCOUT_APP_SECRET = 'app-secret-of-realistic-length-32';
      process.env.ALLOW_PII = 'true';
      process.env.CACHE_TTL_SECONDS = '600';
      process.env.LOG_LEVEL = 'debug';

      jest.resetModules();
      const { validateConfig } = await import('../utils/config.js');
      expect(() => validateConfig()).not.toThrow();
    });

    it('should handle invalid boolean values gracefully', async () => {
      process.env.HELPSCOUT_APP_ID = 'app-id';
      process.env.HELPSCOUT_APP_SECRET = 'app-secret-of-realistic-length-32';
      process.env.ALLOW_PII = 'invalid-boolean';

      jest.resetModules();
      const { validateConfig } = await import('../utils/config.js');
      expect(() => validateConfig()).not.toThrow();
    });

    it('should handle invalid numeric values gracefully', async () => {
      process.env.HELPSCOUT_APP_ID = 'app-id';
      process.env.HELPSCOUT_APP_SECRET = 'app-secret-of-realistic-length-32';
      process.env.CACHE_TTL_SECONDS = 'not-a-number';

      jest.resetModules();
      const { validateConfig } = await import('../utils/config.js');
      expect(() => validateConfig()).not.toThrow();
    });

    it('should mention HELPSCOUT_APP_ID in error message', async () => {
      jest.resetModules();
      const { validateConfig } = await import('../utils/config.js');
      expect(() => validateConfig()).toThrow(/HELPSCOUT_APP_ID/);
    });

    it('should reject HELPSCOUT_BASE_URL with non-Help-Scout hostname', async () => {
      process.env.HELPSCOUT_APP_ID = 'app-id';
      process.env.HELPSCOUT_APP_SECRET = 'app-secret-of-realistic-length-32';
      process.env.HELPSCOUT_BASE_URL = 'https://evil.example.com/v2/';

      jest.resetModules();
      const { validateConfig } = await import('../utils/config.js');
      expect(() => validateConfig()).toThrow(/not in the allowlist/);
    });

    it('should accept api.helpscout.com as well as api.helpscout.net', async () => {
      process.env.HELPSCOUT_APP_ID = 'app-id';
      process.env.HELPSCOUT_APP_SECRET = 'app-secret-of-realistic-length-32';
      process.env.HELPSCOUT_BASE_URL = 'https://api.helpscout.com/v2/';

      jest.resetModules();
      const { validateConfig } = await import('../utils/config.js');
      expect(() => validateConfig()).not.toThrow();
    });

    it('should reject HELPSCOUT_DOCS_BASE_URL with non-allowed hostname', async () => {
      process.env.HELPSCOUT_APP_ID = 'app-id';
      process.env.HELPSCOUT_APP_SECRET = 'app-secret-of-realistic-length-32';
      process.env.HELPSCOUT_DOCS_BASE_URL = 'https://evil.example.com/v1/';

      jest.resetModules();
      const { validateConfig } = await import('../utils/config.js');
      expect(() => validateConfig()).toThrow(/not in the allowlist/);
    });

    it('should reject HELPSCOUT_DOCS_BASE_URL using HTTP', async () => {
      process.env.HELPSCOUT_APP_ID = 'app-id';
      process.env.HELPSCOUT_APP_SECRET = 'app-secret-of-realistic-length-32';
      process.env.HELPSCOUT_DOCS_BASE_URL = 'http://docsapi.helpscout.net/v1/';

      jest.resetModules();
      const { validateConfig } = await import('../utils/config.js');
      expect(() => validateConfig()).toThrow(/HTTPS/);
    });

    it('should reject HELPSCOUT_APP_SECRET shorter than 24 chars', async () => {
      process.env.HELPSCOUT_APP_ID = 'app-id';
      process.env.HELPSCOUT_APP_SECRET = 'short';
      process.env.HELPSCOUT_BASE_URL = 'https://api.helpscout.net/v2/';

      jest.resetModules();
      const { validateConfig } = await import('../utils/config.js');
      expect(() => validateConfig()).toThrow(/too short/);
    });
  });

  describe('write inbox allowlist', () => {
    it('default-allows when HELPSCOUT_WRITE_INBOX_ALLOWLIST is unset', async () => {
      delete process.env.HELPSCOUT_WRITE_INBOX_ALLOWLIST;
      jest.resetModules();
      const { isWriteInboxAllowed, getWriteInboxAllowlist } = await import('../utils/config.js');
      expect(getWriteInboxAllowlist()).toBeNull();
      expect(isWriteInboxAllowed('123')).toBe(true);
      expect(isWriteInboxAllowed(456)).toBe(true);
      expect(isWriteInboxAllowed(undefined)).toBe(true);
    });

    it('only allows listed mailbox IDs when set', async () => {
      process.env.HELPSCOUT_WRITE_INBOX_ALLOWLIST = '123, 456 ,789';
      jest.resetModules();
      const { isWriteInboxAllowed, getWriteInboxAllowlist } = await import('../utils/config.js');
      expect(getWriteInboxAllowlist()).toEqual(['123', '456', '789']);
      expect(isWriteInboxAllowed('123')).toBe(true);
      expect(isWriteInboxAllowed(456)).toBe(true);
      expect(isWriteInboxAllowed('999')).toBe(false);
      expect(isWriteInboxAllowed(undefined)).toBe(false);
    });
  });

  describe('write docs site allowlist', () => {
    it('default-allows when HELPSCOUT_WRITE_DOCS_SITE_ALLOWLIST is unset', async () => {
      delete process.env.HELPSCOUT_WRITE_DOCS_SITE_ALLOWLIST;
      jest.resetModules();
      const { isWriteDocsSiteAllowed, getWriteDocsSiteAllowlist } = await import('../utils/config.js');
      expect(getWriteDocsSiteAllowlist()).toBeNull();
      expect(isWriteDocsSiteAllowed('site-1')).toBe(true);
      expect(isWriteDocsSiteAllowed(undefined)).toBe(true);
    });

    it('only allows listed site IDs when set', async () => {
      process.env.HELPSCOUT_WRITE_DOCS_SITE_ALLOWLIST = 'site-a,site-b';
      jest.resetModules();
      const { isWriteDocsSiteAllowed, getWriteDocsSiteAllowlist } = await import('../utils/config.js');
      expect(getWriteDocsSiteAllowlist()).toEqual(['site-a', 'site-b']);
      expect(isWriteDocsSiteAllowed('site-a')).toBe(true);
      expect(isWriteDocsSiteAllowed('site-c')).toBe(false);
      expect(isWriteDocsSiteAllowed(undefined)).toBe(false);
    });
  });
});
