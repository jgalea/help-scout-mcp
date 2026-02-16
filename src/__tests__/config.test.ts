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
      process.env.HELPSCOUT_APP_SECRET = 'app-secret';
      process.env.HELPSCOUT_BASE_URL = 'https://api.helpscout.net/v2/';

      jest.resetModules();
      const { validateConfig } = await import('../utils/config.js');
      expect(() => validateConfig()).not.toThrow();
    });

    it('should pass with valid OAuth2 configuration using CLIENT_ID/CLIENT_SECRET', async () => {
      process.env.HELPSCOUT_CLIENT_ID = 'client-id';
      process.env.HELPSCOUT_CLIENT_SECRET = 'client-secret';
      process.env.HELPSCOUT_BASE_URL = 'https://api.helpscout.net/v2/';

      jest.resetModules();
      const { validateConfig } = await import('../utils/config.js');
      expect(() => validateConfig()).not.toThrow();
    });

    it('should reject legacy API_KEY without APP_ID', async () => {
      process.env.HELPSCOUT_API_KEY = 'client-id';
      process.env.HELPSCOUT_APP_SECRET = 'client-secret';
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
      process.env.HELPSCOUT_APP_SECRET = 'app-secret';
      process.env.HELPSCOUT_BASE_URL = 'http://api.helpscout.net/v2/';

      jest.resetModules();
      const { validateConfig } = await import('../utils/config.js');
      expect(() => validateConfig()).toThrow(/Security Error.*HTTPS/);
    });

    it('should use default base URL when not provided', async () => {
      process.env.HELPSCOUT_APP_ID = 'app-id';
      process.env.HELPSCOUT_APP_SECRET = 'app-secret';
      delete process.env.HELPSCOUT_BASE_URL;

      jest.resetModules();
      const { validateConfig } = await import('../utils/config.js');
      expect(() => validateConfig()).not.toThrow();
    });

    it('should handle boolean environment variables correctly', async () => {
      process.env.HELPSCOUT_APP_ID = 'app-id';
      process.env.HELPSCOUT_APP_SECRET = 'app-secret';
      process.env.ALLOW_PII = 'true';
      process.env.CACHE_TTL_SECONDS = '600';
      process.env.LOG_LEVEL = 'debug';

      jest.resetModules();
      const { validateConfig } = await import('../utils/config.js');
      expect(() => validateConfig()).not.toThrow();
    });

    it('should handle invalid boolean values gracefully', async () => {
      process.env.HELPSCOUT_APP_ID = 'app-id';
      process.env.HELPSCOUT_APP_SECRET = 'app-secret';
      process.env.ALLOW_PII = 'invalid-boolean';

      jest.resetModules();
      const { validateConfig } = await import('../utils/config.js');
      expect(() => validateConfig()).not.toThrow();
    });

    it('should handle invalid numeric values gracefully', async () => {
      process.env.HELPSCOUT_APP_ID = 'app-id';
      process.env.HELPSCOUT_APP_SECRET = 'app-secret';
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
  });
});
