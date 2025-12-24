# OAuth Setup Guide for MedNAIS

This guide explains how to configure OAuth authentication providers (Google and Apple) for the MedNAIS SOP Marketplace.

## Table of Contents

- [Google OAuth Setup](#google-oauth-setup)
- [Apple Sign In Setup](#apple-sign-in-setup)
- [Environment Variables](#environment-variables)
- [Implementation Status](#implementation-status)

---

## Google OAuth Setup

### Prerequisites
- A Google Cloud Platform account
- A verified email address

### Steps

#### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `MedNAIS` (or your preferred name)
4. Click "Create"

#### 2. Enable Google+ API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and press "Enable"

#### 3. Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" (unless you have a Google Workspace)
3. Fill in the required information:
   - **App name**: MedNAIS SOP Marketplace
   - **User support email**: your email
   - **Developer contact information**: your email
4. Add scopes:
   - `userinfo.email`
   - `userinfo.profile`
   - `openid`
5. Add test users (for development)
6. Save and continue

#### 4. Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Web application"
4. Configure:
   - **Name**: MedNAIS Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for local development)
     - `https://yourdomain.com` (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://yourdomain.com/api/auth/callback/google`
5. Click "Create"
6. **IMPORTANT**: Save the Client ID and Client Secret

#### 5. Update Environment Variables

Add to your `.env` file:

```bash
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

---

## Apple Sign In Setup

### Prerequisites
- An Apple Developer account ($99/year)
- A verified domain

### Steps

#### 1. Register an App ID

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to "Certificates, Identifiers & Profiles"
3. Click "Identifiers" → "+" button
4. Select "App IDs" and click "Continue"
5. Choose "App" and click "Continue"
6. Fill in:
   - **Description**: MedNAIS SOP Marketplace
   - **Bundle ID**: com.mednais.marketplace (or your preferred)
7. Enable "Sign in with Apple"
8. Click "Continue" and "Register"

#### 2. Create a Services ID

1. In "Identifiers", click "+" button
2. Select "Services IDs" and click "Continue"
3. Fill in:
   - **Description**: MedNAIS Web Authentication
   - **Identifier**: com.mednais.marketplace.web
4. Enable "Sign in with Apple"
5. Click "Configure"
6. Add domains and return URLs:
   - **Domains**: `yourdomain.com`
   - **Return URLs**: 
     - `http://localhost:3000/api/auth/callback/apple` (development)
     - `https://yourdomain.com/api/auth/callback/apple` (production)
7. Click "Save", "Continue", and "Register"

#### 3. Create a Key for Sign in with Apple

1. Go to "Keys" section
2. Click "+" button
3. Fill in:
   - **Key Name**: MedNAIS Apple Sign In Key
4. Enable "Sign in with Apple"
5. Click "Configure" → select your App ID
6. Click "Save", "Continue", and "Register"
7. **IMPORTANT**: Download the key file (`.p8`) - you can only download it once!
8. Note the **Key ID**

#### 4. Get Your Team ID

1. Go to your [Apple Developer Account](https://developer.apple.com/account/)
2. Find your **Team ID** in the top right corner (10 characters, e.g., "ABCDE12345")

#### 5. Update Environment Variables

Add to your `.env` file:

```bash
APPLE_CLIENT_ID="com.mednais.marketplace.web"
APPLE_TEAM_ID="ABCDE12345"
APPLE_KEY_ID="FGHIJ67890"
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
-----END PRIVATE KEY-----"
```

**Note**: For the private key, you can either:
- Copy the entire content of the `.p8` file
- Or read it from a file path in your code

---

## Environment Variables

After completing the setup, your `.env` file should include:

```bash
# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

APPLE_CLIENT_ID="com.mednais.marketplace.web"
APPLE_TEAM_ID="ABCDE12345"
APPLE_KEY_ID="FGHIJ67890"
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----"
```

---

## Implementation Status

### ✅ Implemented

- Email/password authentication (Magic Link)
- JWT token management
- Session handling
- User profile management

### ⚠️ Partially Implemented

- Google OAuth (UI ready, backend integration needed)
- Apple Sign In (UI ready, backend integration needed)

### 🔨 Next Steps

To complete OAuth implementation:

1. **Install required packages**:
   ```bash
   npm install next-auth @auth/core
   # Or use alternative OAuth libraries
   ```

2. **Create OAuth API routes**:
   - `/app/api/auth/callback/google/route.ts`
   - `/app/api/auth/callback/apple/route.ts`

3. **Update OAuth handler** (`lib/auth/oauth.ts`):
   - Implement Google OAuth flow
   - Implement Apple Sign In flow
   - Handle token exchange
   - Create/update user in database

4. **Update auth page** (`app/auth/page.tsx`):
   - Wire up OAuth buttons
   - Handle OAuth redirects
   - Display error messages

5. **Test thoroughly**:
   - Test both providers in development
   - Test on production domain
   - Test error scenarios
   - Test user profile sync

---

## Security Considerations

1. **Never commit secrets to git**
   - Use `.env` files (gitignored)
   - Use environment variables in production

2. **Validate OAuth responses**
   - Verify state parameter
   - Check token signatures
   - Validate user email

3. **Handle errors gracefully**
   - Show user-friendly error messages
   - Log errors for debugging
   - Provide fallback authentication

4. **Production checklist**:
   - Use HTTPS only
   - Set proper CORS headers
   - Implement rate limiting
   - Monitor authentication logs

---

## Troubleshooting

### Google OAuth Issues

**Error**: "redirect_uri_mismatch"
- **Solution**: Make sure redirect URI in Google Console matches exactly

**Error**: "invalid_client"
- **Solution**: Check CLIENT_ID and CLIENT_SECRET are correct

### Apple Sign In Issues

**Error**: "invalid_client"
- **Solution**: Verify Service ID, Team ID, and Key ID match

**Error**: "invalid_request"
- **Solution**: Check domain verification and return URLs

---

## Resources

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign In Documentation](https://developer.apple.com/documentation/sign_in_with_apple)
- [Next.js Authentication](https://nextjs.org/docs/authentication)
- [NextAuth.js](https://next-auth.js.org/)

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review OAuth provider documentation
3. Check application logs for detailed errors
4. Contact the development team

---

**Last Updated**: December 11, 2025
