import { detectMimeType, extForMime, isImageMime } from '../utils/mime.js';

describe('mime utils', () => {
  describe('detectMimeType', () => {
    it('detects PNG from magic bytes', () => {
      const buf = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0]);
      expect(detectMimeType(buf, '')).toBe('image/png');
    });

    it('detects JPEG from magic bytes', () => {
      const buf = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0, 0, 0, 0, 0, 0, 0, 0]);
      expect(detectMimeType(buf, '')).toBe('image/jpeg');
    });

    it('detects GIF from magic bytes', () => {
      const buf = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0, 0, 0, 0, 0]);
      expect(detectMimeType(buf, '')).toBe('image/gif');
    });

    it('detects PDF from magic bytes', () => {
      const buf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0, 0, 0, 0]);
      expect(detectMimeType(buf, '')).toBe('application/pdf');
    });

    it('detects ZIP from magic bytes', () => {
      const buf = Buffer.from([0x50, 0x4B, 0x03, 0x04, 0, 0, 0, 0, 0, 0, 0, 0]);
      expect(detectMimeType(buf, '')).toBe('application/zip');
    });

    it('detects WebP from magic bytes', () => {
      const buf = Buffer.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
      expect(detectMimeType(buf, '')).toBe('image/webp');
    });

    it('falls back to extension when magic bytes unknown', () => {
      const buf = Buffer.alloc(12);
      expect(detectMimeType(buf, '.csv')).toBe('text/csv');
      expect(detectMimeType(buf, '.json')).toBe('application/json');
    });

    it('returns octet-stream when nothing matches', () => {
      const buf = Buffer.alloc(12);
      expect(detectMimeType(buf, '')).toBe('application/octet-stream');
      expect(detectMimeType(buf, '.xyz')).toBe('application/octet-stream');
    });

    it('magic bytes take priority over extension', () => {
      // PNG magic bytes but .jpg extension — magic wins
      const buf = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0]);
      expect(detectMimeType(buf, '.jpg')).toBe('image/png');
    });
  });

  describe('extForMime', () => {
    it('returns extension for known types', () => {
      expect(extForMime('image/png')).toBe('.png');
      expect(extForMime('application/pdf')).toBe('.pdf');
      expect(extForMime('text/csv')).toBe('.csv');
    });

    it('returns empty string for unknown types', () => {
      expect(extForMime('application/octet-stream')).toBe('');
      expect(extForMime('video/mp4')).toBe('');
    });
  });

  describe('isImageMime', () => {
    it('returns true for image types', () => {
      expect(isImageMime('image/png')).toBe(true);
      expect(isImageMime('image/jpeg')).toBe(true);
      expect(isImageMime('image/gif')).toBe(true);
      expect(isImageMime('image/webp')).toBe(true);
    });

    it('returns false for non-image types', () => {
      expect(isImageMime('application/pdf')).toBe(false);
      expect(isImageMime('text/plain')).toBe(false);
      expect(isImageMime('application/octet-stream')).toBe(false);
    });
  });
});
