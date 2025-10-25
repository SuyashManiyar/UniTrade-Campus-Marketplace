import { Router } from 'express';

const router = Router();

// Development only routes
router.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Not found' });
  }
  next();
});

// Toggle email sending mode
router.post('/toggle-emails', (req, res) => {
  const currentMode = process.env.SEND_REAL_EMAILS === 'true';
  const newMode = !currentMode;
  
  // Note: This only changes the runtime value, not the .env file
  process.env.SEND_REAL_EMAILS = newMode.toString();
  
  res.json({
    message: `Email mode changed`,
    previousMode: currentMode ? 'real emails' : 'console logging',
    currentMode: newMode ? 'real emails' : 'console logging',
    note: 'This change is temporary and will reset when the server restarts'
  });
});

// Get current email configuration
router.get('/email-config', (req, res) => {
  res.json({
    sendRealEmails: process.env.SEND_REAL_EMAILS === 'true',
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT,
    smtpUser: process.env.SMTP_USER ? process.env.SMTP_USER.replace(/(.{3}).*(@.*)/, '$1***$2') : 'Not configured',
    hasPassword: !!process.env.SMTP_PASS
  });
});

export default router;