# Roblox OAuth2 Setup Guide

## ✅ Yes, you can test it locally!

You can test Roblox OAuth2 on `localhost:3000`. Here's what you need to do:

## 🔧 Required Setup in Roblox Creator Dashboard

### Step 1: Go to Roblox Creator Dashboard
1. Visit: https://create.roblox.com/dashboard/credentials
2. Log in with your Roblox account
3. Find your OAuth 2.0 application (Client ID: `4315548699520888825`)

### Step 2: Configure Redirect URI
1. Click on your OAuth application to edit it
2. In the **"Redirect URIs"** section, add this EXACT URL:
   ```
   http://localhost:3000/api/auth/roblox/callback
   ```
3. ⚠️ **IMPORTANT**: The redirect URI must match EXACTLY, including:
   - `http://` (not `https://`)
   - `localhost:3000` (not `127.0.0.1` or any other port)
   - The full path: `/api/auth/roblox/callback`
4. Click **"Save"** to save your changes

### Step 3: Verify Environment Variables
Make sure your `.env.local` file has:
```env
ROBLOX_CLIENT_ID=4315548699520888825
ROBLOX_CLIENT_SECRET=RBX-1XhhQWIm4EaUeiqdX5NVQvP5zBXJvNZ7MQSVitpHjAALuPkSzkWSQX5fKNndYpmU
ROBLOX_REDIRECT_URI=http://localhost:3000/api/auth/roblox/callback
```

## 🧪 Testing

### Option 1: Use the Test Page
1. Go to: http://localhost:3000/test-oauth
2. This page will show you:
   - Current configuration
   - Setup instructions
   - Test button to try OAuth login
   - Common issues and solutions

### Option 2: Use the Login Page
1. Go to: http://localhost:3000/login
2. Click "Login with Roblox" button
3. Authorize on Roblox
4. You should be redirected back and logged in

## 🔍 Debugging

### Check Configuration
Visit: http://localhost:3000/api/auth/roblox/debug

This will show you:
- Current Client ID
- Redirect URI being used
- Whether Client Secret is configured
- Environment information

### Common Errors

1. **"redirect_uri_mismatch"**
   - **Cause**: The redirect URI in Roblox doesn't match what you're using
   - **Solution**: Make sure the redirect URI in Roblox is exactly: `http://localhost:3000/api/auth/roblox/callback`

2. **"invalid_client"**
   - **Cause**: Client ID or Client Secret is incorrect
   - **Solution**: Check your `.env.local` file and Roblox dashboard

3. **"client-side exception"**
   - **Cause**: Usually means the redirect URI isn't configured in Roblox
   - **Solution**: Add the redirect URI in Roblox Creator Dashboard

4. **"invalid_state"**
   - **Cause**: Cookie state doesn't match (CSRF protection)
   - **Solution**: Try again, make sure cookies are enabled in your browser

## 📝 Notes

- ✅ **localhost works**: You can test OAuth on localhost without any special configuration
- ✅ **No SSL needed**: Roblox allows `http://localhost` for testing
- ⚠️ **Exact match required**: The redirect URI must match EXACTLY in Roblox settings
- ⚠️ **Port matters**: If you're using a different port (like 3001), update both `.env.local` and Roblox settings

## 🚀 Next Steps

Once you've configured the redirect URI in Roblox:
1. Restart your dev server (if needed)
2. Go to `/test-oauth` or `/login`
3. Click "Login with Roblox"
4. Authorize the application
5. You should be redirected back and logged in!

## ❓ Still Having Issues?

1. Check the browser console for errors
2. Check the server console/logs for API errors
3. Visit `/test-oauth` to see your configuration
4. Verify the redirect URI in Roblox matches exactly
5. Make sure your dev server is running on port 3000

