/**
 * MIME type detection from magic bytes and file extensions.
 */
export declare const IMAGE_MIME_TYPES: string[];
/**
 * Detect MIME type from buffer magic bytes, then file extension, then fallback.
 */
export declare function detectMimeType(buffer: Buffer, ext: string): string;
/**
 * Get file extension for a MIME type, or empty string if unknown.
 */
export declare function extForMime(mimeType: string): string;
export declare function isImageMime(mimeType: string): boolean;
//# sourceMappingURL=mime.d.ts.map