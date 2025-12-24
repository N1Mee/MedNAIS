
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  X,
  FileText,
  User,
  LogOut,
  Settings,
  PlusCircle,
  Moon,
  Sun,
  LayoutDashboard,
  ShoppingCart,
  DollarSign,
} from "lucide-react";
import { useTheme } from "next-themes";

export function Header() {
  const { data: session, status } = useSession() || {};
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  // Fetch cart count
  const fetchCartCount = async () => {
    if (status === "authenticated") {
      try {
        const response = await fetch("/api/cart");
        if (response.ok) {
          const data = await response.json();
          setCartCount(data.length);
        }
      } catch (error) {
        console.error("Error fetching cart count:", error);
      }
    }
  };

  // Fetch cart count on mount and when session changes
  React.useEffect(() => {
    fetchCartCount();
  }, [status]);

  // Poll cart count every 10 seconds when authenticated
  React.useEffect(() => {
    if (status === "authenticated") {
      const interval = setInterval(fetchCartCount, 10000);
      return () => clearInterval(interval);
    }
  }, [status]);

  // Listen for cart update events (triggered when items are added/removed)
  React.useEffect(() => {
    const handleCartUpdate = () => {
      fetchCartCount();
    };
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [status]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group mr-4">
            <div className="relative h-10 w-10">
              <Image
                src="/logo.png"
                alt="MedNAIS Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-[#E63946] transition">
              MedNAIS™
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            <Link
              href="/marketplace"
              className="text-sm font-medium hover:text-[#E63946] transition"
            >
              Marketplace
            </Link>
            <Link
              href="/categories"
              className="text-sm font-medium hover:text-[#E63946] transition"
            >
              Categories
            </Link>

            {status === "authenticated" ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium hover:text-[#E63946] transition flex items-center gap-1"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                
                {session?.user?.role === "seller" && (
                  <>
                    <Link
                      href="/my-sops"
                      className="text-sm font-medium hover:text-[#E63946] transition"
                    >
                      My SOPs
                    </Link>
                    <Link
                      href="/dashboard/balance"
                      className="text-sm font-medium hover:text-[#E63946] transition flex items-center gap-1"
                    >
                      <DollarSign className="h-4 w-4" />
                      Balance
                    </Link>
                    <Link
                      href="/sops/new"
                      className="flex items-center gap-2 px-4 py-2 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition text-sm font-medium"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Create SOP
                    </Link>
                  </>
                )}

                <Link
                  href="/cart"
                  className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#E63946] text-white text-xs flex items-center justify-center font-semibold">
                      {cartCount}
                    </span>
                  )}
                </Link>

                <button 
                  onClick={() => router.push(`/profile/${session?.user?.id}`)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <User className="h-4 w-4" />
                  <span className="text-sm">{session?.user?.name || "Account"}</span>
                </button>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="px-4 py-2 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition text-sm font-medium"
              >
                Sign In
              </Link>
            )}

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="lg:hidden py-4 border-t space-y-2">
            <Link
              href="/marketplace"
              className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              Marketplace
            </Link>
            <Link
              href="/categories"
              className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              Categories
            </Link>

            {status === "authenticated" ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                
                {session?.user?.role === "seller" && (
                  <>
                    <Link
                      href="/my-sops"
                      className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My SOPs
                    </Link>
                    <Link
                      href="/dashboard/balance"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <DollarSign className="h-4 w-4" />
                      Balance
                    </Link>
                    <Link
                      href="/sops/new"
                      className="block px-4 py-2 bg-[#E63946] text-white rounded-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Create SOP
                    </Link>
                  </>
                )}

                <Link
                  href="/cart"
                  className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Cart
                  </span>
                  {cartCount > 0 && (
                    <span className="h-5 w-5 rounded-full bg-[#E63946] text-white text-xs flex items-center justify-center font-semibold">
                      {cartCount}
                    </span>
                  )}
                </Link>

                <Link
                  href={`/profile/${session?.user?.id}`}
                  className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Settings
                </Link>
                <button
                  onClick={() => {
                    signOut({ callbackUrl: "/" });
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="block px-4 py-2 bg-[#E63946] text-white rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
