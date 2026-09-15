import crypto from 'crypto';

export const generateOtp = () => {
  // Generate secure 6-digit numeric OTP
  return crypto.randomInt(100000, 999999).toString();
};
