import {
  SearchConversationsInputSchema,
} from '../schema/types.js';

describe('Schema Validation', () => {
  describe('SearchConversationsInputSchema', () => {
    it('should accept query without status', () => {
      const input = {
        query: '(body:"test")'
      };

      const parsed = SearchConversationsInputSchema.parse(input);

      expect(parsed.query).toBe('(body:"test")');
      expect(parsed.status).toBeUndefined();
      expect(parsed.limit).toBe(50);
    });

    it('should validate status enum', () => {
      const validStatuses = ['active', 'pending', 'closed', 'spam'];

      validStatuses.forEach(status => {
        const parsed = SearchConversationsInputSchema.parse({
          status
        });
        expect(parsed.status).toBe(status);
      });

      expect(() => {
        SearchConversationsInputSchema.parse({
          status: 'invalid'
        });
      }).toThrow();
    });

    it('should accept searchTerms for keyword mode', () => {
      const parsed = SearchConversationsInputSchema.parse({
        searchTerms: ['urgent', 'billing']
      });

      expect(parsed.searchTerms).toEqual(['urgent', 'billing']);
      expect(parsed.searchIn).toEqual(['both']);
      expect(parsed.timeframeDays).toBe(60);
    });

    it('should accept structured search params', () => {
      const parsed = SearchConversationsInputSchema.parse({
        contentTerms: ['billing'],
        subjectTerms: ['help'],
        customerEmail: 'test@example.com',
        emailDomain: 'company.com',
        tags: ['vip'],
      });

      expect(parsed.contentTerms).toEqual(['billing']);
      expect(parsed.subjectTerms).toEqual(['help']);
      expect(parsed.customerEmail).toBe('test@example.com');
      expect(parsed.emailDomain).toBe('company.com');
      expect(parsed.tags).toEqual(['vip']);
    });

    it('should validate number ranges', () => {
      expect(() => {
        SearchConversationsInputSchema.parse({
          timeframeDays: 0
        });
      }).toThrow();

      expect(() => {
        SearchConversationsInputSchema.parse({
          timeframeDays: 400
        });
      }).toThrow();

      expect(() => {
        SearchConversationsInputSchema.parse({
          limit: 0
        });
      }).toThrow();

      // Max limit is 200
      const parsed = SearchConversationsInputSchema.parse({ limit: 200 });
      expect(parsed.limit).toBe(200);

      // Values above 200 should be rejected
      expect(() => {
        SearchConversationsInputSchema.parse({ limit: 201 });
      }).toThrow();
    });

    it('should accept date parameters', () => {
      const parsed = SearchConversationsInputSchema.parse({
        createdAfter: '2024-01-01T00:00:00Z',
        createdBefore: '2024-12-31T23:59:59Z'
      });

      expect(parsed.createdAfter).toBe('2024-01-01T00:00:00Z');
      expect(parsed.createdBefore).toBe('2024-12-31T23:59:59Z');
    });

    it('should validate searchIn enum values', () => {
      expect(() => {
        SearchConversationsInputSchema.parse({
          searchTerms: ['test'],
          searchIn: ['invalid']
        });
      }).toThrow();
    });
  });
});
