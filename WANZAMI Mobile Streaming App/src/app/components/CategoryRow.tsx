import { ChevronRight } from "lucide-react";
import { ReactNode } from "react";

interface CategoryRowProps {
  title: string;
  children: ReactNode;
  onSeeAll?: () => void;
}

export function CategoryRow({ title, children, onSeeAll }: CategoryRowProps) {
  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-6">
        <h2 className="text-white text-xl font-bold">{title}</h2>
        {onSeeAll && (
          <button
            onClick={onSeeAll}
            className="flex items-center gap-1 text-[#A1A1AA] hover:text-white transition-colors text-sm"
          >
            <span>See All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Scrollable content */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 px-6">
          {children}
        </div>
      </div>
    </div>
  );
}
