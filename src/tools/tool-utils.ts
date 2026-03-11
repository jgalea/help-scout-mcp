import { Tool } from '@modelcontextprotocol/sdk/types.js';

const GENERIC_PROPERTY_NAMES = new Set([
  'articleId',
  'attachmentId',
  'bcc',
  'categoryId',
  'cc',
  'collectionId',
  'conversationId',
  'createdAfter',
  'createdBefore',
  'cursor',
  'description',
  'draft',
  'email',
  'embed',
  'end',
  'filename',
  'folders',
  'id',
  'inboxId',
  'limit',
  'mailboxes',
  'mailboxId',
  'name',
  'order',
  'page',
  'pageSize',
  'previousEnd',
  'previousStart',
  'query',
  'rating',
  'siteId',
  'sites',
  'sort',
  'sortField',
  'sortOrder',
  'start',
  'status',
  'tag',
  'tags',
  'text',
  'type',
  'types',
  'user',
  'viewBy',
  'visibility',
]);

function compactDescription(description: string): string {
  return description
    .replace(/\s*Supports natural language queries like[^.]*\.?/gi, '')
    .replace(/\s*Works with all Help Scout plans[^.]*\.?/gi, '')
    .replace(/\s*Requires Plus or Pro plan(?: with Docs enabled)?\.?/gi, '')
    .replace(/\s*Deprecated:[^.]*\.?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactSchemaNode(value: unknown, propertyName?: string): unknown {
  if (Array.isArray(value)) {
    return value.map(item => compactSchemaNode(item));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const schema = { ...(value as Record<string, unknown>) };

  if (typeof schema.description === 'string') {
    const nextDescription = compactDescription(schema.description);
    if (propertyName && GENERIC_PROPERTY_NAMES.has(propertyName)) {
      delete schema.description;
    } else if (nextDescription) {
      schema.description = nextDescription;
    } else {
      delete schema.description;
    }
  }

  if (schema.properties && typeof schema.properties === 'object' && !Array.isArray(schema.properties)) {
    schema.properties = Object.fromEntries(
      Object.entries(schema.properties as Record<string, unknown>).map(([key, child]) => [
        key,
        compactSchemaNode(child, key),
      ])
    );
  }

  if ('items' in schema) {
    schema.items = compactSchemaNode(schema.items);
  }

  if (Array.isArray(schema.oneOf)) {
    schema.oneOf = schema.oneOf.map(item => compactSchemaNode(item));
  }

  if (Array.isArray(schema.anyOf)) {
    schema.anyOf = schema.anyOf.map(item => compactSchemaNode(item));
  }

  if (Array.isArray(schema.allOf)) {
    schema.allOf = schema.allOf.map(item => compactSchemaNode(item));
  }

  return schema;
}

export function compactTool(tool: Tool, description?: string): Tool {
  return {
    ...tool,
    description: description ?? compactDescription(tool.description || ''),
    inputSchema: compactSchemaNode(tool.inputSchema) as Tool['inputSchema'],
  };
}
