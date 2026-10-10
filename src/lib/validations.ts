import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email").max(255),
  password: z.string().min(1, "Password is required").max(128),
});
export type LoginFormData = z.infer<typeof loginSchema>;

/** Second-factor code: 6-digit TOTP / emailed OTP, or a longer recovery code. */
export const verifySchema = z.object({
  code: z
    .string()
    .transform((v) => v.trim().replace(/\s/g, ""))
    .pipe(
      z
        .string()
        .min(6, "Enter the 6-digit code")
        .max(64, "That code looks too long"),
    ),
});
export type VerifyFormData = z.infer<typeof verifySchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email").max(255),
});
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(12, "Use at least 12 characters").max(128),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password").max(128),
    newPassword: z.string().min(12, "Use at least 12 characters").max(128),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    message: "New password must differ from the current one",
    path: ["newPassword"],
  });
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

/** Disable TOTP: current password + authenticator or recovery code. */
export const disableTotpSchema = z.object({
  password: z.string().min(1, "Enter your current password").max(128),
  code: z
    .string()
    .transform((v) => v.trim().replace(/\s/g, ""))
    .pipe(z.string().min(6, "Enter the code from your app").max(64)),
});
export type DisableTotpFormData = z.infer<typeof disableTotpSchema>;

/** Disable email OTP / confirm email OTP: 6-digit emailed code. */
export const emailOtpCodeSchema = z.object({
  code: z
    .string()
    .transform((v) => v.trim().replace(/\s/g, ""))
    .pipe(z.string().regex(/^\d{6}$/, "Enter the 6-digit code from the email")),
});
export type EmailOtpCodeFormData = z.infer<typeof emailOtpCodeSchema>;

export const disableEmailOtpSchema = z.object({
  password: z.string().min(1, "Enter your current password").max(128),
  code: z
    .string()
    .transform((v) => v.trim().replace(/\s/g, ""))
    .pipe(z.string().regex(/^\d{6}$/, "Enter the 6-digit code from the email")),
});
export type DisableEmailOtpFormData = z.infer<typeof disableEmailOtpSchema>;

/* ------------------------------- seller ------------------------------- */

export const sellerRegisterSchema = z.object({
  email: z.string().email("Enter a valid email").max(255),
  password: z.string().min(12, "Use at least 12 characters").max(128),
  name: z.string().max(120).optional(),
});
export type SellerRegisterFormData = z.infer<typeof sellerRegisterSchema>;

export const sellerLoginSchema = z.object({
  email: z.string().email("Enter a valid email").max(255),
  password: z.string().min(1, "Password is required").max(128),
});
export type SellerLoginFormData = z.infer<typeof sellerLoginSchema>;

export const createStoreSchema = z.object({
  name: z.string().trim().min(2, "Give your store a name").max(120),
  slug: z
    .string()
    .trim()
    .max(120)
    .regex(/^[a-z0-9-]*$/, "Use lowercase letters, numbers and hyphens")
    .optional()
    .or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  category: z.string().max(120).optional().or(z.literal("")),
  country: z.string().max(120).optional().or(z.literal("")),
  currency: z.string().trim().max(8).optional().or(z.literal("")),
  timezone: z.string().max(80).optional().or(z.literal("")),
  contactEmail: z.string().email("Enter a valid email").max(255).optional().or(z.literal("")),
  contactPhone: z.string().max(40).optional().or(z.literal("")),
  logo: z.string().url("Enter a valid image URL").max(2048).optional().or(z.literal("")),
});
export type CreateStoreFormData = z.infer<typeof createStoreSchema>;

export const inviteMemberSchema = z.object({
  email: z.string().email("Enter a valid email").max(255),
  roleKey: z.string().min(1, "Choose a role"),
});
export type InviteMemberFormData = z.infer<typeof inviteMemberSchema>;

export const sellerRoleSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2, "Use at least 2 characters")
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens"),
  name: z.string().trim().min(2, "Give the role a name").max(120),
  description: z.string().max(500).optional().or(z.literal("")),
});
export type SellerRoleFormData = z.infer<typeof sellerRoleSchema>;

/* ------------------------------ attributes ------------------------------ */
/* Global lookup catalog — mirrors backend rules for instant feedback. */

const attributeTypeField = z
  .string()
  .trim()
  .min(2, 'Use at least 2 characters')
  .max(64, 'Keep the type under 64 characters')
  .regex(/^[a-z][a-z0-9_]*$/, 'Lowercase snake_case, e.g. payment_type');

const attributeKeyField = z
  .string()
  .trim()
  .min(2, 'Use at least 2 characters')
  .max(128, 'Keep the key under 128 characters')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase hyphen slug, e.g. fashion-apparel');

export const createAttributeSchema = z.object({
  type: attributeTypeField,
  key: attributeKeyField,
  label: z.string().trim().min(1, 'Give the entry a display name').max(255),
  value: z.string().max(255, 'Keep the code under 255 characters').optional().or(z.literal('')),
  description: z.string().max(500, 'Keep the description under 500 characters').optional().or(z.literal('')),
  sortOrder: z.number().int().min(0).max(1_000_000).default(0),
});
export type CreateAttributeFormData = z.infer<typeof createAttributeSchema>;

export const editAttributeSchema = z.object({
  label: z.string().trim().min(1, 'Give the entry a display name').max(255),
  value: z.string().max(255, 'Keep the code under 255 characters').optional().or(z.literal('')),
  description: z.string().max(500, 'Keep the description under 500 characters').optional().or(z.literal('')),
  sortOrder: z.number().int().min(0).max(1_000_000),
});
export type EditAttributeFormData = z.infer<typeof editAttributeSchema>;

export const attributeStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
  reason: z.string().trim().min(3, 'Tell the audit trail why (min 3 characters)').max(500),
});
export type AttributeStatusFormData = z.infer<typeof attributeStatusSchema>;
