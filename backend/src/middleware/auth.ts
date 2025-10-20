import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  body: any;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isVerified: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (!user.isVerified) {
      return res.status(401).json({ error: 'Email not verified' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const requireUMassEmail = (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;
  
  if (!email || !email.endsWith('@umass.edu')) {
    return res.status(400).json({ 
      error: 'UMass email required. Please use your @umass.edu email address.' 
    });
  }
  
  next();
};