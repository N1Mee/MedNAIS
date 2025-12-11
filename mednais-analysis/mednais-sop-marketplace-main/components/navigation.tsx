'use client';

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Home,
  Plus,
  ShoppingBag,
  FileText,
  Users,
  User,
  LogOut,
  Menu,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomIcon } from "@/components/custom-icon";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

// Navigation items will be translated dynamically

export function Navigation() {
  const { t } = useLanguage();
  const { user, logout, isLoading } = useAuth();
  const isAuthenticated = !!user && !isLoading;
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navigation = [
    { name: t('nav', 'dashboard'), href: '/dashboard', icon: Home },
    { name: t('nav', 'createSOP'), href: '/sops/create', icon: Plus },
    { name: t('nav', 'marketplace'), href: '/marketplace', icon: ShoppingBag },
    { name: t('nav', 'mySops'), href: '/sops', icon: FileText },
    { name: t('nav', 'sessions'), href: '/sessions', icon: History },
    { name: t('nav', 'groups'), href: '/groups', icon: Users },
  ];

  const handleLogout = () => {
    logout();
  };

  if (!isAuthenticated) {
    return (
      <nav className="bg-background border-b border-border sticky top-0 z-50 shadow-sm backdrop-blur-sm bg-background/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <CustomIcon className="h-6 w-6 text-[#E63946]" />
              <span className="text-xl font-bold text-foreground">MedNAIS<span className="text-xs align-super">™</span> SOPs</span>
            </Link>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <ThemeToggle />
              <Button variant="ghost" asChild>
                <Link href="/auth/signin">{t('common', 'signIn')}</Link>
              </Button>
              <Button asChild className="bg-[#E63946] hover:bg-[#D62839] text-white rounded-full px-6">
                <Link href="/auth/signup">{t('common', 'signUp')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50 shadow-sm backdrop-blur-sm bg-background/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2">
            <CustomIcon className="h-6 w-6 text-[#E63946]" />
            <span className="text-xl font-bold text-foreground">MedNAIS<span className="text-xs align-super">™</span> SOPs</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                    isActive
                      ? "bg-[#E63946] text-white shadow-md"
                      : "text-foreground/70 hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <ThemeToggle />
            {/* Mobile menu trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col space-y-4 mt-8">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                          isActive
                            ? "bg-[#E63946] text-white"
                            : "text-foreground/70 hover:text-foreground hover:bg-muted"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full" aria-label="User menu">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                    <AvatarFallback className="bg-[#E63946] text-white">
                      {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user.name && (
                      <p className="font-medium">{user.name}</p>
                    )}
                    {user?.email && (
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>{t('nav', 'profile')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-[#E63946]">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('nav', 'logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}