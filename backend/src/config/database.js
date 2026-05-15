import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDB = async () => {
  await mongoose.connect(env.MONGODB_URI, {
    maxPoolSize: 10,      // cap connections — Atlas free tier allows 500 total
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
  console.log('MongoDB connected');
};
