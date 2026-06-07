import { body } from 'express-validator';

// Public self-registration is limited to these roles; admin is seeded.
const SELF_SIGNUP_ROLES = ['student', 'instructor'];

export const registerValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 80 })
    .withMessage('Name must be 2-80 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(SELF_SIGNUP_ROLES)
    .withMessage("Role must be 'student' or 'instructor'"),
];

export const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Enter a valid email')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const updateMeValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Name must be 2-80 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Enter a valid email')
    .normalizeEmail(),
  body('avatar')
    .optional({ nullable: true })
    .isString()
    .withMessage('Avatar must be a URL string'),
];

export const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
];
