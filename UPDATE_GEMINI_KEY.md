# How to Update Your Gemini API Key

Your Gemini API key has been flagged as leaked and needs to be replaced.

## Step 1: Get a New API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"** or **"Get API Key"**
4. Select your Google Cloud project (or create a new one)
5. Copy the new API key (it starts with `AIza...`)

## Step 2: Update the Key in Your Environment

### For Local Development:

Edit `server/.env`:
```bash
cd server
nano .env  # or use your preferred editor
```

Find the line:
```
GEMINI_API_KEY=AIzaSyAhYhiWVqZRs-Tss5Bb-uBNqYAujh1kSwk
```

Replace it with your new key:
```
GEMINI_API_KEY=YOUR_NEW_API_KEY_HERE
```

### For CapRover/Production:

1. Go to your CapRover dashboard
2. Select your app
3. Go to **"App Configs"** → **"Environment Variables"**
4. Find `GEMINI_API_KEY`
5. Update it with your new key
6. Click **"Save & Update"**

## Step 3: Restart Your Server

After updating the key, restart your server:

```bash
# Local development
cd server
pnpm dev

# Or restart your CapRover app from the dashboard
```

## Step 4: Test

Try generating content again. The error should be resolved.

## Security Best Practices

⚠️ **Important Security Tips:**

1. **Never commit API keys to Git**
   - Make sure `.env` is in your `.gitignore`
   - Never share API keys publicly

2. **Rotate keys regularly**
   - If a key is leaked, generate a new one immediately
   - Consider rotating keys every few months

3. **Use different keys for different environments**
   - Development key for local testing
   - Production key for live app

4. **Restrict API key usage** (in Google Cloud Console):
   - Set API restrictions
   - Set application restrictions (IP addresses, HTTP referrers)
   - Monitor usage in Google Cloud Console

5. **Delete old/compromised keys**
   - After creating a new key, delete the old one from Google AI Studio
   - This prevents unauthorized usage

## Troubleshooting

### Error: "API key not valid"
- Make sure you copied the entire key (no spaces, no line breaks)
- Verify the key is active in Google AI Studio
- Check that you're using the correct project

### Error: "Quota exceeded"
- Check your Google Cloud billing
- Verify quota limits in Google Cloud Console
- Consider upgrading your plan

### Error: "Permission denied"
- Make sure the API key has the right permissions
- Enable "Generative Language API" in Google Cloud Console
- Check that your Google Cloud project has billing enabled

## Need Help?

- [Google AI Studio Documentation](https://ai.google.dev/docs)
- [Gemini API Quickstart](https://ai.google.dev/gemini-api/docs/quickstart)
- [API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)
