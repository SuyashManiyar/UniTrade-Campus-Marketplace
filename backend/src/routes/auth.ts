import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { registerSchema, loginSchema } from '../utils/validation';
import { sendVerificationEmail, generateVerificationCode } from '../utils/email';
import { requireUMassEmail } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Store verification codes temporarily (in production, use Redis)
const verificationCodes = new Map<string, { code: string; expires: Date; userData?: any }>();

// Register user
router.post('/register', requireUMassEmail, async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Generate verification code
    const code = generateVerificationCode();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store verification data
    verificationCodes.set(validatedData.email, {
      code,
      expires,
      userData: validatedData
    });

    // Send verification email (skip for development)
    console.log(`Verification code for ${validatedData.email}: ${code}`);
    // const emailSent = await sendVerificationEmail(validatedData.email, code);
    
    // if (!emailSent) {
    //   return res.status(500).json({ error: 'Failed to send verification email' });
    // }

    res.json({ 
      message: 'Verification code sent to your email',
      email: validatedData.email 
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Registration failed' });
    }
  }
});

// Verify email and complete registration
router.post('/verify', async (req, res) => {
  try {
    const { email, code } = loginSchema.parse(req.body);
    
    const storedData = verificationCodes.get(email);
    
    if (!storedData) {
      return res.status(400).json({ error: 'Verification code not found or expired' });
    }

    if (storedData.expires < new Date()) {
      verificationCodes.delete(email);
      return res.status(400).json({ error: 'Verification code expired' });
    }

    if (storedData.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Create user if userData exists (registration flow)
    if (storedData.userData) {
      const user = await prisma.user.create({
        data: {
          ...storedData.userData,
          isVerified: true
        }
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      verificationCodes.delete(email);

      res.json({
        message: 'Registration successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } else {
      // Login flow - find existing user
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return res.status(400).json({ error: 'User not found' });
      }

      // Update verification status
      await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true }
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      verificationCodes.delete(email);

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    }
  } catch (error) {
    console.error('Verification error:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Verification failed' });
    }
  }
});

// Login (send verification code)
router.post('/login', requireUMassEmail, async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ error: 'No account found with this email' });
    }

    // Generate verification code
    const code = generateVerificationCode();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store verification data (no userData for login)
    verificationCodes.set(email, {
      code,
      expires
    });

    // Send verification email (skip for development)
    console.log(`Login verification code for ${email}: ${code}`);
    // const emailSent = await sendVerificationEmail(email, code);
    
    // if (!emailSent) {
    //   return res.status(500).json({ error: 'Failed to send verification email' });
    // }

    res.json({ 
      message: 'Verification code sent to your email',
      email 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Resend verification code
router.post('/resend-code', requireUMassEmail, async (req, res) => {
  try {
    const { email } = req.body;
    
    const storedData = verificationCodes.get(email);
    if (!storedData) {
      return res.status(400).json({ error: 'No pending verification for this email' });
    }

    // Generate new code
    const code = generateVerificationCode();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    // Update stored data
    verificationCodes.set(email, {
      ...storedData,
      code,
      expires
    });

    // Send verification email (skip for development)
    console.log(`Resend verification code for ${email}: ${code}`);
    // const emailSent = await sendVerificationEmail(email, code);
    
    // if (!emailSent) {
    //   return res.status(500).json({ error: 'Failed to send verification email' });
    // }

    res.json({ message: 'New verification code sent' });
  } catch (error) {
    console.error('Resend code error:', error);
    res.status(500).json({ error: 'Failed to resend code' });
  }
});

// Development only - Get verification codes
router.get('/dev/codes', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Not found' });
  }
  
  const codes = Array.from(verificationCodes.entries()).map(([email, data]) => ({
    email,
    code: data.code,
    expires: data.expires,
    hasUserData: !!data.userData
  }));
  
  res.json({ codes });
});

export default router;