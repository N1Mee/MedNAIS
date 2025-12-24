"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Mail, Loader2, Lock, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession() || {};

  // Check for messages from query params
  useEffect(() => {
    const message = searchParams?.get("message");
    if (message === "verified") {
      setSuccessMessage("Email успешно подтвержден! Теперь вы можете войти в систему.");
    } else if (message === "registered") {
      setSuccessMessage("Регистрация успешна! Проверьте почту для подтверждения email.");
    } else if (message === "already-verified") {
      setSuccessMessage("Ваш email уже подтвержден. Вы можете войти в систему.");
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated") {
      router.push(searchParams?.get("callbackUrl") || "/marketplace");
    }
  }, [status, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: searchParams?.get("callbackUrl") || "/marketplace",
      });

      if (result?.error) {
        console.error("Sign in error:", result.error);
        // Display the actual error message from NextAuth
        setError(result.error);
        setLoading(false);
      } else {
        console.log("Sign in successful:", result);
        // Успешный вход - даём время NextAuth установить cookie, затем редиректим
        await new Promise(resolve => setTimeout(resolve, 500));
        const targetUrl = result?.url || searchParams?.get("callbackUrl") || "/marketplace";
        console.log("Redirecting to:", targetUrl);
        window.location.href = targetUrl;
        // Не снимаем loading, чтобы показать процесс перенаправления
      }
    } catch (err) {
      setError("Произошла ошибка. Попробуйте снова.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Добро пожаловать</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Войдите в систему для продолжения
            </p>
          </div>

          {/* Success message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-900 dark:text-green-100">
                  {successMessage}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#E63946] focus:border-transparent bg-white dark:bg-gray-700"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
              >
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Ваш пароль"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#E63946] focus:border-transparent bg-white dark:bg-gray-700"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-900 dark:text-red-100">
                    {error}
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Вход...
                </>
              ) : (
                "Войти"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Нет аккаунта?{" "}
            <Link href="/auth/signup" className="text-[#E63946] hover:underline font-medium">
              Зарегистрироваться
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
