import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && (
              <ChevronRight className="h-4 w-4 shrink-0 text-palette-taupe" aria-hidden />
            )}
            {item.href != null ? (
              <Link
                to={item.href}
                className="text-palette-terracotta hover:text-palette-slate hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-palette-taupe">{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
