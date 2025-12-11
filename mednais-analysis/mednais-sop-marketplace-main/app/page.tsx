'use client';

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  ShoppingBag, 
  CheckCircle,
  BarChart3,
  Shield,
  RefreshCw,
  Check
} from "lucide-react";
import { CustomIcon } from "@/components/custom-icon";

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* SECTION 1 - HERO */}
      <section className="relative bg-gradient-to-br from-[#1A2332] via-[#1E2838] to-[#1A2332] py-[180px] px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Diagonal transition */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-white" style={{clipPath: 'polygon(0 100%, 100% 0%, 100% 100%)'}}></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
            {t('home', 'heroTitle')}<br />
            <span className="text-[#E63946]">{t('home', 'heroTitle2')}</span>
          </h1>
          <p className="text-xl text-gray-300 mb-4 max-w-2xl mx-auto">
            {t('home', 'heroSubtext')}
          </p>
          <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
            {t('home', 'heroSubtext2')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-[#E63946] hover:bg-[#D62839] text-white px-8 rounded-full shadow-lg">
              <Link href="/auth">{t('common', 'getStarted')}</Link>
            </Button>
            <Button size="lg" asChild className="bg-white text-[#1A2332] hover:bg-gray-100 px-8 rounded-full shadow-lg font-semibold">
              <Link href="/marketplace">{t('home', 'exploreMarketplace')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* SECTION 2 - VALUE BLOCKS */}
      <section className="bg-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            WHY <span className="text-[#E63946]">CHOOSE US</span>
          </h2>
          <p className="text-center text-gray-600 mb-16 text-lg">
            THE ONLY COMPLETE SOLUTION FOR <span className="text-[#E63946] font-semibold">SOP CREATORS</span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#F9F9F9] border-2 border-[#E8E8E8] rounded-lg p-8 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('home', 'clarityTitle')}</h3>
              <p className="text-gray-600">{t('home', 'clarityDesc')}</p>
            </div>
            <div className="bg-[#F9F9F9] border-2 border-[#E8E8E8] rounded-lg p-8 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('home', 'scalabilityTitle')}</h3>
              <p className="text-gray-600">{t('home', 'scalabilityDesc')}</p>
            </div>
            <div className="bg-[#F9F9F9] border-2 border-[#E8E8E8] rounded-lg p-8 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('home', 'monetizationTitle')}</h3>
              <p className="text-gray-600">{t('home', 'monetizationDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 - HOW IT WORKS */}
      <section className="bg-[#F5F5F5] py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            <span className="text-[#E63946]">{t('home', 'howItWorks')}</span>
          </h2>
          <p className="text-lg text-gray-600 text-center mb-16">
            {t('home', 'howItWorksSubtitle')}
          </p>
          
          <div className="space-y-12">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-[#E63946] text-white rounded-full flex items-center justify-center text-xl font-bold">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('home', 'step1Title')}</h3>
                <p className="text-gray-600">{t('home', 'step1Desc')}</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-[#E63946] text-white rounded-full flex items-center justify-center text-xl font-bold">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('home', 'step2Title')}</h3>
                <p className="text-gray-600">{t('home', 'step2Desc')}</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-[#E63946] text-white rounded-full flex items-center justify-center text-xl font-bold">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('home', 'step3Title')}</h3>
                <p className="text-gray-600">{t('home', 'step3Desc')}</p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Button size="lg" asChild className="bg-[#E63946] hover:bg-[#D62839] text-white px-8 rounded-full shadow-lg">
              <Link href="/sops/create">{t('home', 'startCreating')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* SECTION 4 - WHO IT'S FOR */}
      <section className="bg-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            {t('home', 'whoItsFor')}
          </h2>
          <p className="text-lg text-gray-600 text-center mb-12">
            And any <span className="text-[#E63946] font-semibold">SOP</span> can become income.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <div key={num} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-[#E63946] flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{t('home', `audience${num}`)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 - MARKETPLACE PREVIEW */}
      <section className="bg-[#F5F5F5] py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Discover <span className="text-[#E63946]">SOPs</span> Created by Experts
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { title: 'Restaurant Opening Checklist', desc: 'Complete guide for restaurant operations', category: 'Food & Beverage', price: '$29.99' },
              { title: 'Client Onboarding Process', desc: 'Step-by-step client intake workflow', category: 'Business', price: '$49.99' },
              { title: 'Lab Safety Protocol', desc: 'Medical laboratory safety procedures', category: 'Healthcare', price: '$39.99' },
            ].map((sop, idx) => (
              <Card key={idx} className="border-2 border-[#E8E8E8] bg-white hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{sop.title}</CardTitle>
                  <CardDescription>{sop.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{sop.category}</span>
                    <span className="text-lg font-bold text-[#E63946]">{sop.price}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button size="lg" variant="outline" asChild className="border-2 border-[#E63946] text-[#E63946] hover:bg-[#E63946] hover:text-white px-8 rounded-full transition-colors">
              <Link href="/marketplace">{t('home', 'browseMarketplace')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* SECTION 6 - TOOLS FOR CREATORS */}
      <section className="bg-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
            A Complete <span className="text-[#E63946]">SOP</span> Creation Suite
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((num) => (
                <div key={num} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#E63946] flex-shrink-0 mt-1" />
                  <span className="text-lg text-gray-700">{t('home', `tool${num}`)}</span>
                </div>
              ))}
            </div>
            
            <div className="bg-gradient-to-br from-[#1A2332] to-[#2D3748] rounded-lg h-80 flex items-center justify-center">
              <FileText className="h-32 w-32 text-[#E63946]" />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 - WHY CHOOSE US */}
      <section className="bg-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            {t('home', 'whyChooseUs')}
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            {t('home', 'whyChooseUsDesc')}
          </p>
        </div>
      </section>

      {/* SECTION 8 - FINAL CTA */}
      <section className="relative bg-gradient-to-r from-[#E63946] to-[#D62839] py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Diagonal transition from previous section */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-[#F5F5F5]" style={{clipPath: 'polygon(0 0, 100% 100%, 100% 0)'}}></div>
        
        <div className="max-w-3xl mx-auto text-center relative z-10 pt-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            {t('home', 'finalCta')}
          </h2>
          <p className="text-lg text-white/90 mb-10">
            {t('home', 'finalCtaSubtext')}
          </p>
          <Button size="lg" asChild className="bg-white text-[#E63946] hover:bg-gray-100 px-10 rounded-full shadow-xl font-semibold">
            <Link href="/sops/create">{t('home', 'createYourSop')}</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
