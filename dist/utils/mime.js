/**
 * MIME type detection from magic bytes and file extensions.
 */
const MAGIC_SIGNATURES = [
    { mime: 'image/png', check: (b) => b.length >= 4 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47 },
    { mime: 'image/jpeg', check: (b) => b.length >= 3 && b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF },
    { mime: 'image/gif', check: (b) => b.length >= 3 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 },
    {
        mime: 'image/webp',
        check: (b) => b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
            b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
    },
    { mime: 'application/pdf', check: (b) => b.length >= 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 },
    { mime: 'application/zip', check: (b) => b.length >= 4 && b[0] === 0x50 && b[1] === 0x4B && b[2] === 0x03 && b[3] === 0x04 },
];
const EXT_TO_MIME = {
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.gif': 'image/gif', '.webp': 'image/webp', '.pdf': 'application/pdf',
    '.zip': 'application/zip', '.csv': 'text/csv', '.json': 'application/json',
    '.xml': 'application/xml', '.txt': 'text/plain', '.log': 'text/plain',
    '.html': 'text/html', '.htm': 'text/html',
};
const MIME_TO_EXT = {
    'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp',
    'application/pdf': '.pdf', 'application/zip': '.zip',
    'text/csv': '.csv', 'application/json': '.json',
    'application/xml': '.xml', 'text/plain': '.txt', 'text/html': '.html',
};
export const IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
/**
 * Detect MIME type from buffer magic bytes, then file extension, then fallback.
 */
export function detectMimeType(buffer, ext) {
    for (const sig of MAGIC_SIGNATURES) {
        if (sig.check(buffer))
            return sig.mime;
    }
    return EXT_TO_MIME[ext.toLowerCase()] || 'application/octet-stream';
}
/**
 * Get file extension for a MIME type, or empty string if unknown.
 */
export function extForMime(mimeType) {
    return MIME_TO_EXT[mimeType] || '';
}
export function isImageMime(mimeType) {
    return IMAGE_MIME_TYPES.includes(mimeType);
}
//# sourceMappingURL=mime.js.map