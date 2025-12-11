'use client';

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  ShoppingBag, 
  CheckCircle,
  BarChart3,
  Shield,
  RefreshCw
} from "lucide-react";
import { CustomIcon } from "@/components/custom-icon";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-background border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-background/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <CustomIcon className="h-6 w-6 text-[#E63946]" />
              <span className="text-xl font-semibold text-foreground">MedNAIS<span className="text-xs align-super">™</span></span>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <ThemeToggle />
              <Button variant="ghost" asChild>
                <Link href="/auth">{t('common', 'signIn')}</Link>
              </Button>
              <Button asChild className="bg-[#E63946] hover:bg-[#D62839] text-white rounded-full">
                <Link href="/auth">{t('common', 'getStarted')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* SECTION 1 - HERO */}
      <section className="relative bg-gradient-to-br from-[#1A2332] via-[#1E2838] to-[#1A2332] py-[180px] px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-semibold text-white mb-6 leading-tight">
            {t('home', 'heroTitle')}<br />
            <span className="text-[#E63946]">{t('home', 'heroSubtitle')}</span>
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Streamline your workflows with AI-powered SOP management
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-[#E63946] hover:bg-[#D62839] text-white rounded-full px-8 py-6 text-base font-semibold shadow-lg">
              <Link href="/auth">{t('common', 'getStarted')}</Link>
            </Button>
            <Button size="lg" asChild className="bg-white text-[#1A2332] hover:bg-gray-100 rounded-full px-8 py-6 text-base font-semibold shadow-lg border-2 border-white">
              <Link href="/marketplace">{t('common', 'learnMore')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Rest of sections... */}
      <section className="bg-muted py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-semibold text-center text-foreground mb-16">
            {"Why SOPs Matter"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-foreground mb-3">{"Operational Clarity"}</h3>
              <p className="text-muted-foreground">{"Eliminate ambiguity in processes"}</p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-foreground mb-3">{"Scalability"}</h3>
              <p className="text-muted-foreground">{"Scale your operations efficiently"}</p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-foreground mb-3">{"Monetization"}</h3>
              <p className="text-muted-foreground">{"Turn your expertise into revenue"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-[#E63946] to-[#D62839] py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-semibold text-white mb-4">
            {"Ready to Streamline Your Operations?"}
          </h2>
          <p className="text-lg text-white/90 mb-10">
            {"Join thousands of teams already using MedNAIS SOPs"}
          </p>
          <Button size="lg" asChild className="bg-white text-[#E63946] hover:bg-gray-100 rounded-full px-10 py-6 text-base font-semibold shadow-xl">
            <Link href="/sops/create">{"Start Creating SOPs"}</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <Link href="/marketplace" className="hover:text-foreground transition-colors">Marketplace</Link>
              <Link href="/sops/create" className="hover:text-foreground transition-colors">{"For Creators"}</Link>
            </div>
            <div className="text-sm text-muted-foreground">© MedNAIS™</div>
          </div>
        </div>
      </footer>
    </div>
  );
}