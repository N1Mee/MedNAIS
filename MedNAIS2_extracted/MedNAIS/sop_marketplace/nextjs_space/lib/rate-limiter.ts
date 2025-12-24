// Simple in-memory rate limiter for API endpoints
// For production, consider using Redis-based solution (e.g., @upstash/ratelimit)

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Rate limiter using in-memory storage
 * @param identifier - Unique identifier (e.g., IP address or user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result with success status and metadata
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  }
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    // First request or window expired, create new entry
    const resetTime = now + config.windowMs;
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime,
    });

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      reset: resetTime,
    };
  }

  // Window is active
  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  rateLimitMap.set(identifier, entry);

  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    reset: entry.resetTime,
  };
}

/**
 * Get the client IP address from the request
 * @param request - Next.js request object
 * @returns IP address or 'unknown'
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}
