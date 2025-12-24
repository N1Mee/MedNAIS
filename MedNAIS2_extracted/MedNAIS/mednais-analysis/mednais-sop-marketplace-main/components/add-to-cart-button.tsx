'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart/CartContext';

interface AddToCartButtonProps {
  sopId: string;
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  showIcon?: boolean;
}

export function AddToCartButton({ 
  sopId, 
  variant = 'default',
  size = 'default',
  showIcon = true 
}: AddToCartButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { refreshCart } = useCart();

  const handleAddToCart = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ sopId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add to cart');
      }

      setIsAdded(true);
      
      // Refresh cart count in header
      await refreshCart();
      
      // Reset after 2 seconds
      setTimeout(() => {
        setIsAdded(false);
      }, 2000);
    } catch (err: any) {
      console.error('Add to cart error:', err);
      setError(err.message);
      
      // If unauthorized, redirect to login
      if (err.message.includes('Unauthorized') || err.message.includes('401')) {
        router.push('/auth');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isAdded) {
    return (
      <Button variant="outline" size={size} disabled className="text-green-600">
        <Check className="h-4 w-4 mr-2" />
        Added
      </Button>
    );
  }

  return (
    <div className="space-y-1">
      <Button
        onClick={handleAddToCart}
        disabled={isLoading}
        variant={variant}
        size={size}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Adding...
          </>
        ) : (
          <>
            {showIcon && <ShoppingCart className="h-4 w-4 mr-2" />}
            Add to Cart
          </>
        )}
      </Button>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
