import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import Admin from '../models/Admin.js';
import Login from '../models/Login.js';

const generateToken = (user, userType) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      userType: userType,
      role: user.role || 'admin'
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
};

const logLoginAttempt = async (userId, userType, email, ipAddress, userAgent, status, failureReason = null) => {
  try {
    await Login.create({
      userId,
      userType,
      email,
      ipAddress,
      userAgent,
      loginStatus: status,
      failureReason
    });
  } catch (error) {
    console.error('Error logging login attempt:', error);
  }
};

export const adminLogin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin) {
      await logLoginAttempt(null, 'Admin', email, ipAddress, userAgent, 'failed', 'Admin not found');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!admin.isActive) {
      await logLoginAttempt(admin._id, 'Admin', email, ipAddress, userAgent, 'failed', 'Account deactivated');
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    const isPasswordMatch = await admin.matchPassword(password);

    if (!isPasswordMatch) {
      await logLoginAttempt(admin._id, 'Admin', email, ipAddress, userAgent, 'failed', 'Invalid password');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    await admin.updateLastLogin();

    await logLoginAttempt(admin._id, 'Admin', email, ipAddress, userAgent, 'success');

    const token = generateToken(admin, 'Admin');

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      data: {
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          lastLogin: admin.lastLogin
        }
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          userType: req.user.userType,
          isActive: admin.isActive,
          createdAt: admin.createdAt,
          lastLogin: admin.lastLogin
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
};
export const logout = async (req, res) => {
  try {
    await Admin.findById(req.user.id).select('-password');

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select('-password');

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found or account deactivated'
      });
    }

    const newToken = generateToken(admin, req.user.userType);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error refreshing token'
    });
  }
};

export default {
  adminLogin,
  getMe,
  logout,
  refreshToken
};
