/**
 * Live data samples from actual Help Scout threads.
 * Validates that the HTML → Markdown conversion preserves
 * meaningful content from real customer/staff messages.
 */

jest.mock('../utils/config.js', () => ({
  config: {
    helpscout: {
      apiKey: 'test', clientId: 'test', clientSecret: 'test',
      baseUrl: 'https://api.helpscout.net/v2/',
      docsApiKey: '', docsBaseUrl: 'https://docsapi.helpscout.net/v1/',
      disableDocs: true, allowDocsDelete: false,
      defaultDocsCollectionId: '', defaultDocsSiteId: '',
      replySpacing: 'relaxed', allowSendReply: false,
    },
    cache: { ttlSeconds: 300, maxSize: 10000 },
    logging: { level: 'info' },
    security: { allowPii: true },
    responses: { verbose: false },
    connectionPool: { maxSockets: 50, maxFreeSockets: 10, timeout: 30000, keepAlive: true, keepAliveMsecs: 1000 },
  },
  validateConfig: jest.fn(),
  isVerbose: () => false,
}));
jest.mock('../utils/logger.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));
jest.mock('../utils/cache.js', () => ({
  cache: { get: jest.fn(), set: jest.fn(), has: jest.fn(() => false), delete: jest.fn(), clear: jest.fn() },
}));

import { ToolHandler } from '../tools/index.js';

describe('htmlToMarkdown with live Help Scout data', () => {
  let convert: (html: string) => string;

  beforeAll(() => {
    const handler = new ToolHandler();
    convert = (html: string) => (handler as any).htmlToMarkdown(html);
  });

  it('preserves inline code, bold, code blocks, and lists from a staff reply', () => {
    // Based on a real staff reply with code, bold, lists (names changed)
    const html = `Hi Alex,<br><br>I did some testing and confirmed that the <code class="inline-code">gravityview/view/entries</code> &nbsp;filter does work with DataTables server-side processing - I was able to filter entries and have the counts update correctly in the frontend.<br><br>So the issue is likely something specific to your setup. A few things to check:<br><ul><li>Make sure your filter code is running during the <strong>AJAX request</strong>, not just on page load. Add this at the start of your callback to verify:<br><code class="inline-code">error_log( "Filter: View " . $view-&gt;ID . " - AJAX: " . ( defined( "DOING_AJAX" ) ? "yes" : "no" ) );</code> <br></li><li>Make sure you're returning a <strong>new</strong> <code class="inline-code">\\GV\\Entry_Collection</code> &nbsp;object with the filtered entries, rather than modifying the original:<br></li></ul><pre>$new_collection = new \\GV\\Entry_Collection();\nforeach ( $filtered_entries as $entry ) {\n    $new_collection-&gt;add( $entry );\n}\nreturn $new_collection;\n</pre>If you're still stuck, another option is to switch to the standard <strong>Table layout</strong> instead of DataTables. It doesn't use AJAX, which removes that variable from the equation entirely.<br><br>I hope this helps!<br><br>Best,<br>`;

    const result = convert(html);

    // Inline code preserved
    expect(result).toContain('`gravityview/view/entries`');
    expect(result).toContain('`\\GV\\Entry_Collection`');

    // Bold preserved
    expect(result).toContain('**AJAX request**');
    expect(result).toContain('**new**');
    expect(result).toContain('**Table layout**');

    // Code block preserved (the bare <pre> block → fenced code block)
    expect(result).toContain('$new_collection');
    expect(result).toContain('$filtered_entries');
    expect(result).toContain('```');

    // Inline code snippet preserved
    expect(result).toContain('error_log');
    expect(result).toContain('DOING_AJAX');

    // List items present
    expect(result).toMatch(/-\s+Make sure your filter code/);
    expect(result).toMatch(/-\s+Make sure you're returning/);

    // General content
    expect(result).toContain('Hi Alex,');
    expect(result).toContain('I hope this helps!');
  });

  it('strips helpscout-signature divs', () => {
    const html = `You've been really helpful - thank you so much.<br>\n<br>\n<div class="helpscout-signature">Jane Smith<br>\n555.123.4567<br>\nwww.example-agency.com</div>`;
    const result = convert(html);

    expect(result).toContain("You've been really helpful");
    // Signature content should be stripped
    expect(result).not.toContain('Jane Smith');
    expect(result).not.toContain('555.123.4567');
    expect(result).not.toContain('example-agency.com');
  });

  it('preserves links in staff replies with multiple doc references', () => {
    // Based on a real staff reply with doc links (no customer PII)
    const html = `<p>The key is our <a href="https://www.gravitykit.com/extensions/magic-links/">Magic Links</a> extension.</p>
<p>You include the link in your notification using a merge tag:</p>
<code>{gv_magic_link view_id=123 text="Update your registration details"}</code>
<p>We published a tutorial: <a href="https://docs.gravitykit.com/article/851-event-registration">Building a Dynamic Event Registration System</a></p>
<p>See also:</p>
<ul>
<li><a href="https://docs.gravitykit.com/article/353-first-view">Setting up Your First View</a></li>
<li><a href="https://docs.gravitykit.com/article/203-show-only-logged-in">Show only entries created by the logged-in user</a></li>
</ul>`;

    const result = convert(html);

    // Links preserved with text and URL
    expect(result).toContain('[Magic Links](https://www.gravitykit.com/extensions/magic-links/)');
    expect(result).toContain('[Building a Dynamic Event Registration System](https://docs.gravitykit.com/article/851-event-registration)');
    expect(result).toContain('[Setting up Your First View](https://docs.gravitykit.com/article/353-first-view)');
    expect(result).toContain('[Show only entries created by the logged-in user](https://docs.gravitykit.com/article/203-show-only-logged-in)');

    // Merge tag code preserved
    expect(result).toContain('`{gv_magic_link view_id=123');
  });

  it('handles customer message with image attachment references', () => {
    const html = `Hello, I bought the GravityRevisions Plugin. Problem: The Main gravityForms licence runs through another Account I do not know.<br><br>How can I download it now and upload it to my Wordpress page?<br><br>Here is what I see:<br><img src="https://helpscout.net/attachments/screenshot.png" alt="download error">`;

    const result = convert(html);

    expect(result).toContain('GravityRevisions Plugin');
    expect(result).toContain('![download error](https://helpscout.net/attachments/screenshot.png)');
  });
});
