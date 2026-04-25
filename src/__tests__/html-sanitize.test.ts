import { sanitizeReplyHtml, sanitizeDocsHtml } from '../utils/html-sanitize.js';

describe('sanitizeReplyHtml', () => {
  it('strips <script> tags entirely', () => {
    const input = '<p>Hi</p><script>alert(1)</script>';
    const out = sanitizeReplyHtml(input);
    expect(out).not.toMatch(/<script/i);
    expect(out).not.toMatch(/alert/);
    expect(out).toContain('<p>Hi</p>');
  });

  it('strips event handlers like onerror', () => {
    const input = '<img src="x" onerror="alert(1)">';
    const out = sanitizeReplyHtml(input);
    expect(out).not.toMatch(/onerror/i);
    expect(out).not.toMatch(/alert/);
  });

  it('blocks javascript: URLs in href', () => {
    const input = '<a href="javascript:alert(1)">click</a>';
    const out = sanitizeReplyHtml(input);
    expect(out).not.toMatch(/javascript:/i);
  });

  it('keeps safe http/https/mailto links', () => {
    const input = '<a href="https://example.com">x</a> <a href="mailto:user@example.com">y</a>';
    const out = sanitizeReplyHtml(input);
    expect(out).toContain('https://example.com');
    expect(out).toContain('mailto:user@example.com');
  });

  it('drops <iframe> from replies', () => {
    const input = '<iframe src="https://www.youtube.com/embed/abc"></iframe>';
    const out = sanitizeReplyHtml(input);
    expect(out).not.toMatch(/<iframe/i);
  });

  it('keeps allowed inline formatting', () => {
    const input = '<p>Hello <strong>bold</strong> and <em>italic</em></p>';
    const out = sanitizeReplyHtml(input);
    expect(out).toContain('<strong>bold</strong>');
    expect(out).toContain('<em>italic</em>');
  });
});

describe('sanitizeDocsHtml', () => {
  it('strips <script> tags', () => {
    const input = '<h1>Article</h1><script>alert(1)</script>';
    const out = sanitizeDocsHtml(input);
    expect(out).not.toMatch(/<script/i);
    expect(out).toContain('<h1>Article</h1>');
  });

  it('allows iframe from YouTube hostname', () => {
    const input = '<iframe src="https://www.youtube.com/embed/abc"></iframe>';
    const out = sanitizeDocsHtml(input);
    expect(out).toMatch(/<iframe/i);
    expect(out).toContain('youtube.com');
  });

  it('drops iframe from disallowed hostnames', () => {
    const input = '<iframe src="https://evil.example.com/exploit"></iframe>';
    const out = sanitizeDocsHtml(input);
    expect(out).not.toContain('evil.example.com');
  });

  it('keeps figure/figcaption for article authoring', () => {
    const input = '<figure><img src="https://example.com/x.png" alt="x"><figcaption>cap</figcaption></figure>';
    const out = sanitizeDocsHtml(input);
    expect(out).toContain('<figure>');
    expect(out).toContain('<figcaption>cap</figcaption>');
  });

  it('blocks javascript: URLs in image src', () => {
    const input = '<img src="javascript:alert(1)">';
    const out = sanitizeDocsHtml(input);
    expect(out).not.toMatch(/javascript:/i);
  });
});
