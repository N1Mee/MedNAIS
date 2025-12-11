'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AddToCartButton } from '@/components/add-to-cart-button';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

interface SOPPurchaseSectionProps {
  sopId: string;
  sopPrice: number | null;
  sopTitle: string;
  sopType: string;
  hasAccess: boolean;
}

export function SOPPurchaseSection({
  sopId,
  sopPrice,
  sopTitle,
  sopType,
  hasAccess: serverHasAccess,
}: SOPPurchaseSectionProps) {
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Check if user is authenticated by checking for refresh token cookie
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });
        setIsAuthenticated(response.ok);
      } catch {
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, []);

  // Don't show anything if user already has access
  if (serverHasAccess) {
    return null;
  }

  // Server-side render: show loading state
  if (!isClient) {
    return (
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-blue-800 font-medium mb-2">
              Loading...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          {sopType === 'MARKETPLACE' && (
            <>
              <div className="flex items-center justify-center mb-2">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                🔒 Limited Preview
              </h3>
              <p className="text-gray-700">
                You're viewing a preview with only the first 2 steps. Purchase to unlock all {sopTitle && 'steps'} and execute this SOP.
              </p>
              
              {isAuthenticated && sopPrice && (
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                  <div className="text-2xl font-bold text-green-600">
                    ${(sopPrice / 100).toFixed(2)}
                  </div>
                  <AddToCartButton sopId={sopId} variant="default" size="lg" />
                  <Button asChild variant="outline" size="lg">
                    <Link href="/cart">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      View Cart
                    </Link>
                  </Button>
                </div>
              )}
              
              {!isAuthenticated && (
                <Button asChild size="lg">
                  <Link href="/auth">
                    Sign In to Purchase
                  </Link>
                </Button>
              )}
            </>
          )}
          
          {sopType === 'PERSONAL' && (
            <p className="text-gray-700">This is a personal SOP and is not publicly accessible.</p>
          )}
          
          {sopType === 'GROUP' && (
            <p className="text-gray-700">This SOP is only available to group members.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
