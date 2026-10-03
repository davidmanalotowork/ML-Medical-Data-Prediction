import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request with proper id field
    req.user = {
      id: decoded.id || decoded._id || decoded.userId,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
      userType: decoded.userType
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    console.error('Token verification error:', error);
    
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

export const adminAuth = async (req, res, next) => {
  try {
    await new Promise((resolve, reject) => {
      verifyToken(req, res, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    const admin = await Admin.findById(req.user.id).select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found.'
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Admin account is deactivated.'
      });
    }

    if (req.user.userType !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during admin authentication.'
    });
  }
};

export const superAdminAuth = async (req, res, next) => {
  try {
    await new Promise((resolve, reject) => {
      adminAuth(req, res, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    if (req.admin.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.'
      });
    }

    next();
  } catch (error) {
    console.error('Super admin auth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during super admin authentication.'
    });
  }
};

export default {
  verifyToken,
  adminAuth,
  superAdminAuth
};
