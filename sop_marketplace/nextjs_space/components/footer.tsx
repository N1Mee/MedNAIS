
import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t bg-gray-50 dark:bg-gray-900 mt-auto">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-8 w-8">
              <Image
                src="/logo.png"
                alt="MedNAIS Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-[#E63946] transition">
              MedNAIS™
            </span>
          </Link>

          <div className="flex gap-6 text-sm">
            <Link
              href="/marketplace"
              className="text-gray-600 dark:text-gray-400 hover:text-[#E63946] transition"
            >
              Marketplace
            </Link>
            <Link
              href="/categories"
              className="text-gray-600 dark:text-gray-400 hover:text-[#E63946] transition"
            >
              Categories
            </Link>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            © 2025 MedNAIS™. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
