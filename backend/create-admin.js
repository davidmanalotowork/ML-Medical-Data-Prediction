import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import Admin from './src/models/Admin.js';

dotenv.config();

connectDB();

const createInitialAdmin = async () => {
  try {
    const existingAdmin = await Admin.findOne();
    
    if (existingAdmin) {
      process.exit(0);
    }

    const superAdmin = await Admin.create({
      name: 'Super Administrator',
      email: 'admin1@gmail.com',
      password: 'admin123!',
      role: 'superadmin'
    });

    process.exit(0);

  } catch (error) {
    process.exit(1);
  }
};

createInitialAdmin();
