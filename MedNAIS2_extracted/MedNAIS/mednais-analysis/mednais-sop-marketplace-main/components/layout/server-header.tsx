import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingBag, FileText, Users, BarChart3, LogOut } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getCurrentUser } from "@/lib/auth/server";

export async function ServerHeader() {
  const user = await getCurrentUser();

  return (
    <nav className="bg-[#F8F9FA] border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <img 
              src="/mednais-logo.jpg" 
              alt="MedNAIS Logo" 
              className="h-12 w-auto"
            />
            <div className="flex flex-col">
              <div className="text-xl font-bold leading-tight">
                <span className="text-[#E63946]">Med</span>
                <span className="text-gray-900">NAIS</span>
                <span className="text-[10px] align-super text-gray-600">™</span>
              </div>
              <div className="text-[10px] text-gray-500 leading-tight">SOP Management Platform</div>
            </div>
          </Link>
          
          {/* Center Navigation */}
          {user && (
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/dashboard" className="flex items-center gap-2 text-gray-700 hover:text-[#E63946] transition-colors">
                <BarChart3 className="w-5 h-5" />
                <span className="font-medium">Dashboard</span>
              </Link>
              <Link href="/marketplace" className="flex items-center gap-2 text-gray-700 hover:text-[#E63946] transition-colors">
                <ShoppingBag className="w-5 h-5" />
                <span className="font-medium">Marketplace</span>
              </Link>
              <Link href="/sops" className="flex items-center gap-2 text-gray-700 hover:text-[#E63946] transition-colors">
                <FileText className="w-5 h-5" />
                <span className="font-medium">My SOPs</span>
              </Link>
              <Link href="/groups" className="flex items-center gap-2 text-gray-700 hover:text-[#E63946] transition-colors">
                <Users className="w-5 h-5" />
                <span className="font-medium">Groups</span>
              </Link>
            </div>
          )}
          
          {/* Right Side */}
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            
            {user ? (
              <div className="flex items-center gap-4">
                <Link href="/profile" className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#E63946] transition-colors">
                  <div className="w-8 h-8 rounded-full bg-[#E63946] text-white flex items-center justify-center font-semibold">
                    {user.email[0].toUpperCase()}
                  </div>
                  <span className="hidden md:inline">{user.email}</span>
                </Link>
                <form action="/api/auth/logout" method="POST">
                  <Button
                    type="submit"
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </form>
              </div>
            ) : (
              <Button asChild className="bg-[#E63946] hover:bg-[#D62839] text-white rounded-md px-6">
                <Link href="/auth">Login</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
