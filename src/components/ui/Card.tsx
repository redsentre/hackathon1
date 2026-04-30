import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'primary' | 'danger' | 'warn' | 'success';
}

export function Card({ children, className = '', glowColor }: CardProps) {
  const glowStyles = {
    primary: 'border-l-4 border-l-primary',
    danger: 'border-l-4 border-l-danger',
    warn: 'border-l-4 border-l-warn',
    success: 'border-l-4 border-l-success',
  };

  return (
    <div
      className={`bg-secondary-1 border border-primary/10 rounded-xl shadow-lg ${glowColor ? glowStyles[glowColor] : ''} ${className}`}
    >
      {children}
    </div>
  );
}
