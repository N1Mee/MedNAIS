
"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import {
  Clock,
  DollarSign,
  User,
  Mail,
  Edit,
  Trash,
  Calendar,
  Tag,
  Lock,
  ShoppingCart,
  Play,
  Paperclip,
  FileText,
  Download,
} from "lucide-react";
import { SOPCard } from "@/components/sop-card";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { downloadFile } from "@/lib/s3";
import { useState, useEffect } from "react";
import { RatingsSection } from "./_components/ratings-section";
import { CommentsSection } from "./_components/comments-section";

interface SOPDetailClientProps {
  sop: any;
  relatedSOPs: any[];
  hasFullAccess: boolean;
}

export function SOPDetailClient({ sop, relatedSOPs, hasFullAccess }: SOPDetailClientProps) {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuthor = session?.user?.id === sop.author.id;
  const isPaid = sop.price > 0;

  // Handle payment verification on success redirect
  useEffect(() => {
    const payment = searchParams?.get("payment");
    const sessionId = searchParams?.get("session_id");
    
    if (payment === "success" && sessionId) {
      verifyAndCompletePayment(sessionId);
    } else if (payment === "cancelled") {
      toast.info("Payment cancelled");
    }
  }, [searchParams]);

  const verifyAndCompletePayment = async (sessionId: string) => {
    try {
      console.log("🔍 Verifying payment for session:", sessionId);
      
      const response = await fetch("/api/payments/verify-and-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log("✅ Payment verified:", data);
        toast.success("Payment successful! 🎉 Refreshing page...");
        // Refresh the page to show unlocked content
        setTimeout(() => {
          window.location.href = `/sops/${sop.id}`;
        }, 1500);
      } else {
        console.warn("⚠️ Payment verification issue:", data);
        toast.success("Payment received! Please refresh if content doesn't unlock.");
      }
    } catch (error) {
      console.error("❌ Payment verification error:", error);
      toast.error("Payment completed but verification failed. Please refresh the page.");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this SOP?")) return;

    try {
      const response = await fetch(`/api/sops/${sop.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("SOP deleted successfully");
        router.push("/my-sops");
      } else {
        toast.error("Failed to delete SOP");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("An error occurred");
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {sop.category && (
                <Link
                  href={`/categories/${sop.category.slug}`}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-[#E63946]/10 text-[#E63946] rounded-full text-sm font-medium hover:bg-[#E63946]/20 transition"
                >
                  <Tag className="h-3 w-3" />
                  {sop.category.name}
                </Link>
              )}
            </div>
            <h1 className="text-4xl font-bold mb-4">{sop.title}</h1>
            {sop.description && (
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {sop.description}
              </p>
            )}
          </div>

          <div className="hidden sm:flex flex-row flex-wrap items-center gap-2">
            {/* Run SOP button - visible to author and users who have access */}
            {hasFullAccess && (
              <Link
                href={`/sops/${sop.id}/run`}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
              >
                <Play className="h-4 w-4" />
                Run SOP
              </Link>
            )}
            
            {/* Buy SOP button - visible to non-authors for paid SOPs (DESKTOP ONLY) */}
            {!isAuthor && isPaid && !hasFullAccess && session?.user && (
              <button
                onClick={async () => {
                  try {
                    const response = await fetch("/api/cart", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ sopId: sop.id }),
                    });

                    if (!response.ok) {
                      const error = await response.json();
                      throw new Error(error.error || "Failed to add to cart");
                    }

                    toast.success("Added to cart!");
                    window.dispatchEvent(new Event('cartUpdated'));
                    router.push("/cart");
                  } catch (error: any) {
                    console.error("Add to cart error:", error);
                    toast.error(error.message || "Failed to add to cart");
                  }
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition font-medium"
              >
                <ShoppingCart className="h-4 w-4" />
                Buy SOP
              </button>
            )}
            
            {isAuthor && (
              <>
                <Link
                  href={`/sops/${sop.id}/edit`}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Link>
                <button
                  onClick={handleDelete}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  <Trash className="h-4 w-4" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* Info Row - Always Horizontal */}
        <div className="flex flex-wrap gap-4 sm:gap-6 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              Created {new Date(sop.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{sop.steps.length} steps</span>
          </div>
          <div className="flex items-center gap-2 text-[#E63946] font-bold text-lg">
            <DollarSign className="h-5 w-5" />
            <span>{sop.price === 0 ? "Free" : `$${sop.price.toFixed(2)}`}</span>
          </div>
        </div>
        
        {/* Mobile Action Buttons - Full Width, Below Price */}
        <div className="mt-4 sm:hidden space-y-2">
          {/* Run SOP button for mobile */}
          {hasFullAccess && (
            <Link
              href={`/sops/${sop.id}/run`}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-lg shadow-lg"
            >
              <Play className="h-5 w-5" />
              Run SOP
            </Link>
          )}
          
          {/* Buy SOP button for mobile */}
          {!isAuthor && isPaid && !hasFullAccess && session?.user && (
            <button
              onClick={async () => {
                try {
                  const response = await fetch("/api/cart", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ sopId: sop.id }),
                  });

                  if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || "Failed to add to cart");
                  }

                  toast.success("Added to cart!");
                  window.dispatchEvent(new Event('cartUpdated'));
                  router.push("/cart");
                } catch (error: any) {
                  console.error("Add to cart error:", error);
                  toast.error(error.message || "Failed to add to cart");
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition font-semibold text-lg shadow-lg"
            >
              <ShoppingCart className="h-5 w-5" />
              Buy SOP for ${sop.price.toFixed(2)}
            </button>
          )}
          
          {/* Edit/Delete buttons for author on mobile */}
          {isAuthor && (
            <>
              <Link
                href={`/sops/${sop.id}/edit`}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition font-semibold text-lg shadow-lg"
              >
                <Edit className="h-5 w-5" />
                Edit SOP
              </Link>
              <button
                onClick={handleDelete}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold text-lg shadow-lg"
              >
                <Trash className="h-5 w-5" />
                Delete SOP
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-6">Steps</h2>

            {sop.steps.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">
                No steps added yet.
              </p>
            ) : (
              <div className="space-y-6">
                {sop.steps.map((step: any, index: number) => (
                  <div key={step.id}>
                    <StepDisplay step={step} index={index} />
                    
                    {/* Show unlock card after the last visible step (step index 1, which is step #2) */}
                    {!hasFullAccess && index === 1 && sop.steps.length > 2 && (
                      <div className="mt-6 bg-gradient-to-br from-[#E63946]/10 to-[#E63946]/5 rounded-lg p-8 text-center border-2 border-[#E63946]/20">
                        <div className="w-16 h-16 bg-[#E63946]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Lock className="h-8 w-8 text-[#E63946]" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">
                          Unlock Full Access
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Purchase this SOP to access all {sop.steps.length} steps and start executing the procedure.
                        </p>
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex items-center justify-center gap-2 text-3xl font-bold text-[#E63946] mb-4">
                            <DollarSign className="h-8 w-8" />
                            {sop.price.toFixed(2)}
                          </div>
                          <button
                            onClick={async () => {
                              if (!session?.user) {
                                toast.error("Please sign in to add to cart");
                                router.push("/auth/signin");
                                return;
                              }

                              try {
                                const response = await fetch("/api/cart", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ sopId: sop.id }),
                                });

                                if (!response.ok) {
                                  const error = await response.json();
                                  throw new Error(error.error || "Failed to add to cart");
                                }

                                toast.success("Added to cart!");
                                window.dispatchEvent(new Event('cartUpdated'));
                                router.push("/cart");
                              } catch (error: any) {
                                console.error("Add to cart error:", error);
                                toast.error(error.message || "Failed to add to cart");
                              }
                            }}
                            className="w-full max-w-xs flex items-center justify-center gap-2 px-6 py-3 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition font-semibold text-lg shadow-lg"
                          >
                            <ShoppingCart className="h-5 w-5" />
                            Buy SOP
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Author Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="font-semibold mb-4">About the Author</h3>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#E63946]/10 flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-[#E63946]" />
              </div>
              <div>
                <Link
                  href={`/profile/${sop.author.id}`}
                  className="font-semibold hover:text-[#E63946] transition"
                >
                  {sop.author.name || "Anonymous"}
                </Link>
                {sop.author.bio && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {sop.author.bio}
                  </p>
                )}
              </div>
            </div>
            {sop.author.email && (
              <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(sop.author.email)}&su=${encodeURIComponent('Question about ' + sop.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm font-medium"
              >
                <Mail className="h-4 w-4" />
                Contact Seller
              </a>
            )}
          </div>

          {/* Attachments Card */}
          {sop.attachments && (sop.attachments as any[]).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Additional Documents
              </h3>
              <div className="space-y-2">
                {(sop.attachments as any[]).map((attachment, index) => (
                  <button
                    key={index}
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/download?key=${encodeURIComponent(attachment.cloud_storage_path)}&filename=${encodeURIComponent(attachment.name)}`);
                        const data = await res.json();
                        if (data.url) {
                          // Create a temporary link and trigger download
                          const link = document.createElement('a');
                          link.href = data.url;
                          link.download = attachment.name;
                          link.target = '_blank';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
                      } catch (error) {
                        console.error('Download error:', error);
                        toast.error('Failed to download file');
                      }
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition cursor-pointer"
                  >
                    <FileText className="h-5 w-5 text-[#E63946] flex-shrink-0" />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium truncate">{attachment.name}</p>
                      <p className="text-xs text-gray-500">
                        {(attachment.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Download className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Related SOPs */}
          {relatedSOPs.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="font-semibold mb-4">Related SOPs</h3>
              <div className="space-y-4">
                {relatedSOPs.map((related) => (
                  <Link
                    key={related.id}
                    href={`/sops/${related.id}`}
                    className="block hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-3 transition"
                  >
                    <h4 className="font-medium text-sm mb-1 line-clamp-2">
                      {related.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {related._count?.steps || 0} steps
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ratings and Comments */}
      <div className="mt-8 space-y-6">
        <RatingsSection sopId={sop.id} />
        <CommentsSection sopId={sop.id} />
      </div>
    </div>
  );
}

function StepDisplay({ step, index }: { step: any; index: number }) {
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    // Skip image loading for locked steps
    if (step.isLocked) return;
    
    // Add timestamp for cache busting to ensure fresh signed URLs
    const timestamp = Date.now();
    
    // Handle multiple images (new format)
    if (step.images && step.images.length > 0) {
      const validImages = step.images.filter((img: string) => img && img.trim());
      
      Promise.all(
        validImages.map((img: string) =>
          fetch(`/api/download?key=${encodeURIComponent(img)}&t=${timestamp}`)
            .then((res) => res.json())
            .then((data) => data.url)
            .catch(() => img) // Fallback to original URL
        )
      ).then(setImageUrls);
    }
    // Fallback to legacy single image (for backward compatibility)
    else if (step.imageUrl) {
      fetch(`/api/download?key=${encodeURIComponent(step.imageUrl)}&t=${timestamp}`)
        .then((res) => res.json())
        .then((data) => setImageUrls([data.url]))
        .catch(() => setImageUrls([step.imageUrl]));
    }
  }, [step.images, step.imageUrl, step.isLocked]);

  // Locked step display
  if (step.isLocked) {
    return (
      <div className="border-l-4 border-gray-300 dark:border-gray-600 pl-6 pb-6 opacity-50">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 flex items-center justify-center font-bold">
            <Lock className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
              <Lock className="h-5 w-5 text-gray-400" />
              {step.title}
            </h3>
            <p className="text-gray-500 dark:text-gray-500 italic">
              {step.description}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Normal step display
  return (
    <div className="border-l-4 border-[#E63946] pl-6 pb-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#E63946] text-white flex items-center justify-center font-bold">
          {index + 1}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
          {step.description && (
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              {step.description}
            </p>
          )}
          
          {/* Display multiple images */}
          {imageUrls.length > 0 && (
            <div className={`grid gap-3 mb-3 ${imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {imageUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="relative aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700"
                >
                  <Image
                    src={url}
                    alt={`${step.title} - Image ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
          
          {step.duration && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              <span>{step.duration} minutes</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}