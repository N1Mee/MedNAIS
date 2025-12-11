
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface CartItem {
  id: string;
  sopId: string;
  createdAt: string;
  sop: {
    id: string;
    title: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
    author: {
      id: string;
      name: string | null;
    };
    category: {
      name: string;
    } | null;
  };
}

export function CartClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [promoCode, setPromoCode] = useState("");

  useEffect(() => {
    fetchCart();

    // Check for payment status
    const payment = searchParams.get("payment");
    if (payment === "success") {
      toast.success("Payment successful! 🎉");
      // Clear cart after successful payment
      clearCart();
    } else if (payment === "cancelled") {
      toast.info("Payment cancelled");
    }
  }, [searchParams]);

  const fetchCart = async () => {
    try {
      const response = await fetch("/api/cart");
      if (!response.ok) {
        throw new Error("Failed to fetch cart");
      }
      const data = await response.json();
      setCartItems(data);
    } catch (error) {
      console.error("Error fetching cart:", error);
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (cartItemId: string) => {
    try {
      const response = await fetch(`/api/cart/${cartItemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove item");
      }

      setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
      toast.success("Item removed from cart");
      
      // Trigger cart update event for header
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item");
    }
  };

  const clearCart = async () => {
    try {
      const response = await fetch("/api/cart", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to clear cart");
      }

      setCartItems([]);
      toast.success("Cart cleared");
      
      // Trigger cart update event for header
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast.error("Failed to clear cart");
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    try {
      setCheckoutLoading(true);
      const response = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sopIds: cartItems.map((item) => item.sopId),
          promoCode: promoCode || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create checkout session");
      }

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error.message || "Failed to checkout");
      setCheckoutLoading(false);
    }
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + item.sop.price, 0);

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#E63946]" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
          <ShoppingCart className="h-8 w-8 text-[#E63946]" />
          Shopping Cart
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {cartItems.length} {cartItems.length === 1 ? "item" : "items"} in your
          cart
        </p>
      </div>

      {cartItems.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start adding SOPs to your cart to get started
          </p>
          <Link
            href="/marketplace"
            className="inline-flex items-center px-6 py-3 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition"
          >
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex gap-4"
              >
                {/* SOP Image */}
                <div className="flex-shrink-0 w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                  {item.sop.imageUrl ? (
                    <Image
                      src={item.sop.imageUrl}
                      alt={item.sop.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <ShoppingCart className="h-8 w-8" />
                    </div>
                  )}
                </div>

                {/* SOP Info */}
                <div className="flex-1">
                  <Link
                    href={`/sops/${item.sop.id}`}
                    className="text-lg font-semibold hover:text-[#E63946] transition"
                  >
                    {item.sop.title}
                  </Link>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    by {item.sop.author.name}
                  </p>
                  {item.sop.category && (
                    <span className="inline-block mt-2 px-2 py-1 bg-[#E63946]/10 text-[#E63946] text-xs rounded-full text-center">
                      {item.sop.category.name}
                    </span>
                  )}
                </div>

                {/* Price and Remove */}
                <div className="flex flex-col items-end justify-between">
                  <span className="text-2xl font-bold text-[#E63946]">
                    ${item.sop.price.toFixed(2)}
                  </span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Checkout Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>

              {/* Promo Code */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Promo Code (Optional)
                </label>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Enter promo code"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#E63946] focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                />
                {promoCode && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    ✓ Promo code "{promoCode}" will be applied at checkout
                  </p>
                )}
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    Subtotal ({cartItems.length} items)
                  </span>
                  <span className="font-medium">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-[#E63946]">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Proceed to Checkout
                  </>
                )}
              </button>

              <button
                onClick={clearCart}
                disabled={checkoutLoading}
                className="w-full mt-3 px-6 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                Clear Cart
              </button>

              {/* Payment Info */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-300">
                      Secure Payment
                    </p>
                    <p className="text-blue-700 dark:text-blue-400 mt-1">
                      Your payment is processed securely through Stripe
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
