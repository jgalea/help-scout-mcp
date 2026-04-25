import sanitizeHtml from 'sanitize-html';

/**
 * Tags allowed in customer-facing replies and internal notes.
 * Deliberately excludes <script>, <style>, <iframe>, <object>, <embed>,
 * <form>, and any tag that can run JS or load remote content with side
 * effects. <img> is allowed because Help Scout staff routinely embed
 * inline images.
 */
const REPLY_ALLOWED_TAGS = [
  'p', 'br', 'div', 'span', 'strong', 'em', 'b', 'i', 'u',
  'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'hr', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'img',
];

const REPLY_ALLOWED_ATTR: Record<string, string[]> = {
  a: ['href', 'title', 'target', 'rel'],
  img: ['src', 'alt', 'width', 'height'],
  '*': ['class'],
};

/**
 * Sanitize HTML destined for a Help Scout reply or internal note.
 *
 * Strips <script>, event handlers (onerror, onclick, ...), `javascript:`
 * URLs, and any tag not in the allowlist. The existing
 * formatReplyHtml() runs *after* this and only handles whitespace /
 * tag-shape — it is not a security boundary on its own.
 */
export function sanitizeReplyHtml(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: REPLY_ALLOWED_TAGS,
    allowedAttributes: REPLY_ALLOWED_ATTR,
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https', 'data', 'cid'] },
    disallowedTagsMode: 'discard',
    allowProtocolRelative: false,
  });
}

/**
 * Sanitize HTML destined for a Help Scout Docs article.
 *
 * Allows a slightly richer tag set (figures, sections, details, plus
 * iframes from a hardcoded video allowlist) since Docs articles are
 * authored content. Still blocks <script>, event handlers, and
 * arbitrary iframes.
 */
export function sanitizeDocsHtml(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [
      ...REPLY_ALLOWED_TAGS,
      'figure', 'figcaption', 'section', 'article',
      'details', 'summary', 'iframe',
    ],
    allowedAttributes: {
      ...REPLY_ALLOWED_ATTR,
      iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen'],
    },
    allowedIframeHostnames: ['www.youtube.com', 'player.vimeo.com', 'www.loom.com'],
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https', 'data', 'cid'] },
    disallowedTagsMode: 'discard',
    allowProtocolRelative: false,
  });
}
