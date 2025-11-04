# Roblox OAuth2 Required Fields - Local Testing Guide

Roblox requires these fields before you can use OAuth2. Here's what to fill in for **local development/testing**:

## 📝 Required Fields

### 1. **Privacy Policy URL**
For local testing, you can use:
- A placeholder URL: `http://localhost:3000/privacy`
- Or create a simple page: `http://localhost:3000/privacy-policy`

**Note**: For production, you'll need a real privacy policy hosted on your domain.

### 2. **Terms of Service URL**
For local testing, you can use:
- A placeholder URL: `http://localhost:3000/terms`
- Or create a simple page: `http://localhost:3000/terms-of-service`

**Note**: For production, you'll need real terms of service hosted on your domain.

### 3. **Description**
Example description you can use:
```
A trading marketplace for Roblox items. Users can browse, post, and trade in-game items with other players. This is a local development/testing application.
```

Or shorter:
```
Roblox item trading marketplace - Development/Testing
```

### 4. **Entry Link**
This is the main URL where users will land when they click your app. For local testing:
```
http://localhost:3000
```

Or:
```
http://localhost:3000/
```

### 5. **At least one scope**
You need to select at least one scope. For your trading marketplace, select:
- ✅ **openid** (required for user identification)
- ✅ **profile** (to get user profile information)

These are already in your code, so make sure they're selected in Roblox dashboard.

## 🚀 Quick Setup Steps

1. Go to: https://create.roblox.com/dashboard/credentials
2. Click on your OAuth application
3. Fill in all required fields:
   - **Privacy Policy URL**: `http://localhost:3000/privacy`
   - **Terms of Service URL**: `http://localhost:3000/terms`
   - **Description**: `Roblox item trading marketplace - Development/Testing`
   - **Entry Link**: `http://localhost:3000`
   - **Scopes**: Select `openid` and `profile`
4. **Redirect URI**: Still add `http://localhost:3000/api/auth/roblox/callback`
5. Click **Save** or **Submit for Review**

## 📄 Creating Placeholder Pages (Optional)

If Roblox validates the URLs, you can create simple placeholder pages:

### Privacy Policy Page
Create: `app/privacy/page.tsx`
```tsx
export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1>Privacy Policy</h1>
      <p>This is a placeholder privacy policy for local development.</p>
    </div>
  );
}
```

### Terms of Service Page
Create: `app/terms/page.tsx`
```tsx
export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1>Terms of Service</h1>
      <p>This is a placeholder terms of service for local development.</p>
    </div>
  );
}
```

## ⚠️ Important Notes

- These URLs are just placeholders for local testing
- Roblox may not validate localhost URLs, but you still need to fill them in
- For production, you'll need real privacy policy and terms of service pages
- The Entry Link is where users land when they access your app
- Scopes determine what information your app can access

## ✅ After Filling Required Fields

Once you've filled in all required fields:
1. Make sure **Redirect URI** is set: `http://localhost:3000/api/auth/roblox/callback`
2. Save your changes
3. Try the OAuth flow again at `/login` or `/test-oauth`

## 🔍 If Roblox Rejects Localhost URLs

If Roblox doesn't accept `localhost` URLs for Privacy Policy/Terms, you can:
1. Use placeholder URLs from a free hosting service (like GitHub Pages)
2. Or just use any valid URL format - Roblox may not validate them during local testing

