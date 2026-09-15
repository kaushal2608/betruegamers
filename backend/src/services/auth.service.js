import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository.js';
import { generateOtp } from '../utils/otp.js';
import { sendOtpEmail } from '../utils/mailer.js';
import { signToken } from '../utils/jwt.js';

export const authService = {
  async initiateSignup({ email, username, password, role = 'USER' }) {
    // Check if user or email already exists
    const existingEmail = await userRepository.findByEmail(email);
    if (existingEmail) {
      const error = new Error('An account with this email address already exists.');
      error.statusCode = 409;
      throw error;
    }

    const existingUsername = await userRepository.findByUsername(username);
    if (existingUsername) {
      const error = new Error('This gaming username is already taken.');
      error.statusCode = 409;
      throw error;
    }

    // Generate and save 6-digit OTP
    const otpCode = generateOtp();
    await userRepository.saveOtp(email, otpCode, 'SIGNUP');

    // Dispatch OTP email
    await sendOtpEmail(email, otpCode);

    return {
      message: 'Verification code sent to your email address.',
      email
    };
  },

  async verifyOtpAndRegister({ email, otp, username, password, role = 'USER' }) {
    // Check existing email
    const existingEmail = await userRepository.findByEmail(email);
    if (existingEmail) {
      const error = new Error('An account with this email address already exists.');
      error.statusCode = 409;
      throw error;
    }

    const otpRecord = await userRepository.getValidOtp(email, otp, 'SIGNUP');
    if (!otpRecord) {
      const error = new Error('Invalid verification code.');
      error.statusCode = 400;
      throw error;
    }

    // Check attempt limit
    const maxAttempts = otpRecord.maxAttempts ?? otpRecord.max_attempts ?? 5;
    if (otpRecord.attempts >= maxAttempts) {
      const error = new Error('Too many invalid attempts. Please request a new verification code.');
      error.statusCode = 400;
      throw error;
    }

    // Check expiry
    const expiresAt = otpRecord.expiresAt || otpRecord.expires_at;
    if (new Date() > new Date(expiresAt)) {
      const error = new Error('Verification code has expired. Please request a new one.');
      error.statusCode = 400;
      throw error;
    }

    // Mark OTP as consumed
    await userRepository.markOtpConsumed(otpRecord.id);

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user and profile in transaction
    const newUser = await userRepository.createUserWithProfile({
      email,
      username,
      passwordHash,
      role
    });

    // Sign JWT
    const token = signToken({
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      role: newUser.role
    });

    return {
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        is_verified: newUser.is_verified,
        avatar_url: newUser.avatar_url
      }
    };
  },

  async resendOtp({ email, type = 'SIGNUP' }) {
    const otpCode = generateOtp();
    await userRepository.saveOtp(email, otpCode, type);
    await sendOtpEmail(email, otpCode, type);

    return {
      message: 'A new verification code has been dispatched to your email.'
    };
  },

  async requestPasswordReset({ email }) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      const error = new Error('No account found associated with this email address.');
      error.statusCode = 404;
      throw error;
    }

    const otpCode = generateOtp();
    await userRepository.saveOtp(email, otpCode, 'PASSWORD_RESET');
    await sendOtpEmail(email, otpCode, 'PASSWORD_RESET');

    return {
      message: 'Password reset code has been sent to your email address.',
      email
    };
  },

  async resetPassword({ email, otp, newPassword }) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      const error = new Error('No account found associated with this email address.');
      error.statusCode = 404;
      throw error;
    }

    const otpRecord = await userRepository.getValidOtp(email, otp, 'PASSWORD_RESET');
    if (!otpRecord) {
      const error = new Error('Invalid verification code.');
      error.statusCode = 400;
      throw error;
    }

    const maxAttempts = otpRecord.maxAttempts ?? otpRecord.max_attempts ?? 5;
    if (otpRecord.attempts >= maxAttempts) {
      const error = new Error('Too many invalid attempts. Please request a new reset code.');
      error.statusCode = 400;
      throw error;
    }

    const expiresAt = otpRecord.expiresAt || otpRecord.expires_at;
    if (new Date() > new Date(expiresAt)) {
      const error = new Error('Verification code has expired. Please request a new one.');
      error.statusCode = 400;
      throw error;
    }

    // Mark OTP as consumed
    await userRepository.markOtpConsumed(otpRecord.id);

    // Hash new password and update
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePassword(user.email, passwordHash);

    return {
      message: 'Password reset successful! You can now sign in with your new password.'
    };
  },

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    if (user.is_blocked) {
      const error = new Error('Your account has been suspended. Please contact support.');
      error.statusCode = 403;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    await userRepository.updateLastLogin(user.id);

    const token = signToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        is_verified: user.is_verified,
        avatar_url: user.avatar_url,
        full_name: user.full_name,
        bio: user.bio,
        experience_level: user.experience_level,
        theme: user.theme || 'dark'
      }
    };
  },

  async getMe(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }
    return user;
  }
};
