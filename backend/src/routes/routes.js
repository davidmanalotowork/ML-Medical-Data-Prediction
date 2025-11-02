import express from 'express';
import { body } from 'express-validator';

import {
  adminLogin,
  getMe,
  logout,
  refreshToken
} from '../controller/loginController.js';

import {
  getProfile,
  updateProfile,
  changePassword,
  getAllAdmins,
  createAdmin,
  updateAdminStatus,
  deleteAdmin
} from '../controller/adminController.js';

import {
  uploadExcelData
} from '../controller/uploadController.js';

import {
  predictManualEntry,
  saveManualEntry,
  getRecentEntries,
  deleteManualEntry,
  validateManualEntry
} from '../controller/manualEntryController.js';

import {
  getSettings,
  updateSettings,
  changePasswordSettings
} from '../controller/settingsController.js';

import {
  adminAuth,
  superAdminAuth,
  verifyToken
} from '../middleware/accessLimiter.js';

import {
  authLimiter,
  apiLimiter,
  generalLimiter,
  strictLimiter
} from '../middleware/rateLimiter.js';

import {
  saveUploadHistory,
  getUploadHistory,
  getHistoryById,
  deleteHistory,
  getHistoryStats
} from '../controller/historyController.js';

const router = express.Router();

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

router.post('/auth/admin/login', authLimiter, loginValidation, adminLogin);

router.get('/auth/me', verifyToken, getMe);
router.post('/auth/logout', verifyToken, logout);
router.post('/auth/refresh', verifyToken, refreshToken);

const adminProfileValidation = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL')
];

const passwordChangeValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your new password')
];

const createAdminValidation = [
  body('name')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['admin', 'superadmin'])
    .withMessage('Role must be either admin or superadmin')
];

router.get('/admin/profile', adminAuth, getProfile);
router.put('/admin/profile', apiLimiter, adminAuth, adminProfileValidation, updateProfile);
router.put('/admin/change-password', strictLimiter, adminAuth, passwordChangeValidation, changePassword);

router.get('/admin/all', adminAuth, superAdminAuth, getAllAdmins);
router.post('/admin/create', strictLimiter, superAdminAuth, createAdminValidation, createAdmin);
router.put('/admin/:id/status', apiLimiter, superAdminAuth, updateAdminStatus);
router.delete('/admin/:id', strictLimiter, superAdminAuth, deleteAdmin);

const uploadValidation = [
  body('fileName')
    .notEmpty()
    .withMessage('File name is required'),
  body('data')
    .isArray()
    .withMessage('Data must be an array'),
  body('rowCount')
    .isInt({ min: 1 })
    .withMessage('Row count must be a positive integer')
];

router.post('/upload/excel', apiLimiter, adminAuth, uploadValidation, uploadExcelData);

router.post('/manual-entry/predict', apiLimiter, verifyToken, validateManualEntry, predictManualEntry);
router.post('/manual-entry/save', strictLimiter, adminAuth, saveManualEntry);
router.get('/manual-entry/recent', apiLimiter, verifyToken, getRecentEntries);
router.delete('/manual-entry/:id', strictLimiter, adminAuth, deleteManualEntry);

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running smoothly',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

router.get('/info', generalLimiter, (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: 'Admin Template MERN API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      endpoints: {
        authentication: [
          'POST /api/auth/admin/login',
          'GET /api/auth/me',
          'POST /api/auth/logout',
          'POST /api/auth/refresh'
        ],
        admin: [
          'GET /api/admin/profile',
          'PUT /api/admin/profile',
          'PUT /api/admin/change-password',
          'GET /api/admin/all',
          'POST /api/admin/create',
          'PUT /api/admin/:id/status',
          'DELETE /api/admin/:id'
        ]
      }
    }
  });
});

const settingsValidation = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
];

const settingsPasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your new password')
];

router.get('/settings', verifyToken, getSettings);
router.put('/settings/password', strictLimiter, verifyToken, settingsPasswordValidation, changePasswordSettings);


const saveHistoryValidation = [
  body('fileName').notEmpty().withMessage('File name is required'),
  body('recordCount').isInt({ min: 0 }).withMessage('Record count must be a non-negative integer'),
  body('highRiskCount').isInt({ min: 0 }).withMessage('High risk count must be a non-negative integer'),
  body('mediumRiskCount').isInt({ min: 0 }).withMessage('Medium risk count must be a non-negative integer'),
  body('lowRiskCount').isInt({ min: 0 }).withMessage('Low risk count must be a non-negative integer'),
];

router.post('/history', apiLimiter, verifyToken, saveHistoryValidation, saveUploadHistory);
router.get('/history', apiLimiter, verifyToken, getUploadHistory);
router.get('/history/stats', apiLimiter, verifyToken, getHistoryStats);
router.get('/history/:id', apiLimiter, verifyToken, getHistoryById);
router.delete('/history/:id', strictLimiter, verifyToken, deleteHistory);

router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

export default router;
