import {
  LOOKUP_ATTRIBUTE_TYPES,
  lookupOptionLabel,
  lookupOptionsFromAttributes,
} from '@/lib/variables';

describe('seller lookup options', () => {
  it('maps the four seller fields to catalog types', () => {
    expect(LOOKUP_ATTRIBUTE_TYPES).toEqual({
      category: 'store_category',
      currency: 'currency',
      country: 'country',
      timezone: 'timezone',
    });
  });

  it('stores the admin payload, falling back to the key slug', () => {
    expect(
      lookupOptionsFromAttributes([
        { key: 'inr', label: 'Indian Rupee', value: 'INR' },
        { key: 'fashion', label: 'Fashion', value: null },
      ]),
    ).toEqual([
      { value: 'INR', label: 'Indian Rupee', code: 'INR' },
      { value: 'fashion', label: 'Fashion', code: undefined },
    ]);
  });

  it('shows the code suffix only when a payload exists', () => {
    expect(lookupOptionLabel({ value: 'INR', label: 'Indian Rupee', code: 'INR' })).toBe(
      'Indian Rupee (INR)',
    );
    expect(lookupOptionLabel({ value: 'fashion', label: 'Fashion' })).toBe('Fashion');
  });
});
