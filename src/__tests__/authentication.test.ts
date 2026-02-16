import { jest } from '@jest/globals';

describe('Authentication Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules before modifying environment
    jest.resetModules();
    // Create fresh environment without any HELPSCOUT vars
    process.env = Object.keys(originalEnv).reduce((env, key) => {
      if (!key.startsWith('HELPSCOUT_')) {
        env[key] = originalEnv[key];
      }
      return env;
    }, {} as typeof process.env);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Environment Variable Priority', () => {
    it('should prioritize HELPSCOUT_APP_ID over HELPSCOUT_CLIENT_ID and HELPSCOUT_API_KEY', async () => {
      process.env.HELPSCOUT_APP_ID = 'app-id-priority';
      process.env.HELPSCOUT_CLIENT_ID = 'client-id-fallback';
      process.env.HELPSCOUT_API_KEY = 'api-key-fallback';
      process.env.HELPSCOUT_APP_SECRET = 'app-secret';

      jest.resetModules();
      const { config } = await import('../utils/config.js');

      expect(config.helpscout.clientId).toBe('app-id-priority');
    });

    it('should prioritize HELPSCOUT_APP_SECRET over HELPSCOUT_CLIENT_SECRET', async () => {
      process.env.HELPSCOUT_APP_ID = 'app-id';
      process.env.HELPSCOUT_APP_SECRET = 'app-secret-priority';
      process.env.HELPSCOUT_CLIENT_SECRET = 'client-secret-fallback';

      jest.resetModules();
      const { config } = await import('../utils/config.js');

      expect(config.helpscout.clientSecret).toBe('app-secret-priority');
    });

    it('should fall back to CLIENT_ID/CLIENT_SECRET when APP_ID/APP_SECRET not present', async () => {
      process.env.HELPSCOUT_CLIENT_ID = 'client-id';
      process.env.HELPSCOUT_CLIENT_SECRET = 'client-secret';

      jest.resetModules();
      const { config } = await import('../utils/config.js');

      expect(config.helpscout.clientId).toBe('client-id');
      expect(config.helpscout.clientSecret).toBe('client-secret');
    });

    it('should not fall back to legacy API_KEY for clientId', async () => {
      process.env.HELPSCOUT_API_KEY = 'legacy-client-id';
      process.env.HELPSCOUT_APP_SECRET = 'legacy-app-secret';

      jest.resetModules();
      const { config } = await import('../utils/config.js');

      // API_KEY no longer used as clientId fallback (was misleading)
      expect(config.helpscout.clientId).toBe('');
      expect(config.helpscout.clientSecret).toBe('legacy-app-secret');
      expect(config.helpscout.apiKey).toBe('legacy-client-id');
    });
  });

  describe('validateConfig with OAuth2', () => {
    it('should pass with APP_ID/APP_SECRET', async () => {
      process.env.HELPSCOUT_APP_ID = 'app-id';
      process.env.HELPSCOUT_APP_SECRET = 'app-secret';

      jest.resetModules();
      const { validateConfig } = await import('../utils/config.js');
      expect(() => validateConfig()).not.toThrow();
    });

    it('should pass with CLIENT_ID/CLIENT_SECRET', async () => {
      process.env.HELPSCOUT_CLIENT_ID = 'client-id';
      process.env.HELPSCOUT_CLIENT_SECRET = 'client-secret';

      jest.resetModules();
      const { validateConfig } = await import('../utils/config.js');
      expect(() => validateConfig()).not.toThrow();
    });

    it('should reject legacy API_KEY without APP_ID', async () => {
      process.env.HELPSCOUT_API_KEY = 'client-id';
      process.env.HELPSCOUT_APP_SECRET = 'client-secret';

      jest.resetModules();
      const { validateConfig } = await import('../utils/config.js');
      // API_KEY no longer used as clientId, so this should fail
      expect(() => validateConfig()).toThrow(/OAuth2 authentication required/);
    });

    it('should throw error when Personal Access Token is used', async () => {
      process.env.HELPSCOUT_API_KEY = 'Bearer personal-access-token';

      jest.resetModules();
      const { validateConfig } = await import('../utils/config.js');
      expect(() => validateConfig()).toThrow(/Personal Access Tokens are no longer supported/);
    });

    it('should throw error when no authentication is provided', async () => {
      jest.resetModules();
      const { validateConfig } = await import('../utils/config.js');
      expect(() => validateConfig()).toThrow(/OAuth2 authentication required/);
    });

    it('should throw error when only client ID is provided', async () => {
      process.env.HELPSCOUT_CLIENT_ID = 'client-id';

      jest.resetModules();
      const { validateConfig } = await import('../utils/config.js');
      expect(() => validateConfig()).toThrow(/OAuth2 authentication required/);
    });

    it('should throw error when only client secret is provided', async () => {
      process.env.HELPSCOUT_CLIENT_SECRET = 'client-secret';

      jest.resetModules();
      const { validateConfig } = await import('../utils/config.js');
      expect(() => validateConfig()).toThrow(/OAuth2 authentication required/);
    });

    it('should throw helpful error message mentioning APP_ID and APP_SECRET', async () => {
      jest.resetModules();
      const { validateConfig } = await import('../utils/config.js');

      expect(() => validateConfig()).toThrow(
        expect.objectContaining({
          message: expect.stringContaining('HELPSCOUT_APP_ID')
        })
      );
    });

    it('should enforce HTTPS for base URL', async () => {
      process.env.HELPSCOUT_APP_ID = 'app-id';
      process.env.HELPSCOUT_APP_SECRET = 'app-secret';
      process.env.HELPSCOUT_BASE_URL = 'http://api.helpscout.net/v2/';

      jest.resetModules();
      const { validateConfig } = await import('../utils/config.js');
      expect(() => validateConfig()).toThrow(/Security Error.*HTTPS/);
    });
  });

  describe('Mixed naming scenarios', () => {
    it('should handle mixed APP_ID and legacy APP_SECRET', async () => {
      process.env.HELPSCOUT_APP_ID = 'new-app-id';
      process.env.HELPSCOUT_APP_SECRET = 'legacy-secret';

      jest.resetModules();
      const { config, validateConfig } = await import('../utils/config.js');

      expect(config.helpscout.clientId).toBe('new-app-id');
      expect(config.helpscout.clientSecret).toBe('legacy-secret');
      expect(() => validateConfig()).not.toThrow();
    });

    it('should handle CLIENT_ID with APP_SECRET', async () => {
      process.env.HELPSCOUT_CLIENT_ID = 'new-client-id';
      process.env.HELPSCOUT_APP_SECRET = 'legacy-secret';

      jest.resetModules();
      const { config, validateConfig } = await import('../utils/config.js');

      expect(config.helpscout.clientId).toBe('new-client-id');
      expect(config.helpscout.clientSecret).toBe('legacy-secret');
      expect(() => validateConfig()).not.toThrow();
    });
  });

  describe('Config object structure', () => {
    it('should have correct structure with OAuth2 fields', async () => {
      process.env.HELPSCOUT_APP_ID = 'app-id';
      process.env.HELPSCOUT_APP_SECRET = 'app-secret';

      jest.resetModules();
      const { config } = await import('../utils/config.js');

      expect(config.helpscout).toHaveProperty('apiKey');
      expect(config.helpscout).toHaveProperty('clientId');
      expect(config.helpscout).toHaveProperty('clientSecret');
      expect(config.helpscout).toHaveProperty('baseUrl');
      expect(config.helpscout).toHaveProperty('defaultInboxId');
    });

    it('should set empty strings for missing values', async () => {
      jest.resetModules();
      const { config } = await import('../utils/config.js');

      expect(config.helpscout.apiKey).toBe('');
      expect(config.helpscout.clientId).toBe('');
      expect(config.helpscout.clientSecret).toBe('');
    });

    it('should support HELPSCOUT_DEFAULT_INBOX_ID', async () => {
      process.env.HELPSCOUT_APP_ID = 'app-id';
      process.env.HELPSCOUT_APP_SECRET = 'app-secret';
      process.env.HELPSCOUT_DEFAULT_INBOX_ID = '12345';

      jest.resetModules();
      const { config } = await import('../utils/config.js');

      expect(config.helpscout.defaultInboxId).toBe('12345');
    });

    it('should support REDACT_MESSAGE_CONTENT env var', async () => {
      process.env.HELPSCOUT_APP_ID = 'app-id';
      process.env.HELPSCOUT_APP_SECRET = 'app-secret';
      process.env.REDACT_MESSAGE_CONTENT = 'true';

      jest.resetModules();
      const { config } = await import('../utils/config.js');

      expect(config.security.allowPii).toBe(false);
    });
  });
});
