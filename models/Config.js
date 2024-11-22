import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

mongoose.connect(process.env.DATABASE).then(() => {
  console.log("Database connected successfully");
});