
'use client';

import { AuthProvider } from "@/lib/auth/AuthContext";
import { CartProvider } from "@/lib/cart/CartContext";
import { ThemeProvider } from "./theme-provider";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return (
    <AuthProvider>
      <CartProvider>
        <LanguageProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={true}
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </LanguageProvider>
      </CartProvider>
    </AuthProvider>
  );
}
