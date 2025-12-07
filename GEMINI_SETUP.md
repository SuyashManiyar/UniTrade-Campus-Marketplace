# Gemini API Setup Guide

The NLP-Enhanced Search feature uses Google's Gemini API to parse natural language queries. Follow these steps to set it up:

## Step 1: Get a Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key (it should start with `AIza`)

## Step 2: Enable the Gemini API

The API key alone might not be enough. You may need to:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Enable the "Generative Language API" for your project
4. Make sure billing is enabled (Gemini has a free tier)

## Step 3: Add API Key to Environment

1. Open `backend/.env`
2. Add your API key:
   ```
   GEMINI_API_KEY=your-actual-api-key-here
   ```
3. Save the file

## Step 4: Restart the Backend

```bash
cd backend
npm run dev
```

## Testing the Setup

Run the NLP service tests:

```bash
cd backend
npm test -- nlpService.test.ts
```

If the API key is configured correctly, the tests will run against the Gemini API. If not, they will skip gracefully and the system will fall back to standard keyword search.

## Troubleshooting

### 404 Not Found Error

If you see "404 Not Found" errors:
- Verify the API key is correct
- Check that the Generative Language API is enabled in Google Cloud Console
- Ensure your Google Cloud project has billing enabled
- Try regenerating the API key

### API Not Available

If the Gemini API is not available in your region or you don't want to use it:
- The system will automatically fall back to standard keyword search
- All features will continue to work, just without NLP parsing
- Leave `GEMINI_API_KEY` empty in the `.env` file

## Free Tier Limits

Gemini API free tier includes:
- 60 requests per minute
- 1,500 requests per day
- Rate limiting is handled automatically by the NLP service

For production use, consider upgrading to a paid plan.
