
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  // Split title to make first word red, rest white (you can customize this logic)
  const words = title.split(' ');
  const firstWord = words[0];
  const restOfTitle = words.slice(1).join(' ');
  
  return (
    <div className="bg-gradient-to-br from-[#1A2332] via-[#1E2838] to-[#1A2332] border-b-4 border-[#E63946]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold">
              <span className="text-white">{firstWord}</span>
              {restOfTitle && <span className="text-[#E63946]"> {restOfTitle}</span>}
            </h1>
            {description && (
              <p className="mt-3 text-gray-300 text-lg">{description}</p>
            )}
          </div>
          {children && (
            <div className="ml-4">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
