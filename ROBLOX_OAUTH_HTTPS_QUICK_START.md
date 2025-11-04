# Quick Start: HTTPS for Roblox OAuth (Local Testing)

## 🎯 The Problem
Roblox requires **HTTPS** for Entry Link, Privacy Policy, and Terms URLs. `http://localhost:3000` won't work.

## ✅ Quick Solution (ngrok)

### 1. Install ngrok
Download from: https://ngrok.com/download
- Extract `ngrok.exe` to your project folder OR add to system PATH

### 2. Sign up (free)
- Go to: https://dashboard.ngrok.com/signup
- Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken
- Run: `ngrok config add-authtoken YOUR_TOKEN`

### 3. Start Tunnel
In a new terminal, run:
```powershell
ngrok http 3000
```

You'll see:
```
Forwarding   https://abc123.ngrok-free.app -> http://localhost:3000
```

### 4. Use in Roblox
In Roblox Creator Dashboard, use these URLs (replace `abc123.ngrok-free.app` with your ngrok URL):

- **Entry Link**: `https://abc123.ngrok-free.app`
- **Privacy Policy URL**: `https://abc123.ngrok-free.app/privacy`
- **Terms of Service URL**: `https://abc123.ngrok-free.app/terms`
- **Redirect URI**: `https://abc123.ngrok-free.app/api/auth/roblox/callback`

### 5. Update .env.local
```env
ROBLOX_REDIRECT_URI=https://abc123.ngrok-free.app/api/auth/roblox/callback
```

### 6. Test!
- Your app: `http://localhost:3000` (still works)
- OAuth: Uses `https://abc123.ngrok-free.app` (Roblox will use this)

## 🔄 Alternative: localtunnel (No Signup)

```powershell
npm install -g localtunnel
lt --port 3000
```

Use the HTTPS URL it gives you (same way as ngrok).

## ⚠️ Important
- ngrok URL changes when you restart it
- Free ngrok may show a warning page (click "Visit Site")
- Update Roblox settings if you get a new ngrok URL

## 📋 Checklist
- [ ] ngrok installed
- [ ] ngrok configured (authtoken added)
- [ ] Next.js running on port 3000
- [ ] ngrok tunnel running
- [ ] Roblox OAuth configured with HTTPS URLs
- [ ] .env.local updated
- [ ] Test OAuth login!

