import { RISK_COLORS, CATEGORY_COLORS } from '@/lib/constants';
import type { RiskLevel } from '@/types';

interface BadgeProps {
  variant: RiskLevel | 'category';
  label?: string;
  category?: string;
  className?: string;
}

export function Badge({ variant, label, category, className = '' }: BadgeProps) {
  const getStyles = () => {
    if (variant === 'category' && category) {
      return CATEGORY_COLORS[category] || CATEGORY_COLORS.General;
    }
    return RISK_COLORS[variant as RiskLevel];
  };

  const displayLabel = label || category;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStyles()} ${className}`}
    >
      {displayLabel}
    </span>
  );
}
