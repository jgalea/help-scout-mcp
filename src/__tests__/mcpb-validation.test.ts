import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { describe, it, expect, beforeAll } from '@jest/globals';

describe('MCPB Extension Validation', () => {
  const mcpbDir = path.join(process.cwd(), 'helpscout-mcp-extension');
  const manifestPath = path.join(mcpbDir, 'manifest.json');
  const buildDir = path.join(mcpbDir, 'build');
  let manifest: any;

  beforeAll(() => {
    // Build if needed
    if (!fs.existsSync(buildDir)) {
      execSync('npm run mcpb:build', { stdio: 'inherit', cwd: process.cwd() });
    }

    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  });

  describe('Manifest Validation', () => {
    it('should have required fields', () => {
      expect(manifest.manifest_version).toBe('0.3');
      expect(manifest.name).toBe('help-scout-mcp');
      expect(manifest.display_name).toBe('Help Scout MCP Server');
      expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(manifest.description).toBeTruthy();
      expect(manifest.author).toHaveProperty('name');
      expect(manifest.license).toBe('MIT');
    });

    it('should have proper server configuration', () => {
      expect(manifest.server.type).toBe('node');
      expect(manifest.server.entry_point).toBe('build/server/index.js');
      expect(manifest.server.mcp_config.command).toBe('node');
      expect(manifest.server.mcp_config.args).toContain('${__dirname}/build/server/index.js');
    });

    it('should have OAuth2 authentication configuration', () => {
      const userConfig = manifest.user_config;

      expect(userConfig.app_id).toBeDefined();
      expect(userConfig.app_secret).toBeDefined();
      expect(userConfig.app_id.type).toBe('string');
      expect(userConfig.app_secret.type).toBe('string');
      expect(userConfig.app_id.sensitive).toBe(true);
      expect(userConfig.app_secret.sensitive).toBe(true);
      expect(userConfig.app_id.required).toBe(true);
      expect(userConfig.app_secret.required).toBe(true);

      // Should NOT have personal access token or old field names
      expect(userConfig.api_key).toBeUndefined();
      expect(userConfig.client_id).toBeUndefined();
      expect(userConfig.personal_access_token).toBeUndefined();
    });

    it('should have core MCP tools declared', () => {
      expect(manifest.tools).toHaveLength(7);

      const expectedTools = [
        'searchConversations',
        'structuredConversationFilter',
        'getConversationSummary',
        'getThreads',
        'searchInboxes',
        'listAllInboxes',
        'getServerTime',
      ];

      const toolNames = manifest.tools.map((tool: any) => tool.name);
      expectedTools.forEach(toolName => {
        expect(toolNames).toContain(toolName);
      });
    });

    it('should not declare resources (resources are dynamic in MCP)', () => {
      expect(manifest.resources).toBeUndefined();
    });

    it('should have MCP prompts declared', () => {
      expect(manifest.prompts).toHaveLength(4);

      const expectedPrompts = [
        'summarize-latest-tickets',
        'search-last-7-days',
        'find-urgent-tags',
        'list-inbox-activity',
      ];

      const promptNames = manifest.prompts.map((prompt: any) => prompt.name);
      expectedPrompts.forEach(promptName => {
        expect(promptNames).toContain(promptName);
      });
    });

    it('should have environment variable mapping', () => {
      const env = manifest.server.mcp_config.env;

      expect(env.HELPSCOUT_APP_ID).toBe('${user_config.app_id}');
      expect(env.HELPSCOUT_APP_SECRET).toBe('${user_config.app_secret}');
      expect(env.HELPSCOUT_BASE_URL).toBe('${user_config.base_url}');
      expect(env.REDACT_MESSAGE_CONTENT).toBe('${user_config.redact_message_content}');
      expect(env.LOG_LEVEL).toBe('${user_config.log_level}');
      expect(env.CACHE_TTL_SECONDS).toBe('${user_config.cache_ttl}');

      // Should NOT have old env var names
      expect(env.HELPSCOUT_CLIENT_ID).toBeUndefined();
      expect(env.HELPSCOUT_CLIENT_SECRET).toBeUndefined();
      expect(env.HELPSCOUT_API_KEY).toBeUndefined();
      expect(env.ALLOW_PII).toBeUndefined();
      expect(env.MAX_CACHE_SIZE).toBeUndefined();
    });

    it('should have compatibility declared', () => {
      expect(manifest.compatibility.platforms).toContain('darwin');
      expect(manifest.compatibility.platforms).toContain('win32');
      expect(manifest.compatibility.platforms).toContain('linux');
      expect(manifest.compatibility.runtimes.node).toBe('>=18.0.0');
    });
  });

  describe('Build Structure Validation', () => {
    it('should have correct entry point file', () => {
      const entryPoint = path.join(buildDir, 'server/index.js');
      expect(fs.existsSync(entryPoint)).toBe(true);

      const content = fs.readFileSync(entryPoint, 'utf8');
      expect(content).toContain('export');
      expect(content.length).toBeGreaterThan(1000);
    });

    it('should have production package.json with correct dependencies', () => {
      const prodPackageJson = path.join(buildDir, 'package.json');
      expect(fs.existsSync(prodPackageJson)).toBe(true);

      const prodPkg = JSON.parse(fs.readFileSync(prodPackageJson, 'utf8'));
      expect(prodPkg.type).toBe('module');

      const requiredDeps = [
        '@modelcontextprotocol/sdk',
        'axios',
        'lru-cache',
        'zod',
        'dotenv',
      ];

      requiredDeps.forEach(dep => {
        expect(prodPkg.dependencies[dep]).toBeDefined();
      });

      expect(prodPkg.devDependencies).toBeUndefined();
    });

    it('should have all required dependencies installed', () => {
      const nodeModules = path.join(buildDir, 'node_modules');
      expect(fs.existsSync(nodeModules)).toBe(true);

      const criticalDeps = ['axios', 'lru-cache', 'zod', '@modelcontextprotocol'];

      criticalDeps.forEach(dep => {
        const depPath = path.join(nodeModules, dep);
        expect(fs.existsSync(depPath)).toBe(true);
      });
    });

    it('should have all server modules built', () => {
      const serverDir = path.join(buildDir, 'server');
      const expectedFiles = [
        'index.js',
        'tools/index.js',
        'resources/index.js',
        'prompts/index.js',
        'schema/types.js',
        'utils/config.js',
        'utils/helpscout-client.js',
        'utils/logger.js',
        'utils/cache.js',
        'utils/mcp-errors.js',
      ];

      expectedFiles.forEach(file => {
        const filePath = path.join(serverDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe('File Content Validation', () => {
    it('should have valid server entry point that imports MCP SDK', () => {
      const entryPoint = path.join(buildDir, 'server/index.js');
      const content = fs.readFileSync(entryPoint, 'utf8');

      expect(content).toContain('@modelcontextprotocol/sdk');
      expect(content).toContain('Server');
      expect(content).toContain('StdioServerTransport');
    });

    it('should have helpscout client that imports axios', () => {
      const clientPath = path.join(buildDir, 'server/utils/helpscout-client.js');
      const content = fs.readFileSync(clientPath, 'utf8');

      expect(content).toContain('axios');
      expect(content).toContain('cache');
    });

    it('should have tools that export all expected functions', () => {
      const toolsPath = path.join(buildDir, 'server/tools/index.js');
      const content = fs.readFileSync(toolsPath, 'utf8');

      const expectedExports = [
        'searchInboxes',
        'searchConversations',
        'getConversationSummary',
        'getThreads',
        'getServerTime',
      ];

      expectedExports.forEach(exportName => {
        expect(content).toContain(exportName);
      });
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('should use path.join for all paths', () => {
      const buildScript = path.join(process.cwd(), 'scripts/build-mcpb.js');
      const content = fs.readFileSync(buildScript, 'utf8');

      expect(content).toContain('path.join');
      expect(content).not.toContain('cp -r');
      expect(content).not.toContain('xcopy');
    });

    it('should have cross-platform copyDirectory function', () => {
      const buildScript = path.join(process.cwd(), 'scripts/build-mcpb.js');
      const content = fs.readFileSync(buildScript, 'utf8');

      expect(content).toContain('copyDirectory');
      expect(content).toContain('fs.readdirSync');
      expect(content).toContain('fs.copyFileSync');
    });
  });
});
