import { authService } from '../services/auth.service.js';

export const authController = {
  async signup(req, res, next) {
    try {
      const result = await authService.initiateSignup(req.body);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async verifyOtp(req, res, next) {
    try {
      const result = await authService.verifyOtpAndRegister(req.body);
      if (result?.token) {
        res.cookie('btg_token', result.token, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: '/'
        });
      }
      res.status(201).json({
        success: true,
        message: 'Account successfully registered and verified!',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async resendOtp(req, res, next) {
    try {
      const result = await authService.resendOtp(req.body);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async forgotPassword(req, res, next) {
    try {
      const result = await authService.requestPasswordReset(req.body);
      res.status(200).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const result = await authService.resetPassword(req.body);
      res.status(200).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      if (result?.token) {
        res.cookie('btg_token', result.token, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: '/'
        });
      }
      res.status(200).json({
        success: true,
        message: 'Login successful!',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res, next) {
    try {
      res.clearCookie('btg_token', { path: '/' });
      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  async getMe(req, res, next) {
    try {
      res.status(200).json({
        success: true,
        data: req.user
      });
    } catch (error) {
      next(error);
    }
  }
};
