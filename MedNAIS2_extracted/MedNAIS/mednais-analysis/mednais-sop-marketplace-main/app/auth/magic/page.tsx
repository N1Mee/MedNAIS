'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

function MagicLinkContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [hasVerified, setHasVerified] = useState(false);

  useEffect(() => {
    // Prevent double verification in React Strict Mode
    if (hasVerified) return;

    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setErrorMessage('No token provided');
      return;
    }

    setHasVerified(true);
    verifyMagicLink(token);
  }, [searchParams, hasVerified]);

  const verifyMagicLink = async (token: string) => {
    try {
      const response = await fetch('/api/auth/magic-link/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        login(data.accessToken, data.user);
        
        // Redirect to dashboard after 1 second
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to verify magic link');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'verifying' && (
            <>
              <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <CardTitle className="text-2xl">Verifying...</CardTitle>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <CardTitle className="text-2xl">Success!</CardTitle>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <CardTitle className="text-2xl">Verification Failed</CardTitle>
            </>
          )}
        </CardHeader>

        <CardContent className="text-center">
          {status === 'verifying' && (
            <p className="text-gray-600">Please wait while we sign you in...</p>
          )}

          {status === 'success' && (
            <p className="text-gray-600">You're signed in! Redirecting to dashboard...</p>
          )}

          {status === 'error' && (
            <>
              <p className="text-gray-600 mb-4">{errorMessage}</p>
              <a
                href="/auth"
                className="text-blue-600 hover:underline"
              >
                Try signing in again
              </a>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function MagicLinkPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <MagicLinkContent />
    </Suspense>
  );
}
