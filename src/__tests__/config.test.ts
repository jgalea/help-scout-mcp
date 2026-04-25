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
    it('default-denies when HELPSCOUT_WRITE_INBOX_ALLOWLIST is unset', async () => {
      delete process.env.HELPSCOUT_WRITE_INBOX_ALLOWLIST;
      jest.resetModules();
      const { isWriteInboxAllowed, getWriteInboxAllowlist } = await import('../utils/config.js');
      expect(getWriteInboxAllowlist()).toBeNull();
      expect(isWriteInboxAllowed('123')).toBe(false);
      expect(isWriteInboxAllowed(456)).toBe(false);
      expect(isWriteInboxAllowed(undefined)).toBe(false);
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
    it('default-denies when HELPSCOUT_WRITE_DOCS_SITE_ALLOWLIST is unset', async () => {
      delete process.env.HELPSCOUT_WRITE_DOCS_SITE_ALLOWLIST;
      jest.resetModules();
      const { isWriteDocsSiteAllowed, getWriteDocsSiteAllowlist } = await import('../utils/config.js');
      expect(getWriteDocsSiteAllowlist()).toBeNull();
      expect(isWriteDocsSiteAllowed('site-1')).toBe(false);
      expect(isWriteDocsSiteAllowed(undefined)).toBe(false);
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

  describe('HELPSCOUT_USE_KEYCHAIN', () => {
    const originalPlatform = process.platform;

    afterEach(() => {
      Object.defineProperty(process, 'platform', { value: originalPlatform });
      jest.unmock('node:child_process');
    });

    it('does nothing when HELPSCOUT_USE_KEYCHAIN is unset (env vars used)', async () => {
      delete process.env.HELPSCOUT_USE_KEYCHAIN;
      process.env.HELPSCOUT_APP_ID = 'env-app-id';
      process.env.HELPSCOUT_APP_SECRET = 'env-secret-of-realistic-length-32';

      jest.resetModules();
      const { validateConfig, config } = await import('../utils/config.js');
      expect(() => validateConfig()).not.toThrow();
      expect(config.helpscout.clientId).toBe('env-app-id');
      expect(config.helpscout.clientSecret).toBe('env-secret-of-realistic-length-32');
    });

    it('reads credentials from Keychain when set, overriding env vars', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      process.env.HELPSCOUT_USE_KEYCHAIN = 'true';
      process.env.HELPSCOUT_APP_ID = 'env-id';
      process.env.HELPSCOUT_APP_SECRET = 'env-secret-of-realistic-length-32';

      jest.resetModules();
      jest.doMock('node:child_process', () => ({
        execFileSync: (_cmd: string, args: string[]) => {
          const i = args.indexOf('-s');
          const service = args[i + 1];
          if (service === 'claude-helpscout-app-id') return 'kc-app-id';
          if (service === 'claude-helpscout-app-secret') return 'kc-secret-of-realistic-length-32';
          throw new Error(`unexpected service ${service}`);
        },
      }));

      const { validateConfig, config } = await import('../utils/config.js');
      expect(() => validateConfig()).not.toThrow();
      expect(config.helpscout.clientId).toBe('kc-app-id');
      expect(config.helpscout.clientSecret).toBe('kc-secret-of-realistic-length-32');
    });

    it('honors custom service names via HELPSCOUT_KEYCHAIN_*_SERVICE', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      process.env.HELPSCOUT_USE_KEYCHAIN = 'true';
      process.env.HELPSCOUT_KEYCHAIN_ID_SERVICE = 'custom-id-service';
      process.env.HELPSCOUT_KEYCHAIN_SECRET_SERVICE = 'custom-secret-service';

      jest.resetModules();
      jest.doMock('node:child_process', () => ({
        execFileSync: (_cmd: string, args: string[]) => {
          const i = args.indexOf('-s');
          const service = args[i + 1];
          if (service === 'custom-id-service') return 'custom-id';
          if (service === 'custom-secret-service') return 'custom-secret-of-realistic-length-32';
          throw new Error(`unexpected service ${service}`);
        },
      }));

      const { validateConfig, config } = await import('../utils/config.js');
      expect(() => validateConfig()).not.toThrow();
      expect(config.helpscout.clientId).toBe('custom-id');
      expect(config.helpscout.clientSecret).toBe('custom-secret-of-realistic-length-32');
    });

    it('throws a clear error when Keychain entries are missing', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      process.env.HELPSCOUT_USE_KEYCHAIN = 'true';

      jest.resetModules();
      jest.doMock('node:child_process', () => ({
        execFileSync: () => {
          const err = new Error('The specified item could not be found in the keychain.');
          throw err;
        },
      }));

      const { validateConfig } = await import('../utils/config.js');
      expect(() => validateConfig()).toThrow(/Keychain is missing/);
      expect(() => validateConfig()).toThrow(/security add-generic-password/);
    });

    it('throws on non-darwin platforms with a clear error', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      process.env.HELPSCOUT_USE_KEYCHAIN = 'true';

      jest.resetModules();
      const { validateConfig } = await import('../utils/config.js');
      expect(() => validateConfig()).toThrow(/only supported on macOS/);
    });
  });
});
