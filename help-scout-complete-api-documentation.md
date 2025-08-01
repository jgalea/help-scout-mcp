# Help Scout Complete API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Rate Limits & General Specifications](#rate-limits--general-specifications)
4. [Mailbox API 2.0 Documentation](#mailbox-api-20-documentation)
   - [Conversations](#1-conversations)
   - [Customers](#2-customers)
   - [Teams](#3-teams)
   - [Users](#4-users)
   - [Mailboxes](#5-mailboxes)
   - [Threads](#6-threads)
   - [Tags](#7-tags)
   - [Attachments](#8-attachments)
   - [Custom Fields](#9-custom-fields)
   - [Workflows](#10-workflows)
   - [Webhooks](#11-webhooks)
   - [Saved Replies](#12-saved-replies)
   - [Customer Properties](#13-customer-properties)
   - [Satisfaction Ratings](#14-satisfaction-ratings)
   - [Reports](#15-reports)
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
- `mailbox`: Mailbox ID filter (comma-separated for multiple)
- `folder`: Folder ID filter
- `status`: `active|closed|pending|spam|all` (default: all)
- `assignee`: User ID filter (specific user)
- `assigned_to`: Alternative assignee filter
- `tag`: Filter by conversation tags
- `customerEmail`: Customer email filter
- `customerName`: Customer name filter
- `modifiedSince`: ISO8601 date for incremental updates
- `sortField`: `number|subject|updatedAt|customerName|createdAt|customerEmail|status`
- `sortOrder`: `asc|desc` (default: desc)
- `query`: Advanced search query with operators
  - Subject searches: `subject:"issue with login"`
  - Tag searches: `tag:urgent`
  - Date ranges: `createdAt:[2020-01-01 TO 2020-12-31]`
  - Email searches: `email:user@example.com`
  - Body text: `body:"error message"`
  - NOT operator: `NOT tag:spam`
  - Combined: `tag:urgent AND status:active`
- `embed`: `threads` to include thread data
- `page`: Page number (default: 1)
- `size`: Page size (default: 25, max: 50)
- `customFieldsByIds`: Filter by custom field values

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
- `mailbox`: Filter customers from specific mailbox ID
- `firstName`: Filter by first name (exact match)
- `lastName`: Filter by last name (exact match)
- `email`: Filter by email address (exact match)
- `modifiedSince`: ISO8601 date for incremental updates
- `sortField`: `score|firstName|lastName|email|modifiedAt` (default: score)
- `sortOrder`: `asc|desc` (default: desc)
- `query`: Advanced search query with complex syntax
  - Name searches: `(firstName:"John")`
  - Email searches: `(email:"john@example.com")`
  - Compound searches: `(firstName:"John" AND lastName:"Appleseed")`
  - Organization: `(organization:"Acme Corp")`
- `page`: Page number (default: 1)
- `size`: Page size (default: 50, max: 50)

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

**Query Parameters**:
- `page`: Page number for pagination

**Response**: `200 OK`
```json
{
  "_embedded": {
    "teams": [
      {
        "id": 10,
        "name": "Support Team",
        "memberCount": 5,
        "initials": "ST",
        "mention": "support",
        "timezone": "America/New_York",
        "photoUrl": "https://example.com/team-photo.jpg",
        "createdAt": "2020-01-01T12:00:00Z",
        "updatedAt": "2020-01-02T12:00:00Z"
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
    "first": {"href": "/v2/teams?page=1"},
    "last": {"href": "/v2/teams?page=1"}
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
- `email`: Filter by exact email address
- `mailbox`: Filter by specific mailbox ID
- `page`: Page number for pagination
- `size`: Page size (default: 50)

**Response**: `200 OK`
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
    "totalElements": 25,
    "totalPages": 1,
    "number": 1
  }
}
```

##### Get User
**Endpoint**: `GET /v2/users/{id}`

**Response**: `200 OK`
```json
{
  "id": 123,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@company.com",
  "role": "admin",
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
```

##### Get Current User
**Endpoint**: `GET /v2/users/me`

**Response**: Same format as Get User, returns currently authenticated user's information.

#### 5. Mailboxes

##### List Mailboxes
**Endpoint**: `GET /v2/mailboxes`

**Response**: `200 OK`
```json
{
  "_embedded": {
    "mailboxes": [
      {
        "id": 123,
        "name": "Support",
        "slug": "support",
        "email": "support@company.com",
        "createdAt": "2020-01-01T12:00:00Z",
        "updatedAt": "2020-01-02T12:00:00Z"
      }
    ]
  }
}
```

##### Get Mailbox
**Endpoint**: `GET /v2/mailboxes/{id}`

**Query Parameters**:
- `embed`: Comma-separated values (`folders`, `fields`)

**Response**: `200 OK`
```json
{
  "id": 123,
  "name": "Support",
  "slug": "support",
  "email": "support@company.com",
  "createdAt": "2020-01-01T12:00:00Z",
  "updatedAt": "2020-01-02T12:00:00Z",
  "folders": [
    {
      "id": 456,
      "name": "Mine",
      "type": "assigned",
      "userId": 789
    }
  ]
}
```

##### List Mailbox Folders
**Endpoint**: `GET /v2/mailboxes/{id}/folders`

**Response**: `200 OK`
```json
{
  "_embedded": {
    "folders": [
      {
        "id": 456,
        "name": "Mine",
        "type": "assigned",
        "userId": 789,
        "updatedAt": "2020-01-01T12:00:00Z"
      }
    ]
  }
}
```

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

**Query Parameters**:
- `page`: Page number for pagination
- `size`: Page size (max 50)

**Response**: `200 OK`
```json
{
  "_embedded": {
    "tags": [
      {
        "id": 123456793,
        "slug": "urgent",
        "name": "Urgent",
        "color": "red"
      }
    ]
  },
  "page": {
    "size": 50,
    "totalElements": 25,
    "totalPages": 1,
    "number": 1
  }
}
```

##### Get Tag
**Endpoint**: `GET /v2/tags/{tagId}`

**Response**: `200 OK`
```json
{
  "id": 123456793,
  "slug": "urgent",
  "name": "Urgent",
  "color": "red",
  "_links": {
    "self": {"href": "/v2/tags/123456793"}
  }
}
```

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

**Query Parameters**:
- `mailboxId`: Filter workflows by specific mailbox ID
- `type`: Filter by workflow type (`manual|automatic`)
- `page`: Page number for pagination

**Response**: `200 OK`
```json
{
  "_embedded": {
    "workflows": [
      {
        "id": 12345,
        "mailboxId": 123,
        "type": "manual",
        "status": "active",
        "order": 1,
        "name": "Close and Tag Spam",
        "createdAt": "2020-01-01T12:00:00Z",
        "modifiedAt": "2020-01-02T12:00:00Z"
      }
    ]
  },
  "page": {
    "size": 25,
    "totalElements": 10,
    "totalPages": 1,
    "number": 1
  }
}
```

**Workflow Status Values**:
- `active`: Workflow is enabled and running
- `inactive`: Workflow is disabled
- `invalid`: Workflow configuration is invalid

**Note**: API workflows are always manual type. Automatic workflows are managed within the Help Scout application.

##### Update Workflow Status
**Endpoint**: `PATCH /v2/workflows/{id}`

**Request Body**:
```json
{
  "status": "active"
}
```

**Valid Status Values**: `active|inactive`

**Response**: `204 No Content`

##### Run Manual Workflow
**Endpoint**: `POST /v2/workflows/{id}/run`

**Request Body**:
```json
{
  "conversations": [12345, 67890, 54321]
}
```

**Field Details**:
- `conversations`: Array of conversation IDs to run the workflow on
- Maximum conversations per request: Limited by API constraints
- Large batches are automatically split into multiple requests

**Response**: `201 Created`

**Usage Notes**:
- Only works with manual workflows
- Conversations must be accessible to the authenticated user
- Invalid conversation IDs are skipped without error

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

**Conversation Events**:
- `convo.assigned`: Conversation assigned to user
- `convo.created`: New conversation created
- `convo.customer.reply.created`: Customer replied to conversation
- `convo.deleted`: Conversation deleted
- `convo.merged`: Conversation merged with another
- `convo.moved`: Conversation moved to different mailbox
- `convo.note.created`: Note added to conversation
- `convo.status`: Conversation status changed
- `convo.tags`: Conversation tags updated
- `convo.agent.reply.created`: Agent replied to conversation
- `convo.unassigned`: Conversation unassigned

**Customer Events**:
- `customer.created`: New customer created
- `customer.updated`: Customer information updated
- `customer.deleted`: Customer deleted

**Rating Events**:
- `satisfaction.ratings`: Satisfaction rating submitted

**Chat Events**:
- `beacon.chat.created`: New chat conversation started via Beacon

**Field Details**:
- `events`: Array of event types (required)
- `url`: Webhook callback URL (required, must be HTTPS)
- `secret`: Webhook signature secret (required, max 40 characters)
- `label`: Descriptive webhook name (optional)
- `payloadVersion`: Payload format version (optional, default: \"V2\")
- `notification`: Boolean flag for notification mode (optional)
- `mailboxIds`: Array of mailbox IDs to filter events (optional)

**Response**: `201 Created`

##### Get Webhook
**Endpoint**: `GET /v2/webhooks/{id}`

##### Update Webhook
**Endpoint**: `PATCH /v2/webhooks/{id}`

##### Delete Webhook
**Endpoint**: `DELETE /v2/webhooks/{id}`

#### 12. Saved Replies

##### Create Saved Reply
**Endpoint**: `POST /v2/mailboxes/{mailboxId}/saved-replies`

**Request Body**:
```json
{
  "name": "Sale: Now On",
  "text": "Hi, thanks for reaching out.<br /><br />We do indeed have a sale going on right now...",
  "chatText": "Hi, thanks for reaching out.\n\nWe do indeed have a sale going on right now..."
}
```

**Field Details**:
- `name` (String, Required): Name of the saved reply
- `text` (String, Optional): HTML-formatted text for email replies
- `chatText` (String, Optional): Plain text version for chat conversations

**Response**: `201 Created`

##### List Saved Replies
**Endpoint**: `GET /v2/mailboxes/{mailboxId}/saved-replies`

**Query Parameters**:
- `page`: Page number for pagination
- `size`: Page size (max 50)

**Response**: `200 OK`
```json
{
  "_embedded": {
    "saved-replies": [
      {
        "id": 123,
        "name": "Sale: Now On",
        "text": "Hi, thanks for reaching out.<br /><br />We do indeed have a sale...",
        "chatText": "Hi, thanks for reaching out.\n\nWe do indeed have a sale...",
        "createdAt": "2020-01-01T12:00:00Z",
        "updatedAt": "2020-01-02T12:00:00Z"
      }
    ]
  },
  "page": {
    "size": 25,
    "totalElements": 10,
    "totalPages": 1,
    "number": 1
  }
}
```

##### Get Saved Reply
**Endpoint**: `GET /v2/mailboxes/{mailboxId}/saved-replies/{id}`

##### Update Saved Reply
**Endpoint**: `PUT /v2/mailboxes/{mailboxId}/saved-replies/{id}`

##### Delete Saved Reply
**Endpoint**: `DELETE /v2/mailboxes/{mailboxId}/saved-replies/{id}`

#### 13. Customer Properties

##### Create Customer Property Definition
**Endpoint**: `POST /v2/customer-properties`

**Request Body**:
```json
{
  "type": "dropdown",
  "slug": "plan",
  "name": "Plan",
  "options": [
    {"id": "556cca5f-1afc-48ef-8323-b88b55808404", "label": "Standard"},
    {"id": "1313b25a-1150-49a4-8514-5b31f37e427f", "label": "Plus"},
    {"id": "f2cbc0ee-95ea-4ef2-82d3-e357dc650989", "label": "Company"}
  ]
}
```

**Field Details**:
- `type` (Required): `number|text|url|date|dropdown`
- `slug` (Required): Unique identifier (1-100 chars, alphanumeric, hyphens, underscores)
- `name` (Required): Display name for the property
- `options` (Optional): Required for dropdown type only (max 100 options)
  - `label` (Required): Option display text (max 255 chars)
  - `id` (Optional): UUID (auto-generated if not provided)

**Limitations**:
- Maximum 50 customer property definitions per company
- Reserved slugs: 'email', 'name', 'company', 'jobTitle'

**Response**: `201 Created`

##### List Customer Property Definitions
**Endpoint**: `GET /v2/customer-properties`

##### Get Customer Property Definition
**Endpoint**: `GET /v2/customer-properties/{id}`

##### Update Customer Property Definition
**Endpoint**: `PUT /v2/customer-properties/{id}`

##### Delete Customer Property Definition
**Endpoint**: `DELETE /v2/customer-properties/{id}`

#### 14. Satisfaction Ratings

##### Get Satisfaction Rating
**Endpoint**: `GET /v2/ratings/{ratingId}`

**Response**: `200 OK`
```json
{
  "id": 12345,
  "threadId": 67890,
  "conversationId": 54321,
  "rating": "great",
  "comments": "Very helpful support!",
  "createdAt": "2020-01-01T12:00:00Z",
  "user": {
    "id": 123,
    "firstName": "Agent",
    "lastName": "Smith",
    "email": "agent@company.com"
  },
  "customer": {
    "id": 456,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  },
  "_links": {
    "self": {"href": "/v2/ratings/12345"},
    "conversation": {"href": "/v2/conversations/54321"},
    "thread": {"href": "/v2/conversations/54321/threads/67890"}
  }
}
```

**Rating Types**:
- `great`: Positive rating
- `okay`: Neutral rating  
- `not_good`: Negative rating
- `unknown`: Rating not provided

##### List Satisfaction Ratings
**Endpoint**: `GET /v2/ratings`

**Query Parameters**:
- `conversationId`: Filter by conversation ID
- `userId`: Filter by user ID
- `customerId`: Filter by customer ID
- `rating`: Filter by rating type (`great|okay|not_good|unknown`)
- `start`: Start date (ISO8601)
- `end`: End date (ISO8601)
- `page`: Page number
- `size`: Page size (max 50)

#### 15. Reports

Help Scout provides comprehensive reporting capabilities across multiple categories:

##### Conversation Reports

**Overall Report**
- **Endpoint**: `GET /v2/reports/conversations`
- **Parameters**: `start`, `end`, `previousStart`, `previousEnd`, `mailboxes`, `tags`, `types`, `folders`

**Volume by Channel Report**
- **Endpoint**: `GET /v2/reports/conversations/volume-by-channel`
- **Required Parameters**: `start`, `end`
- **Optional Parameters**: `previousStart`, `previousEnd`, `mailboxes`, `tags`, `types`, `folders`
- **View Options**: `viewBy` (day ≤60 days, week ≤1 year, month ≥61 days)
- **Response**: Time-series data with channel breakdown (chat, email, phone counts)
- **Example**: `[{"date": "2018-10-01T12:00:00Z", "chat": 12, "email": 35, "phone": 6}]`

**Busiest Time of Day Report**
- **Endpoint**: `GET /v2/reports/conversations/busy-times`
- **Required Parameters**: `start`, `end`
- **Optional Parameters**: `previousStart`, `previousEnd`, `mailboxes`, `tags`, `types`, `folders`
- **Response**: Array of objects with day (1-7), hour (0-23), and conversation count
- **Time Zone**: Uses company's configured time zone
- **Example**: `[{"day": 1, "hour": 9, "count": 25}, {"day": 7, "hour": 22, "count": 12}]`

**New Conversations Report**
- **Endpoint**: `GET /v2/reports/conversations/new`
- **Required Parameters**: `start`, `end`
- **Optional Parameters**: `previousStart`, `previousEnd`, `mailboxes`, `tags`, `types`, `folders`
- **View Options**: `viewBy` (day ≤60 days, week ≤1 year, month ≥61 days)
- **Response**: Time-series data showing new conversation counts
- **Features**: Period comparison between current and previous intervals

**New Conversations Drilldown**
- **Endpoint**: `GET /v2/reports/conversations/new-drilldown`
- **Required Parameters**: `start`, `end`
- **Optional Parameters**: `mailboxes`, `tags`, `types`, `folders`, `page`, `rows` (max 50)
- **Response**: Detailed conversation list with pagination
- **Use Case**: Detailed breakdown of new conversations instead of just statistics

**Received Messages Report**
- **Endpoint**: `GET /v2/reports/conversations/received-messages`
- **Required Parameters**: `start`, `end`
- **Optional Parameters**: `previousStart`, `previousEnd`, `mailboxes`, `tags`, `types`, `folders`
- **View Options**: `viewBy` (day ≤60 days, week ≤1 year, month ≥61 days)
- **Response**: Time-series data showing customer message volumes (excludes agent replies)
- **Note**: Only counts messages from customers, not agent responses

**Conversations Drilldown**
- **Endpoint**: `GET /v2/reports/conversations/drilldown`
- **Required Parameters**: `start`, `end`
- **Optional Parameters**: `mailboxes`, `tags`, `types`, `folders`, `page`, `rows` (max 50)
- **Response**: Detailed conversation list with full metadata and pagination
- **Use Case**: Comprehensive conversation analysis with filtering

**Conversations Field Drilldown**
- **Endpoint**: `GET /v2/reports/conversations/fields-drilldown`
- **Required Parameters**: `start`, `end`, `field` (tagid/replyid/workflowid/customerid), `fieldid`
- **Optional Parameters**: `mailboxes`, `tags`, `types`, `folders`, `page`, `rows` (max 50)
- **Response**: Conversation data filtered by specific field values
- **Use Case**: Analysis of conversations by specific tags, saved replies, workflows, or customers

##### User Reports

**User Overall Report**
- **Endpoint**: `GET /v2/reports/user`
- **Required Parameters**: `user` (User ID), `start`, `end`
- **Optional Parameters**: `previousStart`, `previousEnd`, `mailboxes`, `tags`, `types`, `folders`, `officeHours`
- **Metrics**: Conversations created/resolved, replies sent, response/resolution times, happiness score, handle time, busiest day
- **Features**: Current vs previous period comparison with percentage changes

**User Conversation History**
- **Endpoint**: `GET /v2/reports/user/conversation-history`
- **Required Parameters**: `user` (User ID), `start`, `end`
- **Optional Parameters**: `status`, `mailboxes`, `tags`, `types`, `folders`
- **Sorting**: `sortField` (number, repliesSent, responseTime, resolveTime), `sortOrder` (ASC/DESC)
- **Response**: Detailed conversation list with performance metrics, pagination support
- **Use Case**: Drill-down analysis of specific user's conversation activity

**User Customers Helped**
- **Endpoint**: `GET /v2/reports/user/customers-helped`
- **Required Parameters**: `user` (User ID), `start`, `end`
- **Optional Parameters**: `previousStart`, `previousEnd`, `mailboxes`, `tags`, `types`, `folders`
- **View Options**: `viewBy` (day ≤60 days, week ≤1 year, month ≥61 days)
- **Response**: Time-series data showing customers helped per period
- **Example**: `[{"date": "2016-08-01T12:00:00Z", "customers": 29}]`

**User Happiness Report**
- **Endpoint**: `GET /v2/reports/user/happiness`
- **Required Parameters**: `user` (User ID), `start`, `end`
- **Optional Parameters**: `previousStart`, `previousEnd`, `mailboxes`, `tags`, `types`, `folders`
- **Metrics**: Rating percentages (Great/Okay/Not Good), customer counts, happiness score
- **Calculation**: Happiness Score = Great% - Not Good%
- **Features**: Period comparison with delta calculations

**User Happiness Drilldown**
- **Endpoint**: `GET /v2/reports/user/ratings`
- **Required Parameters**: `user` (User ID), `start`, `end`
- **Optional Parameters**: `mailboxes`, `tags`, `types`, `folders`, `rating` (great/ok/not-good/all)
- **Sorting**: `sortField` (number, modifiedAt, rating), `sortOrder` (ASC/DESC)
- **Response**: Individual rating entries with conversation details, customer/user metadata
- **Use Case**: Detailed analysis of specific satisfaction ratings

**User Replies Report**
- **Endpoint**: `GET /v2/reports/user/replies`
- **Required Parameters**: `user` (User ID), `start`, `end`
- **Optional Parameters**: `previousStart`, `previousEnd`, `mailboxes`, `tags`, `types`, `folders`
- **View Options**: `viewBy` with time range restrictions (day/week/month)
- **Response**: Time-series data showing replies sent per period
- **Example**: `[{"date": "2016-07-01T12:00:00Z", "replies": 15}]`

**User Resolutions Report**
- **Endpoint**: `GET /v2/reports/user/resolutions`
- **Required Parameters**: `user` (User ID), `start`, `end`
- **Optional Parameters**: `previousStart`, `previousEnd`, `mailboxes`, `tags`, `types`, `folders`
- **View Options**: `viewBy` (day ≤60 days, week ≤1 year, month ≥61 days)
- **Response**: Time-series data showing conversations resolved per period
- **Example**: `[{"date": "2017-01-01T12:00:00Z", "resolved": 18}]`

##### Productivity Reports

**Productivity Overall Report**
- **Endpoint**: `GET /v2/reports/productivity`
- **Required Parameters**: `start`, `end`
- **Optional Parameters**: `previousStart`, `previousEnd`, `mailboxes`, `tags`, `types`, `folders`, `officeHours`
- **Metrics**: Total conversations, resolution time, replies to resolve, response time, first response time, resolved conversations, closed conversations, replies sent, handle time
- **Features**: Period comparison, percentage changes, detailed time range distributions

**First Response Time Report**
- **Endpoint**: `GET /v2/reports/productivity/first-response-time`
- **Required Parameters**: `start`, `end`
- **Optional Parameters**: `previousStart`, `previousEnd`, `mailboxes`, `tags`, `types`, `folders`, `officeHours`
- **View Options**: `viewBy` (day ≤60 days, week ≤1 year, month ≥61 days)
- **Response**: Time-series data showing first response time durations
- **Example**: `[{"date": "2016-07-01T12:00:00Z", "time": "02:15:30"}]`

**Replies Sent Report**
- **Endpoint**: `GET /v2/reports/productivity/replies-sent`
- **Required Parameters**: `start`, `end`
- **Optional Parameters**: `previousStart`, `previousEnd`, `mailboxes`, `tags`, `types`, `folders`, `officeHours`
- **View Options**: `viewBy` (day ≤60 days, week ≤1 year, month ≥61 days)
- **Response**: Time-series data showing reply volumes
- **Example**: `[{"date": "2014-01-01T12:00:00Z", "replies": 636}]`

**Resolution Time Report**
- **Endpoint**: `GET /v2/reports/productivity/resolution-time`
- **Required Parameters**: `start`, `end`
- **Optional Parameters**: `previousStart`, `previousEnd`, `mailboxes`, `tags`, `types`, `folders`, `officeHours`
- **View Options**: `viewBy` (day ≤60 days, week ≤1 year, month ≥61 days)
- **Response**: Time-series data showing average resolution times
- **Use Case**: Track resolution performance trends over time

**Resolved Conversations Report**
- **Endpoint**: `GET /v2/reports/productivity/resolved`
- **Required Parameters**: `start`, `end`
- **Optional Parameters**: `previousStart`, `previousEnd`, `mailboxes`, `tags`, `types`, `folders`, `officeHours`
- **View Options**: `viewBy` (day ≤60 days, week ≤1 year, month ≥61 days)
- **Response**: Time-series data showing resolved conversation counts
- **Example**: `[{"date": "2014-01-01T12:00:00Z", "resolved": 14}]`

**Response Time Report**
- **Endpoint**: `GET /v2/reports/productivity/response-time`
- **Required Parameters**: `start`, `end`
- **Optional Parameters**: `previousStart`, `previousEnd`, `mailboxes`, `tags`, `types`, `folders`, `officeHours`
- **View Options**: `viewBy` (day ≤60 days, week ≤1 year, month ≥61 days)
- **Response**: Time-series data showing response time durations
- **Note**: Requires office hours to be enabled when using `officeHours` parameter

##### Happiness Reports

**Happiness Overall Report**
- **Endpoint**: `GET /v2/reports/happiness`
- **Required Parameters**: `start`, `end`
- **Optional Parameters**: `previousStart`, `previousEnd`, `mailboxes`, `tags`, `types`, `folders`
- **Metrics**: Rating percentages (Great/Okay/Not Good), happiness score, customer counts
- **Calculation**: Happiness Score = Great% - Not Good%
- **Features**: Period comparison with delta calculations

**Happiness Ratings Drilldown**
- **Endpoint**: `GET /v2/reports/happiness/ratings`
- **Required Parameters**: `start`, `end`
- **Optional Parameters**: `previousStart`, `previousEnd`, `mailboxes`, `tags`, `types`, `folders`, `rating` (great/ok/not-good/all)
- **Sorting**: `sortField` (number, modifiedAt, rating), `sortOrder` (ASC/DESC)
- **Pagination**: `page` parameter supported
- **Response**: Individual rating entries with conversation details, customer/user metadata
- **Use Case**: Detailed analysis of specific satisfaction ratings

##### Company Reports

**Company Overall Report**
- **Endpoint**: `GET /v2/reports/company`
- **Required Parameters**: `start`, `end`
- **Optional Parameters**: `previousStart`, `previousEnd`, `mailboxes`, `tags`, `types`, `folders`
- **Metrics**: Customers helped, conversations closed, total replies, total active users, replies per day, resolved conversations per day
- **Features**: User-specific performance breakdown, happiness score calculation, percentage changes

**Company Customers Helped**
- **Endpoint**: `GET /v2/reports/company/customers-helped`

##### Docs Reports

**Docs Overall Report**
- **Endpoint**: `GET /v2/reports/docs`

**Parameters for All Reports**:
- `start`: Start date (ISO8601) - Required
- `end`: End date (ISO8601) - Required
- `previousStart`: Previous period start (optional, for comparison)
- `previousEnd`: Previous period end (optional, for comparison)
- `mailboxes`: Comma-separated mailbox IDs (optional filter)
- `tags`: Comma-separated tag IDs (optional filter)
- `types`: Conversation types filter (`email|chat|phone`, comma-separated)
- `folders`: Folder IDs filter (comma-separated)
- `officeHours`: Boolean to consider office hours (optional, defaults to false)

**Report Availability**:
- All reporting endpoints require **Plus or Pro** Help Scout plans
- OAuth authentication required
- Rate limiting applies to all report requests

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

#### PHP (Most Comprehensive)
- **helpscout/api** (Official PHP SDK)
  - GitHub: https://github.com/helpscout/helpscout-api-php
  - Version: 3.2.0+
  - **Supported Endpoints**:
    - ✅ Conversations (full CRUD + advanced operations)
    - ✅ Customers (full CRUD)
    - ✅ Users (read operations)
    - ✅ Teams (read operations)
    - ✅ Mailboxes (read operations)
    - ✅ Tags (read operations)
    - ✅ Threads (full CRUD)
    - ✅ Attachments (full CRUD)
    - ✅ Webhooks (full CRUD)
    - ✅ Workflows (list, run, update status)
    - ✅ Chats (read operations)
    - ✅ Customer Entry Management
    - ✅ Comprehensive Reports (all categories)
  - **Missing Endpoints**:
    - ❌ Saved Replies management
    - ❌ Customer Properties definitions
    - ❌ Individual Ratings endpoints
  - **Features**: OAuth 2.0, HAL+JSON, Pagination, Error handling

#### Node.js
- **helpscout-mailbox-api** by turakvlad
  - GitHub: https://github.com/turakvlad/helpscout-mailbox-api
  - Support: Mailbox API 2.0 (basic coverage)

- **HelpScout SDK** by shaun3141
  - GitHub: https://github.com/shaun3141/HelpScout
  - Support: Mailbox API 2.0 (partial coverage)

#### .NET
- **HelpScoutSharp** by Wish-Org/better-reports
  - GitHub: https://github.com/better-reports/HelpScoutSharp
  - Support: Mailbox API 2.0 (focused on reporting)

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