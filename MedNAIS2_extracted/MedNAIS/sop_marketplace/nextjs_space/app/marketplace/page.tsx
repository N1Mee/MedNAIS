
import { Suspense } from "react";
import { MarketplaceClient } from "./marketplace-client";
import { LoadingSpinner } from "@/components/loading-spinner";

export const dynamic = "force-dynamic";

export default function MarketplacePage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">SOP Marketplace</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Browse and discover professional standard operating procedures
        </p>
      </div>

      <Suspense
        fallback={
          <div className="py-12">
            <LoadingSpinner size="lg" />
          </div>
        }
      >
        <MarketplaceClient />
      </Suspense>
    </div>
  );
}
