/**
 * Tests for HTML → Markdown transcript conversion (via Turndown).
 *
 * We access the private `htmlToMarkdown` method through bracket notation
 * because the conversion is a pure function and testing it directly
 * is far simpler than mocking the full Help Scout API round-trip.
 */

jest.mock('../utils/config.js', () => ({
  config: {
    helpscout: {
      apiKey: 'test',
      clientId: 'test',
      clientSecret: 'test',
      baseUrl: 'https://api.helpscout.net/v2/',
      docsApiKey: '',
      docsBaseUrl: 'https://docsapi.helpscout.net/v1/',
      disableDocs: true,
      allowDocsDelete: false,
      defaultDocsCollectionId: '',
      defaultDocsSiteId: '',
      replySpacing: 'relaxed',
      allowSendReply: false,
    },
    cache: { ttlSeconds: 300, maxSize: 10000 },
    logging: { level: 'info' },
    security: { allowPii: true },
    responses: { verbose: false },
    connectionPool: {
      maxSockets: 50,
      maxFreeSockets: 10,
      timeout: 30000,
      keepAlive: true,
      keepAliveMsecs: 1000,
    },
  },
  validateConfig: jest.fn(),
  isVerbose: () => false,
}));

jest.mock('../utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../utils/cache.js', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    has: jest.fn(() => false),
    delete: jest.fn(),
    clear: jest.fn(),
  },
}));

import { ToolHandler } from '../tools/index.js';

describe('htmlToMarkdown', () => {
  let handler: ToolHandler;
  let convert: (html: string) => string;

  beforeAll(() => {
    handler = new ToolHandler();
    convert = (html: string) => (handler as any).htmlToMarkdown(html);
  });

  it('preserves bold text', () => {
    expect(convert('<strong>important</strong>')).toBe('**important**');
    expect(convert('<b>also bold</b>')).toBe('**also bold**');
  });

  it('preserves italic text', () => {
    expect(convert('<em>emphasis</em>')).toBe('_emphasis_');
    expect(convert('<i>italic</i>')).toBe('_italic_');
  });

  it('preserves strikethrough', () => {
    expect(convert('<s>deleted</s>')).toBe('~~deleted~~');
    expect(convert('<del>also deleted</del>')).toBe('~~also deleted~~');
  });

  it('preserves links with href', () => {
    expect(convert('<a href="https://example.com">click here</a>'))
      .toBe('[click here](https://example.com)');
  });

  it('preserves images with alt and src', () => {
    expect(convert('<img src="https://example.com/pic.png" alt="screenshot" />'))
      .toBe('![screenshot](https://example.com/pic.png)');
  });

  it('renders images without alt text', () => {
    expect(convert('<img src="https://example.com/pic.png" />'))
      .toBe('![](https://example.com/pic.png)');
  });

  it('converts unordered lists', () => {
    const html = '<ul><li>one</li><li>two</li><li>three</li></ul>';
    const result = convert(html);
    expect(result).toMatch(/-\s+one/);
    expect(result).toMatch(/-\s+two/);
    expect(result).toMatch(/-\s+three/);
  });

  it('converts ordered lists', () => {
    const html = '<ol><li>first</li><li>second</li></ol>';
    const result = convert(html);
    expect(result).toMatch(/1\.\s+first/);
    expect(result).toMatch(/2\.\s+second/);
  });

  it('converts headings', () => {
    expect(convert('<h1>Title</h1>')).toBe('# Title');
    expect(convert('<h2>Subtitle</h2>')).toBe('## Subtitle');
  });

  it('converts <br> to newlines', () => {
    const result = convert('line one<br>line two');
    expect(result).toContain('line one');
    expect(result).toContain('line two');
    // Should be on separate lines
    expect(result).toMatch(/line one\s*\nline two/);
  });

  it('converts paragraphs to double newlines', () => {
    const result = convert('<p>First paragraph</p><p>Second paragraph</p>');
    expect(result).toContain('First paragraph');
    expect(result).toContain('Second paragraph');
    // Paragraphs should be separated
    expect(result).toMatch(/First paragraph\n\nSecond paragraph/);
  });

  it('decodes HTML entities', () => {
    expect(convert('&amp; &lt; &gt; &quot; &#39;')).toBe('& < > " \'');
  });

  it('strips style and script tags entirely', () => {
    expect(convert('<style>.foo { color: red; }</style>Hello')).toBe('Hello');
    expect(convert('<script>alert("xss")</script>Hello')).toBe('Hello');
  });

  it('does not collapse whitespace (raw turndown output)', () => {
    const html = '<p>A</p><p></p><p></p><p></p><p>B</p>';
    const result = convert(html);
    expect(result).toContain('A');
    expect(result).toContain('B');
  });

  it('handles a realistic Help Scout email body', () => {
    const html = `
      <div>Hi there,<br><br>
      I'm having trouble with <strong>GravityView</strong> on my site
      <a href="https://example.com">example.com</a>.<br><br>
      Here's a screenshot:<br>
      <img src="https://example.com/screenshot.png" alt="error screenshot"><br><br>
      Steps I tried:<br>
      <ul>
        <li>Deactivated all plugins</li>
        <li>Switched to <em>Twenty Twenty-Four</em></li>
        <li>Cleared cache</li>
      </ul>
      <p>Thanks,<br>John</p></div>
    `;
    const result = convert(html);

    // Key content is preserved
    expect(result).toContain('**GravityView**');
    expect(result).toContain('[example.com](https://example.com)');
    expect(result).toContain('![error screenshot](https://example.com/screenshot.png)');
    expect(result).toMatch(/-\s+Deactivated all plugins/);
    expect(result).toContain('_Twenty Twenty-Four_');
    expect(result).toContain('Thanks,');
  });

  it('handles empty input', () => {
    expect(convert('')).toBe('');
  });

  it('handles plain text with no HTML', () => {
    expect(convert('Just plain text')).toBe('Just plain text');
  });
});
