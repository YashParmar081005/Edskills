import { body } from 'express-validator';
import { COURSE_CATEGORIES } from '../models/Course.js';
import { LESSON_TYPES } from '../models/Lesson.js';

export const createCourseValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Course title is required')
    .isLength({ max: 120 })
    .withMessage('Title must be at most 120 characters'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be 0 or more'),
  body('category')
    .optional()
    .isIn(COURSE_CATEGORIES)
    .withMessage('Invalid category'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
];

export const updateCourseValidator = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 120 })
    .withMessage('Title must be at most 120 characters'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be 0 or more'),
  body('category').optional().isIn(COURSE_CATEGORIES).withMessage('Invalid category'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
];

export const moduleValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Module title is required')
    .isLength({ max: 120 })
    .withMessage('Title must be at most 120 characters'),
];

export const lessonValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Lesson title is required')
    .isLength({ max: 160 })
    .withMessage('Title must be at most 160 characters'),
  body('type').optional().isIn(LESSON_TYPES).withMessage("Type must be 'video' or 'text'"),
];
