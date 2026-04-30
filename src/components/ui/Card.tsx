import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'teal' | 'danger' | 'warn' | 'success';
}

export function Card({ children, className = '', glowColor }: CardProps) {
  const glowStyles = {
    teal: 'border-l-4 border-l-teal',
    danger: 'border-l-4 border-l-danger',
    warn: 'border-l-4 border-l-warn',
    success: 'border-l-4 border-l-success',
  };

  return (
    <div
      className={`bg-navy-mid border border-white/10 rounded-xl shadow-lg ${glowColor ? glowStyles[glowColor] : ''} ${className}`}
    >
      {children}
    </div>
  );
}
