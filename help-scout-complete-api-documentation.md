# Help Scout Complete API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Rate Limits & General Specifications](#rate-limits--general-specifications)
4. [Mailbox API 2.0 Documentation](#mailbox-api-20-documentation)
5. [Docs API v1 Documentation](#docs-api-v1-documentation)
6. [SDK Resources](#sdk-resources)
7. [Best Practices](#best-practices)

---

## Overview

Help Scout provides two primary APIs for programmatic access to their platform:

### Mailbox API 2.0 (Current)
- **Purpose**: Manage customer conversations, users, teams, inboxes, and reporting
- **Base URL**: `https://api.helpscout.net/v2`
- **Authentication**: OAuth 2.0
- **Status**: Current API - Legacy Mailbox API 1.0 was deprecated November 20, 2019

### Docs API v1 (Current)
- **Purpose**: Manage knowledge base articles, collections, categories, and sites
- **Base URL**: `https://docsapi.helpscout.net/`
- **Authentication**: API Key via HTTP Basic Authentication
- **Status**: Current and stable v1 API

---

## Authentication

### Mailbox API 2.0 Authentication

The Mailbox API uses **OAuth 2.0** with two supported flows:

#### Prerequisites
- Create OAuth2 application via "Your Profile > My apps"
- Obtain Application ID and Application Secret
- Set redirection URL for Authorization Code flow

#### Authorization Code Flow
For integrations used by other Help Scout users:

1. **Authorization Request**:
```
https://secure.helpscout.net/authentication/authorizeClientApplication?client_id={application_id}&state={your_secret}
```

2. **Token Exchange**:
```bash
curl -X POST https://api.helpscout.net/v2/oauth2/token \
    --data "grant_type=authorization_code" \
    --data "client_id={application_id}" \
    --data "client_secret={application_secret}" \
    --data "code={authorization_code}"
```

#### Client Credentials Flow
For internal integrations:

```bash
curl -X POST https://api.helpscout.net/v2/oauth2/token \
    --data "grant_type=client_credentials" \
    --data "client_id={application_id}" \
    --data "client_secret={application_secret}"
```

**Token Details**:
- Access tokens valid for 2 days
- Refresh tokens provided with Authorization Code flow
- Token length may vary - use variable-length storage
- Include in requests: `Authorization: Bearer {access_token}`

#### Token Refresh
```bash
curl -X POST https://api.helpscout.net/v2/oauth2/token \
    --data "grant_type=refresh_token" \
    --data "refresh_token={refresh_token}" \
    --data "client_id={application_id}" \
    --data "client_secret={application_secret}"
```

### Docs API v1 Authentication

Uses **HTTP Basic Authentication** with API key:

#### Getting Your API Key
1. Click "person" icon (top right) → "Your Profile"
2. Click "Authentication" → "API Keys" tab
3. Generate or manage your API key

#### Authentication Method
- **Username**: Your API key
- **Password**: Dummy value (e.g., "X")

```bash
curl --user API_KEY:X https://docsapi.helpscout.net/v1/collections
```

**Requirements**: 
- "Docs: Create new, edit settings & Collections" permission required for API key access

---

## Rate Limits & General Specifications

### Mailbox API 2.0
- **Rate Limits**: Not explicitly documented, but standard OAuth rate limiting applies
- **Format**: JSON only
- **Protocol**: HTTPS only
- **CORS**: Supported
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer {token}`

### Docs API v1
**Rate Limits** (per 10-minute window):
- 1 site: 2,000 requests
- 2 sites: 3,000 requests
- 3+ sites: 4,000 requests

**Rate Limit Headers**:
- `X-RateLimit-Limit`: Total limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time

**General Specifications**:
- **Format**: JSON only
- **Protocol**: HTTPS only
- **Pagination**: Maximum 50 records per page
- **Timestamps**: ISO8601 format in UTC
- **Correlation**: `Correlation-Id` header for request tracing

### Response Formats

#### Mailbox API 2.0
**Success Response**:
```json
{
  "_embedded": {
    "conversations": [...]
  },
  "page": {
    "size": 25,
    "totalElements": 100,
    "totalPages": 4,
    "number": 1
  }
}
```

#### Docs API v1
**Single Item**:
```json
{
  "item": {
    "id": "123",
    "name": "Example"
  }
}
```

**Collection**:
```json
{
  "page": 1,
  "pages": 5,
  "count": 125,
  "items": [...]
}
```

**Error**:
```json
{
  "status": 400,
  "error": "Bad Request",
  "correlationId": "123e4567-e89b-12d3-a456-426614174000"
}
```

---

## Mailbox API 2.0 Documentation

### Base Information
- **Base URL**: `https://api.helpscout.net/v2`
- **Authentication**: OAuth 2.0 Bearer token
- **Format**: JSON
- **Available to**: All Help Scout users on paid plans

### Core Resources

#### 1. Conversations

##### Create Conversation
**Endpoint**: `POST /v2/conversations`

**Required Parameters**:
```json
{
  "subject": "Conversation title",
  "customer": {
    "id": 100
    // OR
    "email": "bear@acme.com",
    "firstName": "Vernon",
    "lastName": "Bear"
  },
  "mailboxId": 123,
  "type": "chat|email|phone",
  "status": "active|closed|pending",
  "threads": [
    {
      "type": "customer",
      "customer": {"id": 100},
      "text": "Hello, I need help with..."
    }
  ]
}
```

**Optional Parameters**:
- `assignTo`: User ID or `null` for unassigned
- `autoReply`: Boolean for automatic replies
- `imported`: Boolean for historical conversations
- `tags`: Array of tag strings
- `fields`: Custom field values

**Response**: `201 Created`
```json
{
  "id": 12345,
  "subject": "Conversation title",
  "status": "active",
  "_links": {
    "web": {"href": "https://secure.helpscout.net/conversation/12345"}
  }
}
```

**Limitations**:
- Maximum 100 threads per conversation
- Customer creation via email (if not exists)

##### Get Conversation
**Endpoint**: `GET /v2/conversations/{id}`

**Query Parameters**:
- `embed`: Comma-separated values (`threads`, `customer`, `mailbox`)

**Response**: `200 OK`
```json
{
  "id": 12345,
  "number": 3,
  "subject": "I need help!",
  "status": "active",
  "type": "email",
  "folderId": 123,
  "isDraft": false,
  "mailbox": {
    "id": 123,
    "name": "My Mailbox"
  },
  "customer": {
    "id": 456,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  },
  "assignee": {
    "id": 789,
    "firstName": "Agent",
    "lastName": "Smith"
  },
  "createdAt": "2020-01-01T12:00:00Z",
  "updatedAt": "2020-01-02T12:00:00Z",
  "tags": ["urgent", "billing"],
  "customFields": [
    {
      "id": 123,
      "name": "Priority",
      "value": "High"
    }
  ]
}
```

##### List Conversations
**Endpoint**: `GET /v2/conversations`

**Query Parameters**:
- `mailbox`: Mailbox ID filter
- `folder`: Folder ID filter  
- `status`: `active|closed|pending|spam`
- `assignee`: User ID filter
- `customerEmail`: Customer email filter
- `customerName`: Customer name filter
- `modifiedSince`: ISO8601 date
- `sortField`: `number|subject|updatedAt|customerName`
- `sortOrder`: `asc|desc`
- `query`: Search query
- `embed`: `threads`
- `page`: Page number
- `size`: Page size (max 50)

**Response**: `200 OK`
```json
{
  "_embedded": {
    "conversations": [
      {
        "id": 12345,
        "number": 3,
        "subject": "Need help",
        "status": "active"
        // ... other conversation fields
      }
    ]
  },
  "page": {
    "size": 25,
    "totalElements": 100,
    "totalPages": 4,
    "number": 1
  }
}
```

##### Update Conversation
**Endpoint**: `PATCH /v2/conversations/{id}`

**Request Body**:
```json
{
  "subject": "Updated subject",
  "status": "closed",
  "assignee": 789,
  "tags": ["resolved", "billing"],
  "customFields": [
    {
      "id": 123,
      "value": "Updated value"
    }
  ]
}
```

**Response**: `204 No Content`

##### Delete Conversation
**Endpoint**: `DELETE /v2/conversations/{id}`

**Response**: `204 No Content`

#### 2. Customers

##### Create Customer
**Endpoint**: `POST /v2/customers`

**Request Body**:
```json
{
  "firstName": "Vernon",
  "lastName": "Bear",
  "phone": "+1-555-123-4567",
  "photoUrl": "https://example.com/photo.jpg",
  "jobTitle": "Developer",
  "photoType": "twitter",
  "background": "VIP customer notes",
  "location": "Austin, TX",
  "organization": "Acme Corp",
  "gender": "male|female|unknown",
  "age": "25-35",
  "emails": [
    {
      "type": "work|home|other",
      "value": "bear@acme.com"
    }
  ],
  "phones": [
    {
      "type": "work|home|mobile|other", 
      "value": "+1-555-123-4567"
    }
  ],
  "chats": [
    {
      "type": "aim|gtalk|icq|xmpp|msn|skype|yahoo|qq|other",
      "value": "bear_chat_handle"
    }
  ],
  "socialProfiles": [
    {
      "type": "twitter|facebook|linkedin|aboutme|google|gravatar|klout|foursquare|youtube|flickr|other",
      "value": "https://twitter.com/bear"
    }
  ],
  "websites": [
    {
      "value": "https://bear.example.com"
    }
  ],
  "address": {
    "lines": ["123 Main St", "Apt 4"],
    "city": "Austin",
    "state": "TX",
    "postalCode": "78701",
    "country": "US"
  },
  "properties": {
    "property_slug": "property_value"
  }
}
```

**Field Constraints**:
- `firstName`: 1-40 characters
- `lastName`: 1-40 characters
- `photoUrl`: Max 200 characters
- `jobTitle`: Max 60 characters
- `background`: Max 200 characters
- `location`: Max 60 characters
- `organization`: Max 60 characters

**Response**: `201 Created`
```json
{
  "id": 456,
  "firstName": "Vernon",
  "lastName": "Bear"
  // ... other customer fields
}
```
Headers include: `Resource-ID` and `Location`

##### Get Customer
**Endpoint**: `GET /v2/customers/{id}`

**Response**: `200 OK`
```json
{
  "id": 456,
  "firstName": "Vernon",
  "lastName": "Bear",
  "fullName": "Vernon Bear",
  "gender": "unknown",
  "jobTitle": "Developer",
  "location": "Austin, TX",
  "organization": "Acme Corp",
  "photoUrl": "https://example.com/photo.jpg",
  "createdAt": "2020-01-01T12:00:00Z",
  "updatedAt": "2020-01-02T12:00:00Z",
  "emails": [
    {
      "id": 1,
      "value": "bear@acme.com",
      "type": "work"
    }
  ],
  "phones": [...],
  "chats": [...],
  "socialProfiles": [...],
  "websites": [...],
  "address": {
    "id": 1,
    "lines": ["123 Main St"],
    "city": "Austin",
    "state": "TX",
    "postalCode": "78701",
    "country": "US",
    "createdAt": "2020-01-01T12:00:00Z",
    "updatedAt": "2020-01-01T12:00:00Z"
  },
  "properties": [...]
}
```

##### List Customers
**Endpoint**: `GET /v2/customers`

**Query Parameters**:
- `firstName`: Filter by first name
- `lastName`: Filter by last name
- `email`: Filter by email address
- `modifiedSince`: ISO8601 date
- `sortField`: `firstName|lastName|email|modifiedAt`
- `sortOrder`: `asc|desc`
- `query`: Search query
- `page`: Page number
- `size`: Page size (max 50)

##### Update Customer
**Endpoint**: `PATCH /v2/customers/{id}`

Supports atomic updates of entire customer object including all entries.

**Request Body**: Same structure as Create Customer

**Response**: `204 No Content`

##### Delete Customer
**Endpoint**: `DELETE /v2/customers/{id}`

**Restrictions**: Customer must have 100 or fewer conversations

**Response**: `204 No Content`

#### 3. Teams

##### List Teams
**Endpoint**: `GET /v2/teams`

**Response**: `200 OK`
```json
{
  "_embedded": {
    "teams": [
      {
        "id": 10,
        "name": "Support Team",
        "memberCount": 5
      }
    ]
  }
}
```

##### Get Team
**Endpoint**: `GET /v2/teams/{id}`

**Response**: `200 OK`
```json
{
  "id": 10,
  "name": "Support Team",
  "memberCount": 5,
  "createdAt": "2020-01-01T12:00:00Z",
  "updatedAt": "2020-01-02T12:00:00Z"
}
```

##### List Team Members
**Endpoint**: `GET /v2/teams/{teamId}/members`

**Query Parameters**:
- `page`: Page number for pagination

**Response**: `200 OK` (HAL+JSON format)
```json
{
  "_embedded": {
    "users": [
      {
        "id": 123,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@company.com",
        "role": "admin|user|owner",
        "timezone": "America/New_York",
        "photoUrl": "https://example.com/photo.jpg",
        "createdAt": "2020-01-01T12:00:00Z",
        "updatedAt": "2020-01-02T12:00:00Z",
        "type": "user",
        "mention": "john",
        "initials": "JD",
        "jobTitle": "Support Agent",
        "phone": "+1-555-123-4567",
        "alternateEmails": ["john.doe@company.com"]
      }
    ]
  },
  "page": {
    "size": 50,
    "totalElements": 5,
    "totalPages": 1,
    "number": 1
  },
  "_links": {
    "first": {"href": "/v2/teams/10/members?page=1"},
    "last": {"href": "/v2/teams/10/members?page=1"}
  }
}
```

#### 4. Users

##### List Users
**Endpoint**: `GET /v2/users`

**Query Parameters**:
- `email`: Filter by email
- `mailbox`: Filter by mailbox ID
- `page`: Page number
- `size`: Page size

##### Get User
**Endpoint**: `GET /v2/users/{id}`

##### Get Current User
**Endpoint**: `GET /v2/users/me`

#### 5. Mailboxes

##### List Mailboxes
**Endpoint**: `GET /v2/mailboxes`

##### Get Mailbox
**Endpoint**: `GET /v2/mailboxes/{id}`

##### List Mailbox Folders
**Endpoint**: `GET /v2/mailboxes/{id}/folders`

#### 6. Threads

##### Create Thread
**Endpoint**: `POST /v2/conversations/{conversationId}/threads`

**Thread Types**:
- `customer`: Message from customer
- `note`: Internal note
- `reply`: Reply to customer
- `phone`: Phone call summary
- `chat`: Chat message

**Request Body**:
```json
{
  "type": "reply",
  "text": "Thank you for contacting us...",
  "user": 123,
  "customer": 456,
  "attachments": [
    {
      "fileName": "document.pdf",
      "mimeType": "application/pdf", 
      "data": "base64_encoded_data"
    }
  ]
}
```

**Response**: `201 Created`

##### Get Thread
**Endpoint**: `GET /v2/conversations/{conversationId}/threads/{threadId}`

##### List Threads
**Endpoint**: `GET /v2/conversations/{conversationId}/threads`

#### 7. Tags

##### List Tags
**Endpoint**: `GET /v2/tags`

#### 8. Attachments

##### Create Attachment
**Endpoint**: `POST /v2/attachments`

**Request Body**:
```json
{
  "fileName": "document.pdf",
  "mimeType": "application/pdf",
  "data": "base64_encoded_file_data"
}
```

**Response**: `201 Created`
```json
{
  "id": 123,
  "fileName": "document.pdf",
  "mimeType": "application/pdf",
  "size": 1024
}
```

##### Get Attachment Data
**Endpoint**: `GET /v2/attachments/{id}/data`

**Response**: `200 OK`
- Returns the actual file data

##### Delete Attachment
**Endpoint**: `DELETE /v2/attachments/{id}`

#### 9. Custom Fields

##### Update Custom Fields
**Endpoint**: `PATCH /v2/conversations/{id}/fields`

**Request Body**:
```json
{
  "fields": [
    {
      "id": 123,
      "value": "Updated value"
    }
  ]
}
```

#### 10. Workflows

##### List Workflows
**Endpoint**: `GET /v2/workflows`

##### Update Workflow Status
**Endpoint**: `PATCH /v2/workflows/{id}`

##### Run Manual Workflow
**Endpoint**: `POST /v2/workflows/{id}/run`

#### 11. Webhooks

##### List Webhooks
**Endpoint**: `GET /v2/webhooks`

##### Create Webhook
**Endpoint**: `POST /v2/webhooks`

**Request Body**:
```json
{
  "url": "https://your-app.com/webhook",
  "events": ["conversation.created", "conversation.updated"],
  "label": "My Webhook",
  "payloadVersion": "v2"
}
```

**Available Events**:
- `conversation.created`
- `conversation.updated` 
- `conversation.deleted`
- `conversation.assigned`
- `conversation.unassigned`
- `conversation.moved`
- `conversation.status`
- `conversation.tags`
- `conversation.merged`
- `customer.created`
- `customer.updated`
- `customer.deleted`
- `satisfaction.ratings`

**Response**: `201 Created`

##### Get Webhook
**Endpoint**: `GET /v2/webhooks/{id}`

##### Update Webhook
**Endpoint**: `PATCH /v2/webhooks/{id}`

##### Delete Webhook
**Endpoint**: `DELETE /v2/webhooks/{id}`

#### 12. Reports

Help Scout provides comprehensive reporting capabilities across multiple categories:

##### Conversation Reports

**Overall Report**
- **Endpoint**: `GET /v2/reports/conversations`
- **Parameters**: `start`, `end`, `previousStart`, `previousEnd`, `mailboxes`, `tags`, `types`, `folders`

**Volume by Channel Report**
- **Endpoint**: `GET /v2/reports/conversations/volume-by-channel`

**Busiest Time of Day Report**
- **Endpoint**: `GET /v2/reports/conversations/busiest-time`

**New Conversations Report**
- **Endpoint**: `GET /v2/reports/conversations/new`

**Received Messages Report**
- **Endpoint**: `GET /v2/reports/conversations/received-messages`

**Conversations Drilldown**
- **Endpoint**: `GET /v2/reports/conversations/drilldown`

##### User Reports

**User Overall Report**
- **Endpoint**: `GET /v2/reports/user`

**User Conversation History**
- **Endpoint**: `GET /v2/reports/user/conversation-history`

**User Customers Helped**
- **Endpoint**: `GET /v2/reports/user/customers-helped`

**User Happiness Report**
- **Endpoint**: `GET /v2/reports/user/happiness`

**User Replies Report**
- **Endpoint**: `GET /v2/reports/user/replies`

**User Resolutions Report**
- **Endpoint**: `GET /v2/reports/user/resolutions`

##### Company Reports

**Company Overall Report**
- **Endpoint**: `GET /v2/reports/company`

**Company Customers Helped**
- **Endpoint**: `GET /v2/reports/company/customers-helped`

##### Docs Reports

**Docs Overall Report**
- **Endpoint**: `GET /v2/reports/docs`

**Parameters for All Reports**:
- `start`: Start date (ISO8601)
- `end`: End date (ISO8601)
- `previousStart`: Previous period start (optional)
- `previousEnd`: Previous period end (optional)
- `mailboxes`: Comma-separated mailbox IDs
- `tags`: Comma-separated tag IDs
- `types`: Conversation types filter
- `folders`: Folder IDs filter

**Response Format**:
```json
{
  "filterTags": [],
  "current": {
    "startDate": "2020-01-01T00:00:00Z",
    "endDate": "2020-01-31T23:59:59Z",
    "totalConversations": 150,
    "conversationsCreated": 125,
    // ... other metrics
  },
  "previous": {
    // Previous period data for comparison
  }
}
```

---

## Docs API v1 Documentation

### Base Information
- **Base URL**: `https://docsapi.helpscout.net/`
- **Version**: v1
- **Authentication**: API Key via HTTP Basic Authentication
- **Format**: JSON only

### Core Resources

#### 1. Articles

##### List Articles
**Endpoints**: 
- `GET /v1/collections/{id}/articles`
- `GET /v1/categories/{id}/articles`

**Query Parameters**:
- `page` (optional, default: 1): Page number
- `status` (optional, default: "all"): Filter options
  - `"all"`
  - `"published"`
  - `"notpublished"`
- `sort` (optional, default: "order"): Sort by
  - `"number"`
  - `"status"`
  - `"name"`
  - `"popularity"`
  - `"createdAt"`
  - `"updatedAt"`
- `order` (optional, default: "desc"): Sort direction
  - `"asc"`
  - `"desc"`
- `pageSize` (optional, default: 50, max: 100): Results per page

**Example Request**:
```bash
curl --user API_KEY:X "https://docsapi.helpscout.net/v1/collections/123/articles?status=published&sort=popularity&order=desc"
```

**Response**: `200 OK`
```json
{
  "page": 1,
  "pages": 3,
  "count": 125,
  "items": [
    {
      "id": "5c123abc456def789",
      "number": 42,
      "status": "published",
      "name": "How to Get Started",
      "publicUrl": "https://docs.company.com/article/42-how-to-get-started",
      "popularity": 85.5,
      "viewCount": 1250,
      "collectionId": "5c111abc456def777",
      "createdBy": 123,
      "updatedBy": 456,
      "createdAt": "2020-01-01T12:00:00Z",
      "updatedAt": "2020-01-15T10:30:00Z"
    }
  ]
}
```

##### Get Article
**Endpoint**: `GET /v1/articles/{id|number}`

**Response**: `200 OK`
```json
{
  "article": {
    "id": "5c123abc456def789",
    "number": 42,
    "collectionId": "5c111abc456def777",
    "categoryIds": ["5c222abc456def888"],
    "status": "published",
    "name": "How to Get Started",
    "slug": "how-to-get-started",
    "hasDraft": false,
    "text": "<p>Article content in HTML format...</p>",
    "categories": ["Getting Started"],
    "popularity": 85.5,
    "viewCount": 1250,
    "publicUrl": "https://docs.company.com/article/42-how-to-get-started",
    "createdBy": 123,
    "updatedBy": 456,
    "createdAt": "2020-01-01T12:00:00Z",
    "updatedAt": "2020-01-15T10:30:00Z",
    "lastPublishedAt": "2020-01-15T10:30:00Z"
  }
}
```

##### Search Articles
**Endpoint**: `GET /v1/search/articles`

**Query Parameters**:
- `query` (required): Search terms
- `collectionId` (optional): Limit to specific collection
- `status` (optional): `published|notpublished|all`
- `page` (optional): Page number
- `pageSize` (optional, max: 100): Results per page

**Example Request**:
```bash
curl --user API_KEY:X "https://docsapi.helpscout.net/v1/search/articles?query=getting+started&status=published"
```

**Response**: `200 OK`
```json
{
  "page": 1,
  "pages": 1,
  "count": 3,
  "items": [
    {
      "id": "5c123abc456def789",
      "number": 42,
      "name": "How to Get Started",
      "preview": "This article will help you get started with...",
      "url": "https://docs.company.com/article/42-how-to-get-started",
      "collectionId": "5c111abc456def777",
      "categoryIds": ["5c222abc456def888"]
    }
  ]
}
```

##### Create Article
**Endpoint**: `POST /v1/articles`

**Request Body**:
```json
{
  "collectionId": "5c111abc456def777",
  "categoryIds": ["5c222abc456def888"],
  "name": "New Article Title",
  "text": "<p>Article content in HTML format...</p>",
  "slug": "new-article-title",
  "status": "published|notpublished",
  "tags": "tag1,tag2,tag3"
}
```

**Response**: `201 Created`

##### Update Article
**Endpoint**: `PUT /v1/articles/{id}`

**Request Body**: Same as Create Article

**Response**: `200 OK`

##### Delete Article
**Endpoint**: `DELETE /v1/articles/{id}`

**Response**: `200 OK`

##### Upload Article Asset
**Endpoint**: `POST /v1/articles/{id}/assets`

**Request**: Multipart form data
- `file`: The file to upload
- `assetType`: Type of asset

**Response**: `201 Created`

##### Update Article View Count
**Endpoint**: `PUT /v1/articles/{id}/views`

**Response**: `200 OK`

##### Save Article Draft
**Endpoint**: `PUT /v1/articles/{id}/drafts`

##### Delete Article Draft
**Endpoint**: `DELETE /v1/articles/{id}/drafts`

#### 2. Collections

##### List Collections
**Endpoint**: `GET /v1/collections`

**Query Parameters**:
- `siteId` (optional): Filter by site
- `page` (optional): Page number
- `pageSize` (optional, max: 100): Results per page

**Response**: `200 OK`
```json
{
  "page": 1,
  "pages": 1,
  "count": 5,
  "items": [
    {
      "id": "5c111abc456def777",
      "siteId": "5c000abc456def666",
      "number": 1,
      "slug": "getting-started",
      "visibility": "public|private",
      "order": 1,
      "name": "Getting Started",
      "description": "Basic setup and configuration guides",
      "publicUrl": "https://docs.company.com/collection/1-getting-started",
      "articleCount": 15,
      "publishedArticleCount": 12,
      "createdBy": 123,
      "updatedBy": 456,
      "createdAt": "2020-01-01T12:00:00Z",
      "updatedAt": "2020-01-15T10:30:00Z"
    }
  ]
}
```

##### Get Collection
**Endpoint**: `GET /v1/collections/{id|number}`

**Response**: `200 OK`
```json
{
  "collection": {
    "id": "5c111abc456def777",
    "siteId": "5c000abc456def666",
    "number": 1,
    "slug": "getting-started",
    "visibility": "public",
    "order": 1,
    "name": "Getting Started",
    "description": "Basic setup and configuration guides",
    "publicUrl": "https://docs.company.com/collection/1-getting-started",
    "articleCount": 15,
    "publishedArticleCount": 12,
    "createdBy": 123,
    "updatedBy": 456,
    "createdAt": "2020-01-01T12:00:00Z",
    "updatedAt": "2020-01-15T10:30:00Z"
  }
}
```

##### Create Collection
**Endpoint**: `POST /v1/collections`

**Request Body**:
```json
{
  "siteId": "5c000abc456def666",
  "name": "New Collection",
  "description": "Collection description",
  "slug": "new-collection",
  "visibility": "public|private"
}
```

**Response**: `201 Created`

##### Update Collection
**Endpoint**: `PUT /v1/collections/{id}`

**Request Body**: Same as Create Collection

**Response**: `200 OK`

##### Delete Collection
**Endpoint**: `DELETE /v1/collections/{id}`

**Response**: `200 OK`

#### 3. Categories

##### List Categories
**Endpoint**: `GET /v1/collections/{collectionId}/categories`

**Query Parameters**:
- `page` (optional): Page number
- `pageSize` (optional, max: 100): Results per page
- `sort` (optional): `order|name|createdAt|updatedAt`
- `order` (optional): `asc|desc`

**Response**: `200 OK`
```json
{
  "page": 1,
  "pages": 1,
  "count": 8,
  "items": [
    {
      "id": "5c222abc456def888",
      "collectionId": "5c111abc456def777",
      "number": 1,
      "slug": "installation",
      "name": "Installation",
      "order": 1,
      "articleCount": 5,
      "publishedArticleCount": 4,
      "createdBy": 123,
      "updatedBy": 456,
      "createdAt": "2020-01-01T12:00:00Z",
      "updatedAt": "2020-01-15T10:30:00Z"
    }
  ]
}
```

##### Get Category
**Endpoint**: `GET /v1/categories/{id|number}`

**Response**: `200 OK`
```json
{
  "category": {
    "id": "5c222abc456def888",
    "collectionId": "5c111abc456def777",
    "number": 1,
    "slug": "installation",
    "name": "Installation",
    "order": 1,
    "articleCount": 5,
    "publishedArticleCount": 4,
    "createdBy": 123,
    "updatedBy": 456,
    "createdAt": "2020-01-01T12:00:00Z",
    "updatedAt": "2020-01-15T10:30:00Z"
  }
}
```

##### Create Category
**Endpoint**: `POST /v1/categories`

**Request Body**:
```json
{
  "collectionId": "5c111abc456def777",
  "name": "New Category",
  "slug": "new-category"
}
```

**Response**: `201 Created`

##### Update Category
**Endpoint**: `PUT /v1/categories/{id}`

**Request Body**: Same as Create Category

**Response**: `200 OK`

##### Update Category Order
**Endpoint**: `PUT /v1/collections/{collectionId}/categories`

**Request Body**:
```json
{
  "categories": [
    {"id": "5c222abc456def888", "order": 1},
    {"id": "5c333abc456def999", "order": 2}
  ]
}
```

**Response**: `200 OK`

##### Delete Category
**Endpoint**: `DELETE /v1/categories/{id}`

**Response**: `200 OK`

#### 4. Sites

##### List Sites
**Endpoint**: `GET /v1/sites`

**Query Parameters**:
- `page` (optional): Page number
- `pageSize` (optional, max: 100): Results per page

**Example Request**:
```bash
curl --user API_KEY:X "https://docsapi.helpscout.net/v1/sites?page=2"
```

**Response**: `200 OK`
```json
{
  "page": 1,
  "pages": 1,
  "count": 2,
  "items": [
    {
      "id": "5c000abc456def666",
      "subdomain": "mycompany-docs",
      "cname": "docs.mycompany.com",
      "title": "My Company Documentation",
      "logoUrl": "https://example.com/logo.png",
      "logoWidth": 150,
      "logoHeight": 50,
      "hasPublicSite": true,
      "restricted": false,
      "createdBy": 123,
      "updatedBy": 456,
      "createdAt": "2020-01-01T12:00:00Z",
      "updatedAt": "2020-01-15T10:30:00Z"
    }
  ]
}
```

##### Get Site
**Endpoint**: `GET /v1/sites/{id}`

**Response**: `200 OK`
```json
{
  "site": {
    "id": "5c000abc456def666",
    "subdomain": "mycompany-docs", 
    "cname": "docs.mycompany.com",
    "title": "My Company Documentation",
    "logoUrl": "https://example.com/logo.png",
    "logoWidth": 150,
    "logoHeight": 50,
    "hasPublicSite": true,
    "restricted": false,
    "createdBy": 123,
    "updatedBy": 456,
    "createdAt": "2020-01-01T12:00:00Z",
    "updatedAt": "2020-01-15T10:30:00Z"
  }
}
```

##### Delete Site
**Endpoint**: `DELETE /v1/sites/{id}`

**Response**: `200 OK`

##### Get Site Restrictions
**Endpoint**: `GET /v1/sites/{id}/restrictions`

**Response**: `200 OK` (if restricted docs enabled)
```json
{
  "restricted": true,
  "type": "email|password",
  "settings": {
    // Restriction-specific settings
  }
}
```

##### Update Site Restrictions
**Endpoint**: `PUT /v1/sites/{siteId}/restricted`

**Request Body** (Email restriction):
```json
{
  "restricted": true,
  "type": "email",
  "emailDomains": ["company.com", "partner.com"],
  "emailAddresses": ["user@example.com"]
}
```

**Request Body** (Password restriction):
```json
{
  "restricted": true,
  "type": "password",
  "password": "secret_password"
}
```

**Response**: `200 OK`

**Note**: Restricted Docs requires Plus or Pro plan

#### 5. Assets

##### Upload Asset
**Endpoint**: `POST /v1/assets`

**Request**: Multipart form data
- `file`: The file to upload
- `articleId`: Article ID to associate with

**Response**: `201 Created`
```json
{
  "asset": {
    "id": "5c444abc456def000",
    "fileName": "screenshot.png",
    "contentType": "image/png",
    "size": 52428,
    "url": "https://assets.helpscout.net/docs/5c444abc456def000/screenshot.png"
  }
}
```

##### Get Asset
**Endpoint**: `GET /v1/assets/{id}`

**Response**: `200 OK`
```json
{
  "asset": {
    "id": "5c444abc456def000",
    "fileName": "screenshot.png",
    "contentType": "image/png",
    "size": 52428,
    "url": "https://assets.helpscout.net/docs/5c444abc456def000/screenshot.png",
    "articleId": "5c123abc456def789",
    "createdAt": "2020-01-01T12:00:00Z"
  }
}
```

##### Delete Asset
**Endpoint**: `DELETE /v1/assets/{id}`

**Response**: `200 OK`

#### 6. Redirects

##### List Redirects
**Endpoint**: `GET /v1/redirects`

**Query Parameters**:
- `siteId` (optional): Filter by site
- `page` (optional): Page number
- `pageSize` (optional, max: 100): Results per page

**Response**: `200 OK`
```json
{
  "page": 1,
  "pages": 1,
  "count": 10,
  "items": [
    {
      "id": "5c555abc456def111",
      "siteId": "5c000abc456def666",
      "urlMapping": "/old-path",
      "redirect": "/new-path",
      "createdAt": "2020-01-01T12:00:00Z"
    }
  ]
}
```

##### Create Redirect
**Endpoint**: `POST /v1/redirects`

**Request Body**:
```json
{
  "siteId": "5c000abc456def666",
  "urlMapping": "/old-path",
  "redirect": "/new-path"
}
```

**Response**: `201 Created`

##### Get Redirect
**Endpoint**: `GET /v1/redirects/{id}`

##### Update Redirect
**Endpoint**: `PUT /v1/redirects/{id}`

##### Delete Redirect
**Endpoint**: `DELETE /v1/redirects/{id}`

---

## SDK Resources

### Official SDKs
- **PHP SDK**: Available from Help Scout

### Community SDKs

#### Node.js
- **helpscout-mailbox-api** by turakvlad
  - GitHub: https://github.com/turakvlad/helpscout-mailbox-api
  - Support: Mailbox API 2.0

- **HelpScout SDK** by shaun3141
  - GitHub: https://github.com/shaun3141/HelpScout
  - Support: Mailbox API 2.0

#### .NET
- **HelpScoutSharp** by Wish-Org/better-reports
  - GitHub: https://github.com/better-reports/HelpScoutSharp
  - Support: Mailbox API 2.0

#### Integration Tools
- **help-scout-docs** by Guestfolio
  - GitHub: https://github.com/Guestfolio/help-scout-docs  
  - Support: Docs API integration

---

## Best Practices

### Authentication
1. **Token Security**: Store tokens securely, never commit to version control
2. **Token Refresh**: Implement automatic token refresh for Authorization Code flow
3. **Error Handling**: Handle 401 errors gracefully and re-authenticate
4. **Variable Storage**: Use variable-length storage for tokens (they may change size)

### Rate Limiting
1. **Respect Limits**: Monitor rate limit headers and adjust request frequency
2. **Retry Logic**: Implement exponential backoff for 429 errors
3. **Batch Operations**: Group related operations to minimize API calls
4. **Docs API**: Monitor site count as it affects rate limits

### Data Management
1. **Pagination**: Always handle paginated responses properly
2. **Filtering**: Use query parameters to fetch only needed data
3. **Embedding**: Use embed parameters to reduce API calls (Mailbox API)
4. **Webhooks**: Use webhooks for real-time updates instead of polling

### Error Handling
1. **Correlation IDs**: Log correlation IDs for debugging (Docs API)
2. **Status Codes**: Handle all relevant HTTP status codes
3. **Validation**: Validate data before sending to API
4. **Timeouts**: Implement reasonable request timeouts

### Security
1. **HTTPS Only**: Both APIs require HTTPS
2. **Credentials**: Rotate API keys and OAuth credentials regularly
3. **Permissions**: Use least-privilege principle for API access
4. **Validation**: Validate webhook payloads if implementing webhooks

### Performance
1. **Caching**: Cache frequently accessed data appropriately
2. **Parallel Requests**: Make parallel requests when possible
3. **Compression**: Enable gzip compression for large responses
4. **Connection Reuse**: Reuse HTTP connections when possible

### Maintenance
1. **API Versions**: Stay updated with API changelog and deprecation notices
2. **Documentation**: Keep integration documentation updated
3. **Monitoring**: Monitor API usage and performance
4. **Testing**: Implement comprehensive API integration tests

---

## Changelog Notes

### Mailbox API 2.0
- Legacy Mailbox API 1.0 deprecated November 20, 2019
- Current API available to all paid plan users
- Regular updates documented in official changelog

### Docs API v1
- Stable v1 API in active development
- Rate limits based on site count
- Restricted Docs feature requires Plus or Pro plan

---

*Last Updated: 2024*  
*For the most current information, always refer to the official Help Scout Developer documentation at https://developer.helpscout.com/*