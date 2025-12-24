
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, User, Loader2, Briefcase, Lock, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "buyer",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Не удалось создать аккаунт");
        return;
      }

      // Show success message
      setSuccess(true);
      
      // Wait a bit and then redirect to sign in
      setTimeout(() => {
        router.push("/auth/signin?message=registered");
      }, 3000);
    } catch (err) {
      setError("Произошла ошибка. Пожалуйста, попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  // If registration successful, show success message
  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold mb-4">Регистрация успешна!</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Мы отправили письмо для подтверждения на <strong>{formData.email}</strong>
              </p>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-900 dark:text-blue-100">
                Пожалуйста, проверьте вашу почту и перейдите по ссылке для активации аккаунта.
                После подтверждения вы сможете войти в систему.
              </div>
              <div className="mt-6">
                <Link
                  href="/auth/signin"
                  className="text-[#E63946] hover:underline font-medium"
                >
                  Перейти на страницу входа
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Создать аккаунт</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Присоединяйтесь к маркетплейсу MedNAIS™
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Полное имя
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  placeholder="Иван Иванов"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#E63946] focus:border-transparent bg-white dark:bg-gray-700"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2"
              >
                Email адрес
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
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
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  minLength={4}
                  placeholder="Минимум 4 символа"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#E63946] focus:border-transparent bg-white dark:bg-gray-700"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Минимум 4 символа
              </p>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium mb-2">
                Я хочу
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#E63946] focus:border-transparent bg-white dark:bg-gray-700 appearance-none"
                >
                  <option value="buyer">Просматривать и покупать SOP</option>
                  <option value="seller">Создавать и продавать SOP</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                {error}
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
                  Создание аккаунта...
                </>
              ) : (
                "Создать аккаунт"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Уже есть аккаунт?{" "}
            <Link href="/auth/signin" className="text-[#E63946] hover:underline font-medium">
              Войти
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
