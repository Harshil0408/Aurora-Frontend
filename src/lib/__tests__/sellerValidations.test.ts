import {
  createStoreSchema,
  inviteMemberSchema,
  sellerLoginSchema,
  sellerRegisterSchema,
  sellerRoleSchema,
} from '@/lib/validations';

describe('seller validations', () => {
  it('requires a 12+ char password at register', () => {
    expect(sellerRegisterSchema.safeParse({ email: 'a@b.co', password: 'short' }).success).toBe(false);
    expect(
      sellerRegisterSchema.safeParse({ email: 'owner@shop.com', password: 'long-enough-pass' }).success,
    ).toBe(true);
  });

  it('validates seller login fields', () => {
    expect(sellerLoginSchema.safeParse({ email: 'bad', password: 'x' }).success).toBe(false);
    expect(sellerLoginSchema.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(true);
  });

  it('requires a store name and a clean slug', () => {
    expect(createStoreSchema.safeParse({ name: 'A' }).success).toBe(false);
    expect(createStoreSchema.safeParse({ name: 'Aurora', slug: 'Bad Slug!' }).success).toBe(false);
    expect(createStoreSchema.safeParse({ name: 'Aurora', slug: 'aurora-1' }).success).toBe(true);
  });

  it('requires email + role for invitations', () => {
    expect(inviteMemberSchema.safeParse({ email: 'a@b.co', roleKey: '' }).success).toBe(false);
    expect(inviteMemberSchema.safeParse({ email: 'a@b.co', roleKey: 'staff' }).success).toBe(true);
  });

  it('requires slug-style role keys', () => {
    expect(sellerRoleSchema.safeParse({ key: 'Bad Key', name: 'Bad' }).success).toBe(false);
    expect(sellerRoleSchema.safeParse({ key: 'inventory-manager', name: 'Inventory' }).success).toBe(true);
  });
});
