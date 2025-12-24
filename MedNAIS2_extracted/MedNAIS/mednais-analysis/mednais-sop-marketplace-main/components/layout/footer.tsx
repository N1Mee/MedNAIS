import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#1A2332] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-4">
              <img 
                src="/mednais-logo.jpg" 
                alt="MedNAIS Logo" 
                className="h-12 w-auto bg-white p-1 rounded"
              />
              <div className="flex flex-col">
                <div className="text-xl font-bold leading-tight">
                  <span className="text-[#E63946]">Med</span>
                  <span className="text-white">NAIS</span>
                  <span className="text-[10px] align-super text-gray-400">™</span>
                </div>
                <div className="text-[10px] text-gray-400 leading-tight">SOP Management Platform</div>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-4 max-w-md">
              MedNAIS™ — Create, share, and monetize your Standard Operating Procedures. Turn your expertise into income with our comprehensive SOP management platform.
            </p>
            <div className="space-y-2">
              <a href="mailto:support@mednais.com" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                support@mednais.com
              </a>
              <a href="https://samplify.org" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                samplify.org
              </a>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-bold text-white mb-4">Products</h3>
            <ul className="space-y-2">
              <li><Link href="/sops/create" className="text-gray-400 hover:text-white text-sm transition-colors">SOP Creator</Link></li>
              <li><Link href="/marketplace" className="text-gray-400 hover:text-white text-sm transition-colors">Marketplace</Link></li>
              <li><Link href="/dashboard" className="text-gray-400 hover:text-white text-sm transition-colors">Analytics</Link></li>
              <li><Link href="/groups" className="text-gray-400 hover:text-white text-sm transition-colors">Team Management</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-bold text-white mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Documentation</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">API Reference</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Help Center</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Community</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © 2024 MedNAIS™. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
