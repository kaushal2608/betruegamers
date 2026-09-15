import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { ENV } from './config/env.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import gameRoutes from './routes/game.routes.js';
import friendRoutes from './routes/friend.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import chatRoutes from './routes/chat.routes.js';
import coachRoutes from './routes/coach.routes.js';
import coachingRoutes from './routes/coaching.routes.js';
import adminRoutes from './routes/admin.routes.js';
import uploadRoutes from './routes/upload.routes.js';

const app = express();

// Parse Cookies
app.use(cookieParser());

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: false,
}));


// CORS Configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ENV.NODE_ENV === 'development') {
      return callback(null, true);
    }
    if (
      origin === ENV.CLIENT_URL ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // Cache preflight OPTIONS requests for 24 hours
}));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30000, // limit each IP to 30,000 requests per window (100x increase)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
app.use('/api/', apiLimiter);

// Logging
if (ENV.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'BeTrueGamers API',
    environment: ENV.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Root API Welcome
app.get('/api', (req, res) => {
  res.status(200).json({
    name: 'BeTrueGamers API',
    version: '1.0.0',
    description: 'Production-Grade Gaming Platform REST & Real-time Services'
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/conversations', chatRoutes);
app.use('/api/coaches', coachRoutes);
app.use('/api/coaching', coachingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling (routes will be mounted in upcoming phases)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
