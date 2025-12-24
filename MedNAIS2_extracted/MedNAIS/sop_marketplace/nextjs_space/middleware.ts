import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit, getClientIp } from './lib/rate-limiter';

// Rate limit configurations for different endpoint types
const RATE_LIMITS = {
  // Auth endpoints - stricter limits to prevent brute force
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 10 attempts per 15 minutes
  },
  // Signup endpoint - prevent spam registrations
  signup: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 signups per hour per IP
  },
  // Payment endpoints - prevent abuse
  payment: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 requests per minute
  },
  // Upload endpoints - prevent spam
  upload: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 uploads per minute
  },
  // General API endpoints
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200, // 200 requests per minute (increased for testing)
  },
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip rate limiting for static files and internal Next.js routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // Skip rate limiting for NextAuth internal endpoints (session checks, CSRF, logging)
  if (
    pathname === '/api/auth/session' ||
    pathname === '/api/auth/csrf' ||
    pathname === '/api/auth/_log' ||
    pathname === '/api/auth/providers' ||
    pathname === '/api/auth/callback/email'
  ) {
    return NextResponse.next();
  }

  // Skip rate limiting for non-API routes (except auth)
  if (!pathname.startsWith('/api') && !pathname.startsWith('/auth')) {
    return NextResponse.next();
  }

  const clientIp = getClientIp(request);

  // Determine which rate limit to apply
  let config = RATE_LIMITS.api; // Default
  let identifier = `${clientIp}:${pathname}`;

  if (pathname.startsWith('/api/signup')) {
    config = RATE_LIMITS.signup;
    identifier = `signup:${clientIp}`;
  } else if (pathname.startsWith('/api/auth/signin')) {
    // Specific rate limit for signin attempts
    config = RATE_LIMITS.auth;
    identifier = `auth:${clientIp}`;
  } else if (pathname.startsWith('/api/checkout') || pathname.startsWith('/api/webhooks')) {
    config = RATE_LIMITS.payment;
  } else if (pathname.startsWith('/api/upload')) {
    config = RATE_LIMITS.upload;
  }

  // Apply rate limit
  const result = rateLimit(identifier, config);

  // Create response
  const response = result.success
    ? NextResponse.next()
    : NextResponse.json(
        {
          error: 'Too Many Requests',
          message: 'You have exceeded the rate limit. Please try again later.',
        },
        { status: 429 }
      );

  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(result.reset).toISOString());

  return response;
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
