
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
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { downloadFile } from "@/lib/s3";
import { useState, useEffect } from "react";
import { RatingsSection } from "./_components/ratings-section";
import { CommentsSection } from "./_components/comments-section";

interface SOPDetailClientProps {
  sop: any;
  relatedSOPs: any[];
}

export function SOPDetailClient({ sop, relatedSOPs }: SOPDetailClientProps) {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const isAuthor = session?.user?.id === sop.author.id;
  const isPaid = sop.price > 0;
  const canViewAll = isAuthor || !isPaid;

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

          <div className="flex items-center gap-2">
            {/* Run SOP button - visible to author and users who have access */}
            {canViewAll && (
              <Link
                href={`/sops/${sop.id}/run`}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
              >
                <Play className="h-4 w-4" />
                Run SOP
              </Link>
            )}
            
            {/* Buy SOP button - visible to non-authors for paid SOPs */}
            {!isAuthor && isPaid && !canViewAll && session?.user && (
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
                className="flex items-center gap-2 px-4 py-2 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition font-medium"
              >
                <ShoppingCart className="h-4 w-4" />
                Buy SOP
              </button>
            )}
            
            {isAuthor && (
              <>
                <Link
                  href={`/sops/${sop.id}/edit`}
                  className="flex items-center gap-2 px-4 py-2 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Link>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  <Trash className="h-4 w-4" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-6 text-sm text-gray-600 dark:text-gray-400">
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
          <div className="flex items-center gap-2 text-[#E63946] font-bold">
            <DollarSign className="h-4 w-4" />
            <span>{sop.price === 0 ? "Free" : `$${sop.price.toFixed(2)}`}</span>
          </div>
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
                {sop.steps.map((step: any, index: number) => {
                  const isLocked = !canViewAll && index >= 2;
                  return (
                    <div key={step.id} className="relative">
                      <div className={isLocked ? "blur-sm pointer-events-none" : ""}>
                        <StepDisplay step={step} index={index} />
                      </div>
                      {isLocked && index === 2 && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-md">
                          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 text-center max-w-md relative z-50">
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
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition font-semibold text-lg shadow-lg relative z-[100] cursor-pointer"
                              >
                                <ShoppingCart className="h-5 w-5" />
                                Buy SOP
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
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
                href={`mailto:${sop.author.email}?subject=Question about ${encodeURIComponent(sop.title)}`}
                target="_self"
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
                  <a
                    key={index}
                    href={`/api/download?key=${encodeURIComponent(attachment.cloud_storage_path)}&filename=${encodeURIComponent(attachment.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                  >
                    <FileText className="h-5 w-5 text-[#E63946] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{attachment.name}</p>
                      <p className="text-xs text-gray-500">
                        {(attachment.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Download className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </a>
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
    // Handle multiple images (new format)
    if (step.images && step.images.length > 0) {
      const validImages = step.images.filter((img: string) => img && img.trim());
      
      Promise.all(
        validImages.map((img: string) =>
          fetch(`/api/download?key=${encodeURIComponent(img)}`)
            .then((res) => res.json())
            .then((data) => data.url)
            .catch(() => img) // Fallback to original URL
        )
      ).then(setImageUrls);
    }
    // Fallback to legacy single image (for backward compatibility)
    else if (step.imageUrl) {
      fetch(`/api/download?key=${encodeURIComponent(step.imageUrl)}`)
        .then((res) => res.json())
        .then((data) => setImageUrls([data.url]))
        .catch(() => setImageUrls([step.imageUrl]));
    }
  }, [step.images, step.imageUrl]);

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