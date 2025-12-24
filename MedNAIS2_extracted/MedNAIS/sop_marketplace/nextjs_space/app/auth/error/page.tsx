
"use client";

import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Authentication Error</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {error === "Configuration"
            ? "There is a problem with the server configuration."
            : error === "AccessDenied"
            ? "Access was denied."
            : error === "Verification"
            ? "The sign in link is no longer valid. It may have been used already or expired."
            : "An error occurred during authentication."}
        </p>
        <Link
          href="/auth/signin"
          className="inline-flex items-center justify-center px-6 py-3 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition"
        >
          Try Again
        </Link>
      </div>
    </div>
  );
}
