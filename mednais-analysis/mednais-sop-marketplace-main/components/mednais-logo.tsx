import Link from "next/link";

export function MedNAISLogo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-start gap-2 ${className}`}>
      {/* Logo Icon */}
      <div className="relative">
        {/* Barcode-style M */}
        <div className="flex gap-[2px]">
          <div className="w-[3px] h-7 bg-gray-900"></div>
          <div className="w-[2px] h-7 bg-gray-900"></div>
          <div className="w-[4px] h-7 bg-gray-900"></div>
          <div className="w-[3px] h-7 bg-gray-900"></div>
          <div className="w-[2px] h-7 bg-gray-900"></div>
          <div className="w-[3px] h-7 bg-gray-900"></div>
          <div className="w-[4px] h-7 bg-gray-900"></div>
          <div className="w-[2px] h-7 bg-gray-900"></div>
        </div>
        
        {/* Red checkmark overlay */}
        <svg
          className="absolute -top-1 left-0 w-full h-4"
          viewBox="0 0 30 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 8L10 14L28 2"
            stroke="#E63946"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      
      {/* Brand Text */}
      <div className="flex flex-col -mt-0.5">
        <div className="text-xl font-bold leading-tight">
          <span className="text-gray-900">Med</span>
          <span className="text-[#E63946]">NAIS</span>
        </div>
        <div className="text-[10px] text-gray-500 leading-tight">
          SOP Management Platform
        </div>
      </div>
    </Link>
  );
}
