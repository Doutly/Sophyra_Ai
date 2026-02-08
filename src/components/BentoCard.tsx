import { ReactNode } from 'react';

interface BentoCardProps {
  children: ReactNode;
  variant?: 'default' | 'featured' | 'accent';
  className?: string;
  onClick?: () => void;
}

export default function BentoCard({
  children,
  variant = 'default',
  className = '',
  onClick
}: BentoCardProps) {
  const baseStyles = 'rounded-2xl p-6 transition-all duration-300';

  const variantStyles = {
    default: 'bg-white border border-gray-200 shadow-swiss-sm hover:shadow-swiss-md',
    featured: 'bg-gradient-to-br from-brand-electric/10 to-white border border-brand-electric shadow-swiss-md hover:shadow-swiss-lg',
    accent: 'bg-brand-electric/10 border border-brand-electric shadow-swiss-sm hover:shadow-swiss-md',
  };

  const cursorStyle = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${cursorStyle} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
