import { jwtVerify, createRemoteJWKSet } from 'jose';

/**
 * Google OAuth token payload
 */
export interface GoogleTokenPayload {
  sub: string; // Google user ID
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

/**
 * Apple OAuth token payload
 */
export interface AppleTokenPayload {
  sub: string; // Apple user ID
  email?: string; // May be hidden/relay email
  email_verified?: boolean;
  is_private_email?: boolean;
}

/**
 * Verify Google ID token
 */
export async function verifyGoogleToken(idToken: string): Promise<GoogleTokenPayload | null> {
  try {
    const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
    
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    return payload as GoogleTokenPayload;
  } catch (error) {
    console.error('Google token verification failed:', error);
    return null;
  }
}

/**
 * Verify Apple ID token
 */
export async function verifyAppleToken(idToken: string): Promise<AppleTokenPayload | null> {
  try {
    const JWKS = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
    
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: 'https://appleid.apple.com',
      audience: process.env.APPLE_CLIENT_ID,
    });

    return payload as AppleTokenPayload;
  } catch (error) {
    console.error('Apple token verification failed:', error);
    return null;
  }
}
