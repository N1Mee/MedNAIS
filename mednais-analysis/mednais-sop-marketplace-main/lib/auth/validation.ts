import { z } from 'zod';

export const MagicLinkRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const MagicLinkVerifySchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const GoogleAuthSchema = z.object({
  idToken: z.string().min(1, 'Google ID token is required'),
});

export const AppleAuthSchema = z.object({
  idToken: z.string().min(1, 'Apple ID token is required'),
});

export type MagicLinkRequestInput = z.infer<typeof MagicLinkRequestSchema>;
export type MagicLinkVerifyInput = z.infer<typeof MagicLinkVerifySchema>;
export type GoogleAuthInput = z.infer<typeof GoogleAuthSchema>;
export type AppleAuthInput = z.infer<typeof AppleAuthSchema>;
