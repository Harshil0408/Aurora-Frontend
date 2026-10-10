import {
  attributeStatusSchema,
  createAttributeSchema,
  editAttributeSchema,
} from '@/lib/validations';
import {
  GENERAL_ATTRIBUTE_TYPES,
  prettyAttributeType,
  scopeOfAttributeType,
} from '@/lib/variables';
import { slugifyAttributeKey } from '@/types/attributes';
import { isAlreadyStatusError, isKeyConflict } from '@/services/attributesApi';

describe('attributes (lookup-catalog gates)', () => {
  describe('createAttributeSchema', () => {
    it('accepts a valid payload with defaults', () => {
      const parsed = createAttributeSchema.safeParse({
        type: 'payment_type',
        key: 'upi',
        label: 'UPI',
        sortOrder: 0,
      });
      expect(parsed.success).toBe(true);
    });

    it('rejects bad type and key shapes', () => {
      expect(
        createAttributeSchema.safeParse({ type: 'Payment Type', key: 'upi', label: 'UPI', sortOrder: 0 }).success,
      ).toBe(false);
      expect(
        createAttributeSchema.safeParse({ type: 'x', key: 'upi', label: 'UPI', sortOrder: 0 }).success,
      ).toBe(false);
      expect(
        createAttributeSchema.safeParse({ type: 'payment_type', key: 'UPI', label: 'UPI', sortOrder: 0 }).success,
      ).toBe(false);
      expect(
        createAttributeSchema.safeParse({ type: 'payment_type', key: 'x', label: 'UPI', sortOrder: 0 }).success,
      ).toBe(false);
    });

    it('rejects empty labels and out-of-range sort order', () => {
      expect(
        createAttributeSchema.safeParse({ type: 'country', key: 'in', label: '', sortOrder: 0 }).success,
      ).toBe(false);
      expect(
        createAttributeSchema.safeParse({ type: 'country', key: 'in', label: 'India', sortOrder: -1 }).success,
      ).toBe(false);
      expect(
        createAttributeSchema.safeParse({ type: 'country', key: 'in', label: 'India', sortOrder: 1_000_001 }).success,
      ).toBe(false);
    });
  });

  describe('editAttributeSchema', () => {
    it('requires a label and a valid sort order', () => {
      expect(
        editAttributeSchema.safeParse({ label: 'UPI', value: '', description: '', sortOrder: 3 }).success,
      ).toBe(true);
      expect(
        editAttributeSchema.safeParse({ label: '', value: '', description: '', sortOrder: 3 }).success,
      ).toBe(false);
    });
  });

  describe('attributeStatusSchema', () => {
    it('requires a status and a reason of min 3 chars', () => {
      expect(
        attributeStatusSchema.safeParse({ status: 'INACTIVE', reason: 'sunset' }).success,
      ).toBe(true);
      expect(attributeStatusSchema.safeParse({ status: 'INACTIVE', reason: 'no' }).success).toBe(false);
      expect(attributeStatusSchema.safeParse({ status: 'ARCHIVED', reason: 'sunset' }).success).toBe(false);
    });
  });

  describe('slugifyAttributeKey', () => {
    it('derives hyphen slugs from display names', () => {
      expect(slugifyAttributeKey('Fashion & Apparel')).toBe('fashion-apparel');
      expect(slugifyAttributeKey('  UPI  ')).toBe('upi');
      expect(slugifyAttributeKey('Cash on Delivery!')).toBe('cash-on-delivery');
    });
  });

  describe('scopeOfAttributeType / prettyAttributeType', () => {
    it('pins the curated general set before prefix rules', () => {
      for (const g of GENERAL_ATTRIBUTE_TYPES) {
        expect(scopeOfAttributeType(g.type)).toBe('general');
      }
      expect(scopeOfAttributeType('seller_badge')).toBe('seller');
      expect(scopeOfAttributeType('admin_region')).toBe('admin');
      expect(scopeOfAttributeType('user_title')).toBe('user');
      expect(scopeOfAttributeType('bespoke_thing')).toBe('admin');
    });

    it('title-cases snake types for display', () => {
      expect(prettyAttributeType('payment_type')).toBe('Payment Type');
      expect(prettyAttributeType('store_category')).toBe('Store Category');
    });
  });

  describe('error helpers', () => {
    it('detects already-status and key-conflict failures', () => {
      expect(isAlreadyStatusError('Attribute is already ACTIVE')).toBe(true);
      expect(isAlreadyStatusError('Attribute is already INACTIVE')).toBe(true);
      expect(isAlreadyStatusError('Something else broke')).toBe(false);
      expect(isKeyConflict(409, 'Conflict')).toBe(true);
      expect(isKeyConflict(400, 'Key already in use for this type')).toBe(true);
      expect(isKeyConflict(400, 'Bad request')).toBe(false);
    });
  });
});
