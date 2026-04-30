import { ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  content: string;
  className?: string;
}

export function Tooltip({ children, content, className = '' }: TooltipProps) {
  return (
    <div className={`group relative inline-block ${className}`}>
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-secondary-1 border border-primary/20 rounded-lg text-foreground text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-secondary-1" />
      </div>
    </div>
  );
}
