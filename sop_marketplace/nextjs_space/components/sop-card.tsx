
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Clock, DollarSign, User, ShoppingCart, Check, Star } from "lucide-react";
import { toast } from "sonner";

interface SOPCardProps {
  sop: {
    id: string;
    title: string;
    description?: string | null;
    price: number;
    createdAt?: string | Date;
    author: {
      id: string;
      name?: string | null;
      image?: string | null;
    };
    category?: {
      name: string;
    } | null;
    _count?: {
      steps: number;
    };
  };
}

export function SOPCard({ sop }: SOPCardProps) {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [addingToCart, setAddingToCart] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [rating, setRating] = useState<{ average: number; count: number } | null>(null);

  // Fetch rating for this SOP
  useEffect(() => {
    const fetchRating = async () => {
      try {
        const response = await fetch(`/api/ratings?sopId=${sop.id}`);
        if (response.ok) {
          const data = await response.json();
          setRating({
            average: data.averageRating || 0,
            count: data.totalRatings || 0,
          });
        }
      } catch (error) {
        console.error("Failed to fetch rating:", error);
      }
    };
    fetchRating();
  }, [sop.id]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      toast.error("Please sign in to add items to cart");
      return;
    }

    if (sop.price === 0) {
      toast.info("Free SOPs don't need to be added to cart");
      return;
    }

    try {
      setAddingToCart(true);
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sopId: sop.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add to cart");
      }

      setInCart(true);
      toast.success("Added to cart!");
      
      // Trigger cart update event for header
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      toast.error(error.message || "Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <div className="group block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 h-full flex flex-col">
      <Link href={`/sops/${sop.id}`} className="flex-1 flex flex-col">
        <div className="relative aspect-video bg-gradient-to-br from-[#E63946]/10 to-[hsl(215,28%,17%)]/10">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#E63946] opacity-20">
                SOP
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-[#E63946] transition">
            {sop.title}
          </h3>

          {sop.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
              {sop.description}
            </p>
          )}

          {/* Category badge - moved here from top of image */}
          {sop.category && (
            <div className="mb-3">
              <span className="inline-block bg-red-50 dark:bg-red-900/20 text-[#E63946] dark:text-red-400 px-2 py-1 rounded text-xs font-medium truncate max-w-full">
                {sop.category.name}
              </span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {/* Author name - clickable */}
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/profile/${sop.author?.id}`);
              }}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-[#E63946] dark:hover:text-[#E63946] transition w-fit cursor-pointer"
            >
              <User className="h-4 w-4" />
              <span>{sop.author?.name || "Anonymous"}</span>
            </div>

            {/* Rating stars - clickable to go to reviews */}
            {rating && rating.count > 0 && (
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/sops/${sop.id}#ratings`);
                }}
                className="flex items-center gap-1 w-fit hover:opacity-80 transition cursor-pointer"
              >
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    className={`h-4 w-4 ${
                      index < Math.round(rating.average)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 dark:text-gray-600"
                    }`}
                  />
                ))}
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                  ({rating.count})
                </span>
              </div>
            )}

            {/* Steps count */}
            {sop._count && (
              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                <span>{sop._count.steps} steps</span>
              </div>
            )}

            {/* Created date */}
            {sop.createdAt && (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                <span>
                  Added{" "}
                  {new Date(sop.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>

      <div className="px-4 pb-4 mt-auto">
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-[#E63946] font-bold text-lg">
            <DollarSign className="h-5 w-5" />
            <span>{sop.price === 0 ? "Free" : sop.price.toFixed(2)}</span>
          </div>

          {sop.price > 0 && session && (
            <button
              onClick={handleAddToCart}
              disabled={addingToCart || inCart}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm font-medium ${
                inCart
                  ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-[#E63946] text-white hover:bg-[#E63946]/90"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {inCart ? (
                <>
                  <Check className="h-4 w-4" />
                  In Cart
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
