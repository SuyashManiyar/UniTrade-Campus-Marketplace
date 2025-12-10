import { generateVerificationCode, sendVerificationEmail } from '../email';

describe('Email Utilities', () => {
  describe('generateVerificationCode', () => {
    it('should generate a 6-digit code', () => {
      const code = generateVerificationCode();
      expect(code).toMatch(/^\d{6}$/);
    });

    it('should generate different codes on multiple calls', () => {
      const codes = new Set();
      for (let i = 0; i < 10; i++) {
        codes.add(generateVerificationCode());
      }
      // Most codes should be unique (allowing for rare collisions)
      expect(codes.size).toBeGreaterThan(5);
    });

    it('should generate codes in valid range (100000-999999)', () => {
      for (let i = 0; i < 100; i++) {
        const code = generateVerificationCode();
        const codeNum = parseInt(code);
        expect(codeNum).toBeGreaterThanOrEqual(100000);
        expect(codeNum).toBeLessThanOrEqual(999999);
      }
    });
  });

  describe('sendVerificationEmail', () => {
    const originalEnv = process.env.SEND_REAL_EMAILS;

    beforeEach(() => {
      // Reset environment
      delete process.env.SEND_REAL_EMAILS;
    });

    afterEach(() => {
      process.env.SEND_REAL_EMAILS = originalEnv;
    });

    it('should return true when real emails are disabled (development mode)', async () => {
      process.env.SEND_REAL_EMAILS = 'false';

      const result = await sendVerificationEmail('test@umass.edu', '123456');

      expect(result).toBe(true);
    });

    it('should log verification code when real emails are disabled', async () => {
      process.env.SEND_REAL_EMAILS = 'false';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await sendVerificationEmail('test@umass.edu', '123456');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Verification email for test@umass.edu')
      );

      consoleSpy.mockRestore();
    });

    it('should handle missing email configuration gracefully', async () => {
      process.env.SEND_REAL_EMAILS = 'true';
      // Don't set SMTP credentials - this will cause nodemailer to fail
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await sendVerificationEmail('test@umass.edu', '123456');
      consoleSpy.mockRestore();

      // Should return false when email sending fails
      expect(result).toBe(false);
    });
  });
});


