import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './src/config/db.js';
import Admin from './src/models/Admin.js';

dotenv.config();

const createInitialAdmin = async () => {
  const name = process.env.INITIAL_ADMIN_NAME?.trim();
  const email = process.env.INITIAL_ADMIN_EMAIL?.trim();
  const password = process.env.INITIAL_ADMIN_PASSWORD;

  if (!name || !email || !password || password.length < 12) {
    console.error('Set INITIAL_ADMIN_NAME, INITIAL_ADMIN_EMAIL, and an INITIAL_ADMIN_PASSWORD of at least 12 characters.');
    process.exitCode = 1;
    return;
  }

  try {
    await connectDB();
    const existingAdmin = await Admin.findOne();
    
    if (existingAdmin) {
      console.log('An admin account already exists.');
      return;
    }

    await Admin.create({
      name,
      email,
      password,
      role: 'superadmin'
    });
    console.log('Initial admin account created.');

  } catch (error) {
    console.error('Failed to create initial admin account:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

createInitialAdmin();
