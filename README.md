# Help Scout MCP Server

[![npm version](https://badge.fury.io/js/@gravitykit%2Fhelp-scout-mcp.svg)](https://www.npmjs.com/package/@gravitykit/help-scout-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://typescriptlang.org/)

> **Help Scout MCP Server** - Connect Claude and other AI assistants to your Help Scout data with enterprise-grade security and advanced search capabilities.

> **Note**: This is a fork of the original [help-scout-mcp](https://github.com/drewburchfield/help-scout-mcp) by Drew Burchfield.

## 📖 Table of Contents

- [🎉 What's New](#-whats-new)
- [⚡ Quick Start](#quick-start)
- [🔑 API Credentials](#getting-your-api-credentials)
- [🛠️ Tools & Capabilities](#tools--capabilities)
- [📋 Response Modes](#response-modes)
- [⚙️ Configuration](#configuration-options)
- [🔍 Troubleshooting](#troubleshooting)
- [🤝 Contributing](#contributing)

## 🎉 What's New

- **📚 Full Docs API Integration**: Complete support for Help Scout Docs API
  - Browse and search documentation sites, collections, categories, and articles
  - Read full article content with PII protection
  - Update articles, collections, and categories (with safety controls)
- **📈 Complete Reports API**: All Help Scout Reports endpoints implemented
  - Conversation reports (chat, email, phone) with detailed metrics
  - User/team performance reports with productivity analytics
  - Company-wide reports with customer and team insights
  - Happiness reports with satisfaction scores and feedback
  - Docs analytics with article views and visitor metrics
- **🎯 MCPB Extension**: One-click installation for Claude Desktop
- **🔧 Clear Environment Variables**: `HELPSCOUT_APP_ID` and `HELPSCOUT_APP_SECRET`
- **⚡ Connection Pooling**: Improved performance with HTTP connection reuse
- **🛡️ Enhanced Security**: Comprehensive input validation and API constraints
- **🔄 Dependency Injection**: Cleaner architecture with ServiceContainer
- **🧪 Comprehensive Testing**: 69%+ branch coverage with reliable tests

## Prerequisites

- **Node.js 18+** (for command line usage)
- **Help Scout Account** with API access
- **OAuth2 App** from Help Scout (Personal Access Tokens are no longer supported)
- **Claude Desktop** (for MCPB installation) or any MCP-compatible client

> **Note**: The MCPB extension bundles all dependencies, so no local Node.js installation needed for Claude Desktop users.

## Quick Start

### 🎯 Option 1: Claude Desktop (MCPB One-Click Install)

**Easiest setup using [MCP Bundles](https://docs.anthropic.com/en/docs/build-with-claude/computer-use#desktop-extensions) - no configuration needed:**

1. Download the latest [`.mcpb` file from releases](https://github.com/GravityKit/help-scout-mcp/releases)
2. Double-click to install in Claude Desktop
3. Enter your Help Scout App ID and App Secret when prompted
4. Start using immediately!

### 📋 Option 2: Claude Desktop (Manual Config)

```json
{
  "mcpServers": {
    "helpscout": {
      "command": "npx",
      "args": ["@gravitykit/help-scout-mcp"],
      "env": {
        "HELPSCOUT_APP_ID": "your-app-id",
        "HELPSCOUT_APP_SECRET": "your-app-secret"
      }
    }
  }
}
```

### 💻 Option 3: Command Line

```bash
HELPSCOUT_APP_ID="your-app-id" \
HELPSCOUT_APP_SECRET="your-app-secret" \
npx @gravitykit/help-scout-mcp
```

## Getting Your API Credentials

### 🎯 **Recommended: OAuth2 Client Credentials (Step-by-Step)**

This method is recommended for production use and provides automatic token refresh.

**Why Client Credentials?** MCP servers are backend applications that run without user interaction. We use the Client Credentials flow (not Authorization Code flow) because:
- ✅ No browser or user login required
- ✅ Perfect for server-to-server authentication
- ✅ Automatic token refresh
- ✅ Works with Claude Desktop, Continue.dev, etc.

#### Step 1: Create a Private App
1. Log in to your Help Scout account
2. Click your profile icon (top right) → **My Apps**
3. Click **Create My App**
4. Fill out the form:
   - **App Name**: e.g., "Help Scout MCP Server"
   - **Redirection URL**: Use `https://example.com` (required field but not used for server apps)
   - **Description**: Optional description of your integration

#### Step 2: Configure App Permissions
Select the scopes your app needs:
- ✅ **Mailbox** - Read conversations, threads, and mailbox data
- ✅ **Customers** - Access customer information
- ✅ **Reports** - Access analytics and reporting (Plus/Pro plans only)
- ✅ **Users** - Read user information
- ✅ **Webhooks** - If you need webhook functionality

**Note**: Only select the scopes you actually need for security best practices.

#### Step 3: Save and Get Credentials
1. Click **Create Application**
2. You'll see your credentials:
   - **App ID** (this is your Client ID)
   - **App Secret** (this is your Client Secret)
3. **⚠️ Important**: Copy these immediately! The App Secret is only shown once.

#### Step 4: Configure the MCP Server
Set these environment variables:
```bash
export HELPSCOUT_APP_ID="your-app-id-here"
export HELPSCOUT_APP_SECRET="your-app-secret-here"
```

Or add to your `.env` file:
```env
HELPSCOUT_APP_ID=your-app-id-here
HELPSCOUT_APP_SECRET=your-app-secret-here
```

#### Step 5: Test Your Configuration
```bash
# Test with environment variables
HELPSCOUT_APP_ID="your-app-id" \
HELPSCOUT_APP_SECRET="your-app-secret" \
npx @gravitykit/help-scout-mcp

# Or if using .env file
npx @gravitykit/help-scout-mcp
```

#### Troubleshooting OAuth Issues
- **"Unknown URL" for Reports**: Ensure your account has a Plus/Pro plan
- **Authentication Failed**: Double-check your App ID and App Secret
- **Missing Scopes**: Go back to My Apps and edit your app's permissions
- **Token Expired**: The server handles refresh automatically

### 📚 **For Docs API Access**

1. Go to **[Help Scout Docs Settings](https://secure.helpscout.net/settings/docs/code)**
2. Generate a **Docs API Key**
3. Use in configuration: `HELPSCOUT_DOCS_API_KEY=your-docs-api-key`

**Important Notes:**
- The Docs API key is separate from your main Help Scout API credentials
- Ensure Help Scout Docs is enabled for your account
- You must have at least one Docs site created to access documentation
- Reports API (for analytics) requires Plus/Pro plan

## Features

- **🔍 Advanced Search**: Multi-status conversation search, content filtering, boolean queries
- **📊 Smart Analysis**: Conversation summaries, thread retrieval, inbox monitoring
- **📚 Docs Integration**: Full Help Scout Docs API support for articles, collections, and categories
- **📈 Comprehensive Reports**: All Help Scout Reports API endpoints - chat, email, phone, user, company, happiness, and docs analytics
- **🔒 Enterprise Security**: PII redaction, secure token handling, comprehensive audit logs
- **⚡ High Performance**: Built-in caching, rate limiting, automatic retry logic
- **🎯 Easy Integration**: Works with Claude Desktop, Cursor, Continue.dev, and more

## Tools & Capabilities

### Conversation Tools

| Tool | Description | Best For |
|------|-------------|----------|
| `searchConversations` | Search by keywords, structured filters, or list by status/date/inbox. Supports `includeTranscripts` for inline message content. | Listing, keyword search, content search, summarization |
| `structuredConversationFilter` | Lookup by ticket number, assignee, customer ID, or folder ID | Ticket lookup, assignee filtering |
| `getConversationSummary` | First customer message + latest staff reply | Quick conversation overview |
| `getThreads` | Full message history with optional `transcript` format | Full context analysis |
| `searchInboxes` | Find inboxes by name (deprecated: IDs in server instructions) | Discovering available inboxes |
| `listAllInboxes` | List all inboxes with IDs (deprecated: IDs in server instructions) | Refreshing inbox list mid-session |
| `getServerTime` | Current server timestamp | Time-relative searches |

### Documentation Tools

> Set `HELPSCOUT_DISABLE_DOCS=true` to hide all Docs tools if you don't use Help Scout Docs.

| Tool | Description | Use Case |
|------|-------------|----------|
| `listDocsSites` | List all documentation sites with NLP filtering | Discover available sites |
| `getDocsSite` | Get a specific site by ID | Site details |
| `listDocsCollections` | List collections with site NLP resolution | Browse documentation structure |
| `getDocsCollection` | Get a specific collection by ID | Collection details |
| `listAllDocsCollections` | List all available collections across sites | Discover available content |
| `getSiteCollections` | Get collections for a specific site using NLP | Find site-specific collections |
| `listDocsCategories` | List categories in a collection | Navigate collection organization |
| `getDocsCategory` | Get a specific category by ID | Category details |
| `listDocsArticlesByCollection` | List articles in a collection (sort by popularity) | Find articles by collection |
| `listDocsArticlesByCategory` | List articles in a category (sort by popularity) | Find articles by category |
| `searchDocsArticles` | Search articles by keyword across sites/collections | Content search |
| `getDocsArticle` | Get full article content | Read complete documentation |
| `getTopDocsArticles` | Get most popular articles by views with NLP support | Find most-read documentation |
| `listRelatedDocsArticles` | Get articles related to a given article | Content discovery |
| `updateDocsViewCount` | Update the view count for an article | Analytics tracking |
| `createDocsArticle` | Create a new article | Content creation |
| `updateDocsArticle` | Update article content/properties | Modify documentation |
| `deleteDocsArticle` | Delete an article (requires `HELPSCOUT_ALLOW_DOCS_DELETE=true`) | Content management |
| `uploadDocsArticle` | Upload an article from a file | Bulk content import |
| `createDocsCategory` | Create a new category in a collection | Organize documentation |
| `updateDocsCategory` | Update category properties | Manage categories |
| `updateDocsCategoryOrder` | Reorder categories within a collection | Organize documentation |
| `deleteDocsCategory` | Delete a category | Content management |
| `createDocsCollection` | Create a new collection on a site | Organize documentation |
| `updateDocsCollection` | Update collection properties | Manage collections |
| `deleteDocsCollection` | Delete a collection | Content management |
| `listDocsArticleRevisions` | List revisions for an article | Version history |
| `getDocsArticleRevision` | Get a specific article revision | Version comparison |
| `saveDocsArticleDraft` | Save an article draft | Drafting content |
| `deleteDocsArticleDraft` | Delete an article draft | Draft management |
| `listDocsRedirects` | List URL redirects for a site | Redirect management |
| `getDocsRedirect` / `findDocsRedirect` | Get or find a redirect | Redirect lookup |
| `createDocsRedirect` / `updateDocsRedirect` / `deleteDocsRedirect` | Manage redirects | URL management |
| `createDocsSite` / `updateDocsSite` / `deleteDocsSite` | Manage Docs sites | Site management |
| `getDocsSiteRestrictions` / `updateDocsSiteRestrictions` | Manage site access restrictions | Access control |
| `createDocsArticleAsset` / `createDocsSettingsAsset` | Upload assets (images, files) | Asset management |
| `testDocsConnection` | Test Docs API connectivity | Troubleshooting |
| `clearDocsCache` | Clear cached Docs data | Cache management |

### Reports & Analytics Tools

| Tool | Description | Requirements |
|------|-------------|-------------|
| `getTopArticles` | Get top most viewed docs articles sorted by popularity | Works with all plans |
| `getChatReport` | Chat conversation analytics with volume, response times, and resolution metrics | Plus/Pro plan required |
| `getEmailReport` | Email conversation analytics with volume, response times, and resolution metrics | Plus/Pro plan required |
| `getPhoneReport` | Phone conversation analytics with call volume and duration metrics | Plus/Pro plan required |
| `getUserReport` | User/team performance report with productivity metrics and happiness scores | Plus/Pro plan required |
| `getCompanyReport` | Company-wide analytics with customer volume and team performance | Plus/Pro plan required |
| `getHappinessReport` | Customer satisfaction scores and feedback analysis | Plus/Pro plan required |
| `getHappinessRatings` | Individual happiness ratings with conversation details | Plus/Pro plan required |
| `getDocsReport` | Comprehensive docs analytics report with article views and visitor metrics | Plus/Pro plan required |

### Resources

#### Conversations
- `helpscout://inboxes` - List all accessible inboxes
- `helpscout://conversations` - Search conversations with filters
- `helpscout://threads` - Get thread messages for a conversation
- `helpscout://clock` - Current server timestamp

#### Documentation
- `helpscout-docs://sites` - List all documentation sites
- `helpscout-docs://collections` - List collections with filtering
- `helpscout-docs://categories` - List categories in a collection
- `helpscout-docs://articles` - Get articles with full content

## Search Examples

> **Tip**: `searchConversations` handles listing, keyword search, and structured search — use different parameters for different needs.

### Listing Recent Conversations
```javascript
// Best for "show me recent tickets" - omit query parameter
searchConversations({
  limit: 25,
  sort: "createdAt",
  order: "desc"
})
```

### Content-Based Search
```javascript
// Best for "find tickets about X" - uses keyword search
searchConversations({
  searchTerms: ["urgent", "billing"],
  timeframeDays: 60,
  inboxId: "256809"
})
```

### Content-Specific Searches
```javascript
// Search in message bodies and subjects
searchConversations({
  searchTerms: ["refund", "cancellation"],
  searchIn: ["both"],
  timeframeDays: 30
})

// Customer organization search (structured fields)
searchConversations({
  emailDomain: "company.com",
  contentTerms: ["integration", "API"],
  status: "active"
})
```

### Help Scout Query Syntax
```javascript
// Advanced query syntax support
searchConversations({
  query: "(body:\"urgent\" OR subject:\"emergency\") AND tag:\"escalated\"",
  status: "active"
})
```

### Documentation Examples
```javascript
// List all documentation sites
listDocsSites({
  page: 1
})

// Get articles in a collection
listDocsArticlesByCollection({
  collectionId: "123456",
  status: "published",
  sort: "popularity"
})

// Get full article content
getDocsArticle({
  articleId: "789012"
})

// Update an article
updateDocsArticle({
  articleId: "789012",
  name: "Updated Article Title",
  text: "<p>New article content</p>"
})
```

### Summarizing Tickets with Transcripts
```javascript
// Single call: get latest tickets with full message transcripts
searchConversations({
  includeTranscripts: true,
  limit: 10
})

// Search with transcripts for AI analysis
searchConversations({
  searchTerms: ["billing", "refund"],
  includeTranscripts: true,
  transcriptMaxMessages: 5
})
```

### Reports Examples
```javascript
// Get email conversation report with comparison
getEmailReport({
  start: "2024-01-01T00:00:00Z",
  end: "2024-01-31T23:59:59Z",
  previousStart: "2023-12-01T00:00:00Z",
  previousEnd: "2023-12-31T23:59:59Z",
  mailboxes: ["123456"],
  viewBy: "week"
})

// Get user performance report
getUserReport({
  start: "2024-01-01T00:00:00Z",
  end: "2024-01-31T23:59:59Z",
  user: "789012",
  types: ["email", "chat"],
  officeHours: true
})

// Get happiness ratings with filters
getHappinessReport({
  start: "2024-01-01T00:00:00Z",
  end: "2024-01-31T23:59:59Z",
  rating: ["great", "okay"],
  mailboxes: ["123456"],
  viewBy: "day"
})

// Get company-wide analytics
getCompanyReport({
  start: "2024-01-01T00:00:00Z",
  end: "2024-01-31T23:59:59Z",
  viewBy: "month"
})
```

## Response Modes

The server provides three response modes to optimize token usage and support different use cases.

### Slim (default)

Every conversation and thread is stripped to just the fields that matter: id, number, subject, status, preview, assignee, customer, tags, and dates. All Help Scout API cruft (`_links`, `_embedded`, `closedByUser`, source metadata, tag styles, photo URLs, etc.) is removed automatically.

```json
{
  "id": 98234,
  "number": 14052,
  "subject": "Can't export to CSV",
  "status": "active",
  "preview": "When I click Export, nothing happens...",
  "assignee": { "first": "Rafael", "last": "Smith" },
  "customer": { "first": "Maria", "last": "Garcia", "email": "maria@example.com" },
  "tags": ["tech-support"],
  "createdAt": "2026-02-14T10:30:00Z"
}
```

### Verbose (`verbose: true`)

Returns the full, raw Help Scout API response objects. Useful for debugging or when you need a specific field that slim mode strips out. Available on every tool via a single boolean flag.

```json
{
  "id": 98234,
  "number": 14052,
  "subject": "Can't export to CSV",
  "status": "active",
  "state": "published",
  "type": "email",
  "preview": "When I click Export, nothing happens...",
  "mailboxId": 256809,
  "assignee": { "id": 12345, "first": "Rafael", "last": "Smith", "email": "rafael@company.com" },
  "createdBy": { "id": 67890, "type": "customer" },
  "customer": { "id": 67890, "first": "Maria", "last": "Garcia", "email": "maria@example.com" },
  "tags": [{ "id": 13974028, "name": "tech-support", "color": "#929292" }],
  "closedBy": null,
  "closedByUser": null,
  "source": { "type": "email", "via": "customer" },
  "_links": { "self": { "href": "..." }, "threads": { "href": "..." }, "mailbox": { "href": "..." } },
  "_embedded": { "threads": { "_links": { "..." } } }
}
```

### Transcript

Purpose-built for AI analysis and summarization. Available in two ways:

- **Single conversation**: `getThreads` with `format: "transcript"`
- **Batch with search**: `searchConversations` with `includeTranscripts: true`

Transcripts:
- Include only customer/staff messages (strips internal notes, line items, system events, draft AI replies)
- Sort chronologically (oldest first, natural reading order)
- Strip all HTML to plain text
- Clean up Help Scout Beacon form HTML (extracts the actual message from form markup)
- Respect the `REDACT_MESSAGE_CONTENT` privacy setting
- Cap message count per conversation (`transcriptMaxMessages`, default 10)

#### Inline Transcripts on Search

**Before** — summarizing 10 tickets required 11 API calls:

```javascript
// 1. Search for conversations
const results = searchConversations({ limit: 10 })

// 2. Fetch threads for each conversation individually
for (const conversation of results) {
  getThreads({ conversationId: conversation.id, format: "transcript" })
}
```

**After** — a single call:

```javascript
searchConversations({ includeTranscripts: true, limit: 10 })
```

Returns conversations with inline transcript arrays:

```json
{
  "results": [
    {
      "id": 98234,
      "subject": "Can't export to CSV",
      "status": "active",
      "customer": { "first": "Maria" },
      "transcript": [
        { "role": "customer", "from": "Maria", "date": "...", "body": "When I click Export, nothing happens..." },
        { "role": "staff", "from": "Rafael", "date": "...", "body": "Could you try disabling your browser extensions?" }
      ]
    }
  ],
  "includeTranscripts": true,
  "transcriptMaxMessages": 10
}
```

**Design notes:**
- When `includeTranscripts` is true and no limit is specified, defaults to 10 conversations (not 50)
- Thread requests fire concurrently via `Promise.allSettled` — one failed transcript doesn't break the response
- If a transcript fetch fails, the conversation still appears with `transcript: null` and a `transcriptError` field
- The transcript format is identical whether fetched via `getThreads` or `searchConversations`

## Configuration Options

| Variable | Description | Default |
|----------|-------------|---------|
| **Authentication** | | |
| `HELPSCOUT_APP_ID` | OAuth2 App ID from Help Scout My Apps | Required |
| `HELPSCOUT_APP_SECRET` | OAuth2 App Secret from Help Scout My Apps | Required |
| **Core** | | |
| `HELPSCOUT_BASE_URL` | Help Scout API endpoint | `https://api.helpscout.net/v2/` |
| `HELPSCOUT_DEFAULT_INBOX_ID` | Default inbox ID for scoped searches | Optional |
| `REDACT_MESSAGE_CONTENT` | Set `true` to hide message bodies in responses | `false` (content shown) |
| `HELPSCOUT_VERBOSE_RESPONSES` | Set `true` to return full API objects by default | `false` (slim mode) |
| `CACHE_TTL_SECONDS` | Cache duration for API responses | `300` |
| `LOG_LEVEL` | Logging verbosity (`error`, `warn`, `info`, `debug`) | `info` |
| **Docs** | | |
| `HELPSCOUT_DOCS_API_KEY` | API key for Help Scout Docs access | Required for Docs |
| `HELPSCOUT_DOCS_BASE_URL` | Help Scout Docs API endpoint | `https://docsapi.helpscout.net/v1/` |
| `HELPSCOUT_DEFAULT_DOCS_COLLECTION_ID` | Default collection ID for queries | Optional |
| `HELPSCOUT_DEFAULT_DOCS_SITE_ID` | Default Docs site ID for queries | Optional |
| `HELPSCOUT_ALLOW_DOCS_DELETE` | Enable Docs deletion operations | `false` |
| `HELPSCOUT_DISABLE_DOCS` | Set `true` to hide all Docs tools and resources | `false` |

## Smart Site & Collection Resolution

The MCP server includes intelligent natural language processing for Help Scout Docs sites and collections:

### Natural Language Queries

#### Collections
```javascript
// These all work to find GravityKit articles:
getTopDocsArticles({ query: "GravityKit docs" })
getTopDocsArticles({ query: "top GravityKit articles" })
getTopDocsArticles({ query: "What are the most popular GravityKit help articles?" })
```

#### Sites
```javascript
// Natural language site queries:
listDocsCollections({ query: "GravityKit" })  // Find GravityKit site
getSiteCollections({ query: "TrustedLogin site" })  // Get TrustedLogin collections
listDocsSites({ query: "gravity" })  // Find sites matching "gravity"
```

### Matching Algorithm
The system matches sites and collections using:
1. **Direct name match** - Exact site/collection name (100% confidence)
2. **Company/Site name match** - Company name like "GravityKit" (80-90% confidence)
3. **Subdomain match** - Matches subdomain patterns (70-80% confidence)
4. **CNAME match** - Custom domain matching (70% confidence)
5. **Partial word match** - Intelligent fuzzy matching (variable confidence)

### Default Configuration
Set default site and collection for queries without specific context:
```bash
export HELPSCOUT_DEFAULT_DOCS_SITE_ID="your-site-id"
export HELPSCOUT_DEFAULT_DOCS_COLLECTION_ID="your-collection-id"
```

### Discovery Tools
- Use `listDocsSites` to see all Docs sites (with optional NLP filtering)
- Use `listAllDocsCollections` to see all available collections across sites
- Use `getSiteCollections` to get collections for a specific site using NLP
- Sites and collections are automatically cached for performance

## Compatibility

**Works with any [Model Context Protocol (MCP)](https://modelcontextprotocol.io) compatible client:**

- **🖥️ Desktop Applications**: Claude Desktop, AI coding assistants, and other MCP-enabled desktop apps
- **📝 Code Editors**: VS Code extensions, Cursor, and other editors with MCP support
- **🔌 Custom Integrations**: Any application implementing the MCP standard
- **🛠️ Development Tools**: Command-line MCP clients and custom automation scripts

**Primary Platform**: [Claude Desktop](https://claude.ai/desktop) with full MCPB and manual configuration support

*Since this server follows the MCP standard, it automatically works with any current or future MCP-compatible client.*

## Security & Privacy

- **🔒 PII Protection**: Optional message content redaction via `REDACT_MESSAGE_CONTENT`
- **🛡️ Secure Authentication**: OAuth2 Client Credentials with automatic token refresh
- **📝 Audit Logging**: Comprehensive request tracking and error logging
- **⚡ Rate Limiting**: Built-in retry logic with exponential backoff

## Changelog

See [GitHub Releases](https://github.com/GravityKit/help-scout-mcp/releases) for version history and release notes.

## Development

```bash
# Quick start
git clone https://github.com/GravityKit/help-scout-mcp.git
cd help-scout-mcp
npm install && npm run build

# Create .env file with your credentials (OAuth2)
echo "HELPSCOUT_APP_ID=your-app-id" > .env
echo "HELPSCOUT_APP_SECRET=your-app-secret" >> .env

# Start the server
npm start
```

## Troubleshooting

### Common Issues

**Authentication Failed**
```bash
# Verify your credentials
echo $HELPSCOUT_APP_ID
echo $HELPSCOUT_APP_SECRET

# Test with curl
curl -X POST https://api.helpscout.net/v2/oauth2/token \
  -d "grant_type=client_credentials&client_id=$HELPSCOUT_APP_ID&client_secret=$HELPSCOUT_APP_SECRET"
```

**Connection Timeouts**
- Check your network connection to `api.helpscout.net`
- Verify no firewall blocking HTTPS traffic
- Consider increasing `HTTP_SOCKET_TIMEOUT` environment variable

**Rate Limiting**
- The server automatically handles rate limits with exponential backoff
- Reduce concurrent requests if you see frequent 429 errors
- Monitor logs for retry patterns

**Empty Search Results**
- Use `searchConversations` without `searchTerms` for listing, with `searchTerms` for keyword search
- Don't use empty strings `[""]` in `searchTerms`
- Verify inbox permissions with your API credentials
- Check conversation exists and you have access
- Try broader search terms or different time ranges

### Reports API "Unknown URL" Errors

If you're getting "Unknown URL" errors when accessing reports:

**1. Verify Your Plan**
- Reports API requires a **Plus** or **Pro** plan
- Standard plan users can purchase Reports as an add-on
- Check your plan: Help Scout → Manage → Account → Billing

**2. Check OAuth App Permissions**
- Go to **My Apps** → Edit your app
- Ensure **Reports** scope is selected
- Save and regenerate credentials if needed

**3. Feature Availability**
- **Happiness Reports**: Requires happiness ratings to be enabled
  - Go to: Manage → Company → Email → Happiness Ratings
- **Chat/Phone Reports**: Only available if these channels are enabled
- **Docs Reports**: Requires Help Scout Docs to be enabled

**4. API Response Debugging**
```bash
# Enable debug logging to see actual API responses
LOG_LEVEL=debug npx @gravitykit/help-scout-mcp
```

### Debug Mode

Enable debug logging to troubleshoot issues:

```bash
LOG_LEVEL=debug npx @gravitykit/help-scout-mcp
```

### Getting Help

If you're still having issues:
1. Check [existing issues](https://github.com/GravityKit/help-scout-mcp/issues)
2. Enable debug logging and share relevant logs
3. Include your configuration (without credentials!)

## Contributing

We welcome contributions! Here's how to get started:

### 🚀 Quick Development Setup

```bash
git clone https://github.com/GravityKit/help-scout-mcp.git
cd help-scout-mcp
npm install
```

### 🔧 Development Workflow

```bash
# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint

# Build for development
npm run build

# Start development server
npm run dev
```

### 📋 Before Submitting

- ✅ All tests pass (`npm test`)
- ✅ Type checking passes (`npm run type-check`)
- ✅ Linting passes (`npm run lint`)
- ✅ Add tests for new features
- ✅ Update documentation if needed

### 🐛 Bug Reports

When reporting bugs, please include:
- Help Scout MCP Server version
- Node.js version
- Authentication method used
- Error messages and logs
- Steps to reproduce

### 💡 Feature Requests

We'd love to hear your ideas! Please open an issue describing:
- The problem you're trying to solve
- Your proposed solution
- Any alternative approaches you've considered

## Support

- **Issues**: [GitHub Issues](https://github.com/GravityKit/help-scout-mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/GravityKit/help-scout-mcp/discussions)
- **NPM Package**: [@gravitykit/help-scout-mcp](https://www.npmjs.com/package/@gravitykit/help-scout-mcp)

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Need help?** [Open an issue](https://github.com/GravityKit/help-scout-mcp/issues) or check our [documentation](https://github.com/GravityKit/help-scout-mcp/wiki).