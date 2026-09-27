import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  verifySchema,
} from '@/lib/validations';

describe('validations (secure input gates)', () => {
  describe('loginSchema', () => {
    it('accepts a valid email + password', () => {
      expect(
        loginSchema.safeParse({ email: 'admin@acme.co', password: 's3cret!' })
          .success,
      ).toBe(true);
    });

    it('rejects invalid email, empty password, and oversized input', () => {
      expect(
        loginSchema.safeParse({ email: 'not-an-email', password: 'x' }).success,
      ).toBe(false);
      expect(
        loginSchema.safeParse({ email: 'a@b.co', password: '' }).success,
      ).toBe(false);
      // DoS / storage guard: 255 email cap, 128 password cap
      expect(
        loginSchema.safeParse({
          email: `${'a'.repeat(251)}@b.co`,
          password: 'x',
        }).success,
      ).toBe(false);
      expect(
        loginSchema.safeParse({
          email: 'a@b.co',
          password: 'x'.repeat(129),
        }).success,
      ).toBe(false);
    });

    it('surfaces field-level messages for accessible UX', () => {
      const parsed = loginSchema.safeParse({ email: 'bad', password: '' });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        const flat = parsed.error.flatten().fieldErrors;
        expect(flat.email?.[0]).toMatch(/valid email/i);
        expect(flat.password?.[0]).toBeDefined();
      }
    });
  });

  describe('verifySchema', () => {
    it('requires a code and caps length (OTP brute-force surface)', () => {
      expect(verifySchema.safeParse({ code: '' }).success).toBe(false);
      expect(verifySchema.safeParse({ code: '123456' }).success).toBe(true);
      // recovery codes are longer than 6 digits — allow up to 64
      expect(verifySchema.safeParse({ code: 'x'.repeat(33) }).success).toBe(true);
      expect(
        verifySchema.safeParse({ code: 'x'.repeat(65) }).success,
      ).toBe(false);
    });
  });

  describe('forgotPasswordSchema', () => {
    it('only allows well-formed emails', () => {
      expect(
        forgotPasswordSchema.safeParse({ email: 'user@example.com' }).success,
      ).toBe(true);
      expect(forgotPasswordSchema.safeParse({ email: 'x' }).success).toBe(
        false,
      );
    });
  });

  describe('resetPasswordSchema', () => {
    it('enforces 12+ chars and matching confirmation', () => {
      const good = {
        newPassword: 'long-enough-pass-1',
        confirmPassword: 'long-enough-pass-1',
      };
      expect(resetPasswordSchema.safeParse(good).success).toBe(true);
      expect(
        resetPasswordSchema.safeParse({
          newPassword: 'short1',
          confirmPassword: 'short1',
        }).success,
      ).toBe(false);
      const mismatch = resetPasswordSchema.safeParse({
        newPassword: 'long-enough-pass-1',
        confirmPassword: 'different-pass-2',
      });
      expect(mismatch.success).toBe(false);
      if (!mismatch.success) {
        expect(mismatch.error.flatten().fieldErrors.confirmPassword?.[0]).toMatch(
          /do not match/i,
        );
      }
    });
  });
});
