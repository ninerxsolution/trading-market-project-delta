# Roblox OAuth2 Scopes/Permissions Guide

## 🎯 Required Scopes for Your Trading Marketplace

For your trading marketplace app, you need these scopes:

### Essential Scopes:
1. **`openid`** - Required for user identification
2. **`profile`** - To get user profile information (username, avatar, etc.)

These are the minimum scopes you need to authenticate users and get their basic information.

## 📝 How to Add Scopes in Roblox Dashboard

### Step 1: Use the Search Field
1. In the "Search scopes" field, type: `openid`
2. Click on `openid` when it appears in the dropdown
3. It should be added to your selected scopes

### Step 2: Add Profile Scope
1. In the "Search scopes" field, type: `profile`
2. Click on `profile` when it appears
3. It should be added

### Step 3: Verify Selected Scopes
You should see both `openid` and `profile` in your selected scopes list.

## 🔍 If You Can't Find Scopes

### Option 1: Type Exact Names
Make sure you're typing the exact scope names:
- `openid` (all lowercase, no spaces)
- `profile` (all lowercase, no spaces)

### Option 2: Check Available Scopes
Roblox may have different scopes available. Common ones include:
- `openid` - OpenID Connect (required for authentication)
- `profile` - User profile information
- `email` - User email (if available)
- `openid profile` - Sometimes combined

### Option 3: Try Different Variations
- Try `openid profile` (space-separated)
- Try just `openid` first
- Check if there's a dropdown/select list

## ✅ Your Current Code Configuration

Your code is already configured to request these scopes. In `app/api/auth/roblox/route.ts`:

```typescript
scope=openid+profile
```

This means your app requests both `openid` and `profile` scopes.

## 🎯 What Each Scope Does

### `openid` Scope
- **Purpose**: Identifies the user (OpenID Connect standard)
- **Gives you**: User ID (sub claim in ID token)
- **Required**: Yes, for OAuth2 authentication

### `profile` Scope
- **Purpose**: Gets user profile information
- **Gives you**: Username, avatar, display name
- **Required**: Yes, for displaying user info in your app

## ⚠️ Important Notes

1. **App Category**: Roblox may require your app to match a category. For a trading marketplace, select the appropriate category (e.g., "Gaming", "Marketplace", or "Social").

2. **Policy Compliance**: Make sure your app description matches the scopes you're requesting. A trading marketplace using `openid` and `profile` is appropriate.

3. **Minimum Scopes**: You need at least one scope. `openid` is the minimum required.

## 🔧 Troubleshooting

### If Search Field Doesn't Work:
1. Try clicking on the dropdown arrow
2. Check if there's a list of available scopes
3. Try refreshing the page
4. Make sure you're editing the OAuth app (not just viewing)

### If Scopes Don't Appear:
1. Try typing just `openid` first
2. Wait for the dropdown to appear
3. Click on the suggestion from the dropdown
4. Don't just press Enter - click the suggestion

### Alternative: Check Roblox Documentation
- Visit: https://create.roblox.com/docs/cloud/open-cloud/authentication
- Check what scopes are available for your app type

## 📋 Checklist

- [ ] Type `openid` in search field
- [ ] Select `openid` from dropdown
- [ ] Type `profile` in search field  
- [ ] Select `profile` from dropdown
- [ ] Verify both scopes are selected
- [ ] Save your OAuth app configuration

## 🎯 Quick Test

After adding scopes:
1. Save your OAuth app in Roblox dashboard
2. Try the OAuth flow at `/login` or `/test-oauth`
3. Check if you can get user information

If you still can't add scopes, try:
- Using a different browser
- Clearing browser cache
- Checking if Roblox dashboard has any error messages
- Contacting Roblox Developer Support

