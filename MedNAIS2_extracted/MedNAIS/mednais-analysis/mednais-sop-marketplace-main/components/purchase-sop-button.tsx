'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DollarSign, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PurchaseSOPButtonProps {
  sopId: string;
  price: number;
  sopTitle: string;
}

export function PurchaseSOPButton({ sopId, price, sopTitle }: PurchaseSOPButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const formatPrice = (priceInCents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(priceInCents / 100);
  };

  const handlePurchase = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('[Purchase] Starting purchase flow for SOP:', sopId);

      // Get current origin for success/cancel URLs
      const originUrl = window.location.origin;
      console.log('[Purchase] Origin URL:', originUrl);

      // Call backend API to create checkout session
      console.log('[Purchase] Calling API...');
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: Include cookies
        body: JSON.stringify({
          sop_id: sopId,
          origin_url: originUrl,
        }),
      });

      console.log('[Purchase] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Purchase] API error:', errorData);
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const data = await response.json();
      console.log('[Purchase] Success! Session ID:', data.session_id);
      console.log('[Purchase] Redirect URL:', data.url);

      // Redirect to Stripe Checkout
      if (data.url) {
        console.log('[Purchase] Redirecting to Stripe...');
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err: any) {
      console.error('[Purchase] Error:', err);
      setError(err.message || 'Failed to initiate purchase');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handlePurchase}
        disabled={isLoading}
        size="lg"
        className="w-full bg-green-600 hover:bg-green-700 text-white"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <DollarSign className="h-5 w-5 mr-2" />
            Purchase for {formatPrice(price)}
          </>
        )}
      </Button>
      
      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}
