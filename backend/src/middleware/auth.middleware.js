import { verifyToken } from '../utils/jwt.js';
import { userRepository } from '../repositories/user.repository.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = req.cookies?.btg_token;
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is missing or invalid'
      });
    }

    const decoded = verifyToken(token);


    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Token has expired or is invalid'
      });
    }

    // Fetch user from repository
    const user = await userRepository.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User associated with this token no longer exists'
      });
    }

    if (user.is_blocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[Auth Middleware Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};
