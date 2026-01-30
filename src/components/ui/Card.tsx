import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', glow = false, onClick }: CardProps) {
  const baseStyles = 'bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 transition-all duration-300';
  const glowStyles = glow ? 'shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20' : '';
  const clickableStyles = onClick ? 'cursor-pointer hover:border-gray-600' : '';

  return (
    <div
      className={`${baseStyles} ${glowStyles} ${clickableStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
