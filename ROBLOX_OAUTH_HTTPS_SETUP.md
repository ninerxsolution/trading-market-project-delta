# Roblox OAuth2 HTTPS Setup for Local Testing

Roblox requires **HTTPS (SSL)** for Entry Link, Privacy Policy URL, and Terms of Service URL. Since `http://localhost:3000` won't work, we need to use a tunneling service to create an HTTPS URL.

## 🚀 Solution: Use ngrok (Easiest)

### Step 1: Install ngrok

**Option A: Download from website**
1. Go to: https://ngrok.com/download
2. Download for Windows
3. Extract the `ngrok.exe` file
4. Place it in your project folder or add to PATH

**Option B: Using package manager**
```powershell
# Using Chocolatey (if you have it)
choco install ngrok

# Or using Scoop
scoop install ngrok
```

### Step 2: Sign up for ngrok (Free)

1. Go to: https://dashboard.ngrok.com/signup
2. Create a free account
3. Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken
4. Run this command (replace YOUR_TOKEN):
```powershell
ngrok config add-authtoken YOUR_TOKEN
```

### Step 3: Start ngrok tunnel

1. Make sure your Next.js dev server is running on port 3000
2. Open a new terminal/command prompt
3. Run:
```powershell
ngrok http 3000
```

4. You'll see output like:
```
Forwarding   https://abc123.ngrok-free.app -> http://localhost:3000
```

5. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok-free.app`)

### Step 4: Configure Roblox OAuth

In Roblox Creator Dashboard, use your ngrok URL:

- **Entry Link**: `https://abc123.ngrok-free.app`
- **Privacy Policy URL**: `https://abc123.ngrok-free.app/privacy`
- **Terms of Service URL**: `https://abc123.ngrok-free.app/terms`
- **Redirect URI**: `https://abc123.ngrok-free.app/api/auth/roblox/callback`

⚠️ **Important**: The ngrok URL changes every time you restart ngrok (unless you have a paid plan). You'll need to update Roblox settings if you restart ngrok.

### Step 5: Update Environment Variables

Update your `.env.local`:
```env
ROBLOX_CLIENT_ID=4315548699520888825
ROBLOX_CLIENT_SECRET=RBX-1XhhQWIm4EaUeiqdX5NVQvP5zBXJvNZ7MQSVitpHjAALuPkSzkWSQX5fKNndYpmU
ROBLOX_REDIRECT_URI=https://abc123.ngrok-free.app/api/auth/roblox/callback
```

Replace `abc123.ngrok-free.app` with your actual ngrok URL.

## 🔄 Alternative: localtunnel (Free, No Signup)

### Step 1: Install localtunnel
```powershell
npm install -g localtunnel
```

### Step 2: Start tunnel
```powershell
lt --port 3000
```

### Step 3: Use the provided HTTPS URL
You'll get a URL like: `https://random-name.loca.lt`

Use this in Roblox settings (same as ngrok instructions above).

## 📝 Alternative: Cloudflare Tunnel (Free, Permanent URL)

If you want a more permanent solution:

1. Install Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/
2. Run: `cloudflared tunnel --url http://localhost:3000`
3. You'll get an HTTPS URL to use

## ⚠️ Important Notes

1. **URL Changes**: Free ngrok URLs change each time. If you restart ngrok, update Roblox settings.
2. **ngrok Free Plan**: Has session limits and may show a warning page. For production, consider paid plans.
3. **Both URLs Work**: You can access your app via:
   - `http://localhost:3000` (direct)
   - `https://your-ngrok-url.ngrok-free.app` (through ngrok)

## 🎯 Quick Setup Script

Create a script to start both Next.js and ngrok:

**start-dev.ps1** (PowerShell):
```powershell
# Start Next.js in background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

# Wait a bit for server to start
Start-Sleep -Seconds 5

# Start ngrok
ngrok http 3000
```

## ✅ Testing Checklist

- [ ] ngrok installed and configured
- [ ] ngrok tunnel running (showing HTTPS URL)
- [ ] Next.js dev server running on port 3000
- [ ] Roblox OAuth app configured with ngrok HTTPS URLs
- [ ] Environment variables updated with ngrok URL
- [ ] Test OAuth flow at `/login` or `/test-oauth`

## 🚀 After Setup

1. Start your Next.js dev server: `npm run dev`
2. Start ngrok: `ngrok http 3000`
3. Copy the HTTPS URL from ngrok
4. Update Roblox OAuth settings with the HTTPS URLs
5. Update `.env.local` with the ngrok redirect URI
6. Test OAuth login!

