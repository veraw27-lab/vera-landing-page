# Security Recommendations for Vera's Travel Map

## 🚨 Critical Issues to Fix

### 1. Remove Client Secret from Frontend
**Current Issue**: `clientSecret` is exposed in `auth-callback.html`
**Fix**: Remove from frontend, implement server-side token exchange

### 2. Secure Token Storage
**Current Issue**: Using `localStorage` for access tokens
**Fix**: Use `sessionStorage` with encryption or secure cookies

## 🛠 Recommended Architecture

```
GitHub Pages (Frontend)
    ↓
Netlify Functions/Vercel API (Backend)
    ↓
Instagram Graph API
```

## 📝 Implementation Steps

### Step 1: Remove Sensitive Data
```javascript
// Remove this from frontend:
const INSTAGRAM_CONFIG = {
    clientId: 'PUBLIC_OK',
    clientSecret: 'REMOVE_THIS', // ❌ Never expose
    // ...
};
```

### Step 2: Implement Secure Auth Flow
```javascript
// Frontend - only initiate auth
window.location.href = `https://api.instagram.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=user_profile,user_media&response_type=code`;

// Backend function - handle token exchange
exports.handler = async (event) => {
    const { code } = event.queryStringParameters;
    // Exchange code for token securely
    // Return only necessary data to frontend
};
```

### Step 3: Secure Token Handling
```javascript
// Use sessionStorage instead of localStorage
sessionStorage.setItem('temp_token', encryptedToken);

// Clear tokens on tab close
window.addEventListener('beforeunload', () => {
    sessionStorage.clear();
});
```

## 🔒 Additional Security Headers

Add to your `netlify.toml` or hosting config:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' https://d3js.org https://unpkg.com; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; connect-src 'self' https://graph.instagram.com;"
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

## 📊 Data Privacy Considerations

### Current Public Data
- Travel locations and dates
- Instagram post captions
- Photo URLs

### Recommendations
1. Consider making repository private
2. Implement user consent mechanisms
3. Add data retention policies
4. Provide data deletion options

## 🚀 Quick Wins

1. **Remove client secret immediately**
2. **Switch to sessionStorage**
3. **Add security headers**
4. **Implement rate limiting**
5. **Add error handling for failed auth**

## 📞 Need Help?

Consider using services like:
- **Netlify Functions** (serverless backend)
- **Vercel API Routes** (edge functions)
- **Firebase Functions** (Google Cloud)
- **AWS Lambda** (Amazon Web Services)
