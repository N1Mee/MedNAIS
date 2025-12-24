/**
 * API Request Validation Utilities
 * 
 * This module provides helpers for validating API requests using Zod schemas.
 * It helps prevent common security issues like SQL injection and XSS attacks.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError, ZodSchema } from 'zod';

/**
 * Validation error response format
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate request body against a Zod schema
 * 
 * @param request - Next.js request object
 * @param schema - Zod validation schema
 * @returns Validated data or validation errors
 * 
 * @example
 * ```ts
 * const schema = z.object({
 *   email: z.string().email(),
 *   name: z.string().min(2)
 * });
 * 
 * const result = await validateRequest(request, schema);
 * if (!result.success) {
 *   return NextResponse.json(
 *     { errors: result.errors },
 *     { status: 400 }
 *   );
 * }
 * 
 * const { email, name } = result.data;
 * ```
 */
export async function validateRequest<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<
  | { success: true; data: T }
  | { success: false; errors: ValidationError[] }
> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: ValidationError[] = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return { success: false, errors };
    }
    
    // If it's not a Zod error, it might be a JSON parsing error
    return {
      success: false,
      errors: [{ field: 'body', message: 'Invalid JSON' }],
    };
  }
}

/**
 * Validate query parameters against a Zod schema
 * 
 * @param request - Next.js request object
 * @param schema - Zod validation schema
 * @returns Validated data or validation errors
 * 
 * @example
 * ```ts
 * const schema = z.object({
 *   page: z.string().regex(/^\d+$/).transform(Number).optional(),
 *   limit: z.string().regex(/^\d+$/).transform(Number).optional()
 * });
 * 
 * const result = validateQueryParams(request, schema);
 * if (!result.success) {
 *   return NextResponse.json(
 *     { errors: result.errors },
 *     { status: 400 }
 *   );
 * }
 * ```
 */
export function validateQueryParams<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  try {
    const { searchParams } = request.nextUrl;
    const params = Object.fromEntries(searchParams.entries());
    const data = schema.parse(params);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: ValidationError[] = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return { success: false, errors };
    }
    
    return {
      success: false,
      errors: [{ field: 'query', message: 'Invalid query parameters' }],
    };
  }
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  /**
   * UUID validation
   */
  uuid: z.string().uuid('Invalid UUID format'),

  /**
   * Email validation
   */
  email: z.string().email('Invalid email address'),

  /**
   * Pagination parameters
   */
  pagination: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  }),

  /**
   * Search query
   */
  search: z.object({
    q: z.string().min(1).max(100),
  }),

  /**
   * Date range
   */
  dateRange: z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  }),
};

/**
 * Sanitize string input to prevent XSS
 * Note: This is a basic sanitizer. For production, consider using a library like DOMPurify
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize file upload
 */
export const fileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().regex(/^[a-z]+\/[a-z0-9\-\+\.]+$/i),
  size: z.number().positive().max(10 * 1024 * 1024), // 10MB max
});

/**
 * Common validation error messages
 */
export const validationMessages = {
  required: 'This field is required',
  invalidEmail: 'Please enter a valid email address',
  invalidUuid: 'Invalid ID format',
  tooShort: (min: number) => `Must be at least ${min} characters`,
  tooLong: (max: number) => `Must be no more than ${max} characters`,
  invalidFormat: 'Invalid format',
  invalidUrl: 'Please enter a valid URL',
};

/**
 * Create error response for validation failures
 */
export function createValidationErrorResponse(errors: ValidationError[]) {
  return NextResponse.json(
    {
      error: 'Validation failed',
      errors,
    },
    { status: 400 }
  );
}

/**
 * Middleware helper to validate request and return error response if validation fails
 * 
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const schema = z.object({ name: z.string() });
 *   
 *   const validation = await validateRequest(request, schema);
 *   if (!validation.success) {
 *     return createValidationErrorResponse(validation.errors);
 *   }
 *   
 *   const { name } = validation.data;
 *   // ... rest of handler
 * }
 * ```
 */
