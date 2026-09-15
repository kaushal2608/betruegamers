import { z } from 'zod';

export const signupSchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email address'),
    username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username cannot exceed 30 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['USER', 'COACH']).optional().default('USER')
  })
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email address'),
    otp: z.string().length(6, 'OTP must be exactly 6 digits'),
    username: z.string().min(3).max(30),
    password: z.string().min(8),
    role: z.enum(['USER', 'COACH']).optional().default('USER')
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email address'),
    password: z.string().min(1, 'Password is required')
  })
});

export const resendOtpSchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email address')
  })
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email address')
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email address'),
    otp: z.string().length(6, 'OTP must be exactly 6 digits'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters')
  })
});
