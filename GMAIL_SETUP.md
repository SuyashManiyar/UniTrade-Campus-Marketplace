# Gmail SMTP Setup for UMass Marketplace

This guide will help you set up Gmail SMTP to send real verification emails instead of just logging them to the console.

## 📧 Gmail App Password Setup

### Step 1: Enable 2-Factor Authentication
1. Go to your [Google Account settings](https://myaccount.google.com/)
2. Click on **Security** in the left sidebar
3. Under "Signing in to Google", click **2-Step Verification**
4. Follow the prompts to enable 2FA if not already enabled

### Step 2: Generate App Password
1. In the same Security section, click **App passwords**
2. Select **Mail** as the app
3. Select **Other (Custom name)** as the device
4. Enter "UMass Marketplace" as the name
5. Click **Generate**
6. **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)

### Step 3: Update Environment Variables
1. Open `backend/.env` file
2. Update the email configuration:

```env
# Email Configuration (for verification codes)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
# Set to 'true' to enable real email sending, 'false' for console logging
SEND_REAL_EMAILS=true
```

**Replace:**
- `your-gmail@gmail.com` with your actual Gmail address
- `abcd efgh ijkl mnop` with the app password you generated

### Step 4: Test Email Sending
1. Restart the backend server: `npm run dev:backend`
2. Try registering with a real email address
3. Check your email inbox for the verification code

## 🔧 Configuration Options

### Development Mode (Console Logging)
```env
SEND_REAL_EMAILS=false
```
- Verification codes are logged to the backend console
- No actual emails are sent
- Good for development and testing

### Production Mode (Real Emails)
```env
SEND_REAL_EMAILS=true
```
- Real emails are sent via Gmail SMTP
- Users receive professional-looking verification emails
- Required for production deployment

## 🎨 Email Template Features

The verification emails include:
- **UMass Marketplace branding** with maroon colors
- **Large, easy-to-read verification code**
- **Security reminders** and expiration notice
- **Professional HTML formatting**
- **Mobile-friendly responsive design**

## 🔒 Security Best Practices

1. **Never commit your app password** to version control
2. **Use environment variables** for sensitive data
3. **Rotate app passwords** periodically
4. **Use different app passwords** for different applications
5. **Revoke unused app passwords** from your Google Account

## 🚨 Troubleshooting

### "Invalid credentials" error
- Double-check your Gmail address and app password
- Make sure 2FA is enabled on your Google account
- Verify the app password is copied correctly (no spaces)

### "Connection refused" error
- Check your internet connection
- Verify SMTP settings (host: smtp.gmail.com, port: 587)
- Try disabling antivirus/firewall temporarily

### Emails not being received
- Check spam/junk folder
- Verify the recipient email address is correct
- Test with a different email provider (Yahoo, Outlook, etc.)

### Rate limiting
- Gmail has sending limits (500 emails/day for free accounts)
- For high-volume applications, consider using dedicated email services like SendGrid or AWS SES

## 📝 Example .env Configuration

```env
# Database
DATABASE_URL="file:./dev.db"

# Server
PORT=8080
NODE_ENV=development

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourname@gmail.com
SMTP_PASS=your-16-char-app-password
SEND_REAL_EMAILS=true

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=uploads
```

## 🎯 Quick Test

After setup, test the email functionality:

1. **Register a new user** with your real email
2. **Check your inbox** for the verification email
3. **Use the code** to complete registration
4. **Check backend logs** for success messages

If everything works, you'll see:
- ✅ Professional email in your inbox
- ✅ `Verification email sent to [email]` in backend logs
- ✅ Successful user registration

## 🔄 Switching Between Modes

You can easily switch between development and production modes:

**Development (console logging):**
```bash
# In backend/.env
SEND_REAL_EMAILS=false
```

**Production (real emails):**
```bash
# In backend/.env
SEND_REAL_EMAILS=true
```

No code changes required - just restart the backend server after changing the environment variable.