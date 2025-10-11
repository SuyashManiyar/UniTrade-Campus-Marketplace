import { Router } from 'express';

const router = Router();

// Example API routes
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

router.get('/users', (req, res) => {
  // Example endpoint - replace with actual implementation
  res.json({ 
    message: 'Users endpoint',
    data: []
  });
});

export default router;
