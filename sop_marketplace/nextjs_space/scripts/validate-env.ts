#!/usr/bin/env tsx
/**
 * Environment Variables Validation Script
 * 
 * Проверяет наличие и корректность всех необходимых environment variables
 * перед production deployment.
 * 
 * Usage:
 *   yarn validate-env
 *   yarn validate-env --mode=production
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const envPath = process.env.ENV_FILE || '.env';
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`\u2705 Loaded environment from: ${envPath}`);
} else {
  console.error(`\u274c Environment file not found: ${envPath}`);
  process.exit(1);
}

const mode = process.argv.find(arg => arg.startsWith('--mode='))?.split('=')[1] || 'development';
console.log(`\n\ud83d\udd0d Validating environment variables for: ${mode.toUpperCase()} mode\n`);

// Define required variables
interface EnvVar {
  name: string;
  required: boolean;
  production?: boolean; // Required only in production
  validate?: (value: string) => boolean;
  description: string;
  example?: string;
}

const envVars: EnvVar[] = [
  // Database
  {
    name: 'DATABASE_URL',
    required: true,
    validate: (val) => val.startsWith('postgresql://') || val.startsWith('postgres://'),
    description: 'PostgreSQL connection string',
    example: 'postgresql://user:password@localhost:5432/dbname',
  },

  // NextAuth
  {
    name: 'NEXTAUTH_SECRET',
    required: true,
    validate: (val) => val.length >= 32,
    description: 'NextAuth secret key (min 32 characters)',
    example: 'openssl rand -base64 32',
  },
  {
    name: 'NEXTAUTH_URL',
    required: true,
    production: true,
    validate: (val) => val.startsWith('http://') || val.startsWith('https://'),
    description: 'Application URL',
    example: 'https://yourdomain.com',
  },

  // Email Provider (Production only)
  {
    name: 'EMAIL_SERVER_HOST',
    required: false,
    production: true,
    description: 'SMTP server host',
    example: 'smtp.resend.com',
  },
  {
    name: 'EMAIL_SERVER_PORT',
    required: false,
    production: true,
    validate: (val) => !isNaN(parseInt(val)) && parseInt(val) > 0,
    description: 'SMTP server port',
    example: '587 or 465',
  },
  {
    name: 'EMAIL_SERVER_USER',
    required: false,
    production: true,
    description: 'SMTP username',
    example: 'resend or apikey',
  },
  {
    name: 'EMAIL_SERVER_PASSWORD',
    required: false,
    production: true,
    description: 'SMTP password/API key',
    example: 'your_api_key',
  },
  {
    name: 'EMAIL_FROM',
    required: false,
    production: true,
    validate: (val) => val.includes('@'),
    description: 'From email address',
    example: 'noreply@yourdomain.com',
  },

  // Stripe
  {
    name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    required: true,
    validate: (val) => val.startsWith('pk_'),
    description: 'Stripe publishable key',
    example: 'pk_live_... or pk_test_...',
  },
  {
    name: 'STRIPE_SECRET_KEY',
    required: true,
    validate: (val) => val.startsWith('sk_'),
    description: 'Stripe secret key',
    example: 'sk_live_... or sk_test_...',
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    required: false,
    production: true,
    validate: (val) => val.startsWith('whsec_'),
    description: 'Stripe webhook signing secret',
    example: 'whsec_...',
  },

  // AWS S3
  {
    name: 'AWS_BUCKET_NAME',
    required: true,
    description: 'S3 bucket name',
    example: 'your-bucket-name',
  },
  {
    name: 'AWS_FOLDER_PREFIX',
    required: false,
    description: 'S3 folder prefix (optional)',
    example: 'uploads/',
  },

  // Abacus AI (for document-to-SOP generation)
  {
    name: 'ABACUSAI_API_KEY',
    required: false,
    description: 'Abacus AI API key for SOP generation',
    example: 'your_abacus_api_key',
  },
];

// Validation results
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}

const result: ValidationResult = {
  valid: true,
  errors: [],
  warnings: [],
  info: [],
};

// Validate each variable
envVars.forEach((envVar) => {
  const value = process.env[envVar.name];
  const isProduction = mode === 'production';
  const isRequired = envVar.required || (isProduction && envVar.production);

  // Check if variable exists
  if (!value || value === '') {
    if (isRequired) {
      result.valid = false;
      result.errors.push(
        `\u274c ${envVar.name}: MISSING (required${envVar.production ? ' in production' : ''})`
      );
      result.info.push(`   Description: ${envVar.description}`);
      if (envVar.example) {
        result.info.push(`   Example: ${envVar.example}`);
      }
    } else {
      result.warnings.push(`\u26a0\ufe0f  ${envVar.name}: Not set (optional)`);
    }
    return;
  }

  // Validate value format
  if (envVar.validate && !envVar.validate(value)) {
    result.valid = false;
    result.errors.push(`\u274c ${envVar.name}: INVALID FORMAT`);
    result.info.push(`   Description: ${envVar.description}`);
    if (envVar.example) {
      result.info.push(`   Example: ${envVar.example}`);
    }
    return;
  }

  // Success
  result.info.push(`\u2705 ${envVar.name}: Set and valid`);
});

// Check for mode-specific configurations
if (mode === 'production') {
  // Check Stripe keys are live mode
  const stripePub = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const stripeSecret = process.env.STRIPE_SECRET_KEY;

  if (stripePub && stripePub.startsWith('pk_test_')) {
    result.warnings.push(
      '⚠️  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: Using TEST key in production mode!'
    );
  }
  if (stripeSecret && stripeSecret.startsWith('sk_test_')) {
    result.warnings.push(
      '\u26a0\ufe0f  STRIPE_SECRET_KEY: Using TEST key in production mode!'
    );
  }

  // Check NEXTAUTH_URL is HTTPS
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  if (nextAuthUrl && !nextAuthUrl.startsWith('https://')) {
    result.warnings.push(
      '\u26a0\ufe0f  NEXTAUTH_URL: Production should use HTTPS!'
    );
  }

  // Check if email is configured
  const emailConfigured =
    process.env.EMAIL_SERVER_HOST &&
    process.env.EMAIL_SERVER_PORT &&
    process.env.EMAIL_SERVER_USER &&
    process.env.EMAIL_SERVER_PASSWORD &&
    process.env.EMAIL_FROM;

  if (!emailConfigured) {
    result.warnings.push(
      '\u26a0\ufe0f  Email configuration incomplete. Magic links will only work in console.'
    );
    result.info.push('   See EMAIL_SETUP_GUIDE.md for configuration instructions.');
  }

  // Check if webhook is configured
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    result.warnings.push(
      '\u26a0\ufe0f  STRIPE_WEBHOOK_SECRET: Not set. Webhook verification will fail!'
    );
    result.info.push('   See STRIPE_PRODUCTION_SETUP.md for webhook configuration.');
  }
}

// Print results
console.log('\n' + '='.repeat(80));
console.log('VALIDATION RESULTS');
console.log('='.repeat(80) + '\n');

if (result.errors.length > 0) {
  console.log('\ud83d\udd34 ERRORS:\n');
  result.errors.forEach((err) => console.log(err));
  console.log('');
}

if (result.warnings.length > 0) {
  console.log('\ud83d\udfe1 WARNINGS:\n');
  result.warnings.forEach((warn) => console.log(warn));
  console.log('');
}

if (result.info.length > 0 && (result.errors.length > 0 || result.warnings.length > 0)) {
  console.log('\ud83d\udcdd INFO:\n');
  result.info.forEach((info) => console.log(info));
  console.log('');
}

console.log('='.repeat(80));

if (result.valid) {
  console.log('\u2705 Environment validation PASSED');
  if (result.warnings.length > 0) {
    console.log('\u26a0\ufe0f  But there are warnings - please review them above.');
  }
  console.log('='.repeat(80) + '\n');
  process.exit(0);
} else {
  console.log('\u274c Environment validation FAILED');
  console.log('Please fix the errors above before proceeding.');
  console.log('='.repeat(80) + '\n');
  process.exit(1);
}