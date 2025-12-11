'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, ShoppingCart, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart/CartContext';

interface CartItem {
  id: string;
  sopId: string;
  sop: {
    id: string;
    title: string;
    description: string;
    price: number;
    creator: {
      name: string;
      email: string;
    };
  };
}

interface Cart {
  id: string;
  items: CartItem[];
}

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoValidating, setPromoValidating] = useState(false);
  const [promoApplied, setPromoApplied] = useState<any>(null);
  const [promoError, setPromoError] = useState('');
  const router = useRouter();
  const { refreshCart } = useCart();

  const loadCart = async () => {
    try {
      const response = await fetch('/api/cart', {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth');
          return;
        }
        throw new Error('Failed to load cart');
      }

      const data = await response.json();
      setCart(data.cart);
    } catch (error) {
      console.error('Load cart error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const removeItem = async (sopId: string) => {
    try {
      setRemovingItemId(sopId);

      const response = await fetch(`/api/cart?sopId=${sopId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to remove item');
      }

      // Reload cart
      await loadCart();
      
      // Update cart count in header
      await refreshCart();
    } catch (error) {
      console.error('Remove item error:', error);
    } finally {
      setRemovingItemId(null);
    }
  };

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) return;

    try {
      setIsCheckingOut(true);

      // Create checkout session for all items
      const response = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          origin_url: window.location.origin,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create checkout');
      }

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error.message || 'Failed to proceed to checkout');
      setIsCheckingOut(false);
    }
  };

  const total = cart?.items.reduce((sum, item) => sum + (item.sop.price || 0), 0) || 0;

  const formatPrice = (priceInCents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(priceInCents / 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="text-gray-600 mt-2">
              {cart?.items.length || 0} {cart?.items.length === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>

          {!cart || cart.items.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Your cart is empty
                </h2>
                <p className="text-gray-600 mb-6">
                  Browse the marketplace to find SOPs to purchase
                </p>
                <Button asChild>
                  <Link href="/marketplace">
                    Browse Marketplace
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cart.items.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between">
                        <div className="flex-1">
                          <Link
                            href={`/sops/${item.sop.id}`}
                            className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                          >
                            {item.sop.title}
                          </Link>
                          <p className="text-gray-600 text-sm mt-1">
                            {item.sop.description}
                          </p>
                          <p className="text-gray-500 text-sm mt-2">
                            by {item.sop.creator.name || item.sop.creator.email}
                          </p>
                        </div>
                        <div className="flex flex-col items-end justify-between ml-4">
                          <div className="text-xl font-bold text-green-600">
                            {formatPrice(item.sop.price)}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.sopId)}
                            disabled={removingItemId === item.sopId}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {removingItemId === item.sopId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remove
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal ({cart.items.length} items)</span>
                        <span>{formatPrice(total)}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span className="text-green-600">{formatPrice(total)}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleCheckout}
                      disabled={isCheckingOut}
                    >
                      {isCheckingOut ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Proceed to Checkout
                          <ArrowRight className="h-5 w-5 ml-2" />
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full"
                      asChild
                    >
                      <Link href="/marketplace">
                        Continue Shopping
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
