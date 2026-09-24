import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email").max(255),
  password: z.string().min(1, "Password is required").max(128),
});
export type LoginFormData = z.infer<typeof loginSchema>;

export const verifySchema = z.object({
  code: z.string().min(1, "Enter the 6-digit code").max(32),
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
