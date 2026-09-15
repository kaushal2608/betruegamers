import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/betruegamers',
  DIRECT_URL: process.env.DIRECT_URL || process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/betruegamers',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_gaming_jwt_key_betruegamers_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  REDIS_URL: process.env.REDIS_URL || 'redis://default:Of8BpjPDaDmEhd4tieKrrfifQof1kh8k@redis-16708.c11.us-east-1-3.ec2.cloud.redislabs.com:16708',
  CLOUDINARY: {
    URL: process.env.CLOUDINARY_URL || 'cloudinary://199191916479379:2LiXmXHuQgiGe5ZNZgG131WFQQY@dki0spoc1',
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || 'dki0spoc1',
    API_KEY: process.env.CLOUDINARY_API_KEY || '199191916479379',
    API_SECRET: process.env.CLOUDINARY_API_SECRET || '2LiXmXHuQgiGe5ZNZgG131WFQQY'
  },
  EMAIL: {
    HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
    PORT: parseInt(process.env.EMAIL_PORT || '587', 10),
    USER: process.env.EMAIL_USER || '',
    PASS: process.env.EMAIL_PASS || '',
    FROM: process.env.EMAIL_FROM || '"BeTrueGamers" <noreply@betruegamers.com>'
  }
};
