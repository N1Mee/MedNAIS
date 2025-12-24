
import { Mail } from "lucide-react";

export default function VerifyRequestPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#E63946]/10 mb-4">
          <Mail className="h-8 w-8 text-[#E63946]" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Check Your Email</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          A sign in link has been sent to your email address. Please check your
          inbox and click the link to sign in.
        </p>
        <p className="text-sm text-gray-500">
          If you don't see the email, check your spam folder or check the
          console logs in development mode.
        </p>
      </div>
    </div>
  );
}
