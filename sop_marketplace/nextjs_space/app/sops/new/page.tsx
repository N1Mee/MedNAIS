
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { SOPEditor } from "../_components/sop-editor";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewSOPPage() {
  const user = await getCurrentUser();
  
  // If not logged in, redirect to signin
  if (!user) {
    redirect("/auth/signin?callbackUrl=/sops/new");
  }
  
  // If user is a buyer, show access denied page
  if (user.role !== "seller") {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Only users with a <strong>Seller</strong> role can create SOPs.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-8">
            To create and sell SOPs, please update your account role to "Seller" in your profile settings.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/settings"
              className="px-6 py-3 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition font-semibold"
            >
              Go to Settings
            </Link>
            <Link
              href="/marketplace"
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-semibold"
            >
              Browse Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Create New SOP</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Build a professional standard operating procedure with our intuitive
          editor
        </p>
      </div>

      <SOPEditor />
    </div>
  );
}
