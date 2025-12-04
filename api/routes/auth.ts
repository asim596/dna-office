import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken, hashPassword, comparePassword, generateToken } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/security.js';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name is required and must be less than 100 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name is required and must be less than 100 characters'),
  body('dateOfBirth')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Date of birth must be a valid date'),
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Register new user
router.post('/register', authRateLimiter, registerValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: 'Validation failed',
      errors: errors.array(),
    });
    return;
  }

  const { email, password, firstName, lastName, dateOfBirth } = req.body;

  // Check if user already exists
  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  if (existingUser.length > 0) {
    throw new AppError('User already exists with this email address', 409);
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const [newUser] = await db.insert(users).values({
    email,
    passwordHash,
    firstName,
    lastName,
    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
  } as any).returning();

  // Generate JWT token
  const token = generateToken({
    userId: newUser.id,
    email: newUser.email,
    accountType: newUser.accountType,
  });

  // Remove password hash from response
  const { passwordHash: _, ...userWithoutPassword } = newUser;

  res.status(201).json({
    message: 'User registered successfully',
    user: userWithoutPassword,
    token,
  });
}));

// Login user
router.post('/login', authRateLimiter, loginValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: 'Validation failed',
      errors: errors.array(),
    });
    return;
  }

  const { email, password } = req.body;

  // Find user
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  if (!user || !user.isActive) {
    throw new AppError('Invalid email or password', 401);
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Update last login
  await db.update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    accountType: user.accountType,
  });

  // Remove password hash from response
  const { passwordHash: _, ...userWithoutPassword } = user;

  res.json({
    message: 'Login successful',
    user: userWithoutPassword,
    token,
  });
}));

// Get current user profile
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.userId;

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Remove password hash from response
  const { passwordHash: _, ...userWithoutPassword } = user;

  res.json({
    user: userWithoutPassword,
  });
}));

// Update user profile
router.put('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  const { firstName, lastName, dateOfBirth, privacyLevel, marketingConsent } = req.body;

  const [updatedUser] = await db.update(users)
    .set({
      firstName,
      lastName,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      privacyLevel,
      marketingConsent,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  if (!updatedUser) {
    throw new AppError('User not found', 404);
  }

  // Remove password hash from response
  const { passwordHash: _, ...userWithoutPassword } = updatedUser;

  res.json({
    message: 'Profile updated successfully',
    user: userWithoutPassword,
  });
}));

// Logout user (client-side token invalidation)
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  // In a more complex system, you might want to blacklist the token
  // For now, we just return a success message as the client will remove the token
  res.json({
    message: 'Logout successful',
  });
}));

export default router;
