import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import listingRoutes from './listings';
import messageRoutes from './messages';
import adminRoutes from './admin';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'UMass Marketplace API is working!',
    timestamp: new Date().toISOString()
  });
});

// Route handlers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/listings', listingRoutes);
router.use('/messages', messageRoutes);
router.use('/admin', adminRoutes);

export default router;
