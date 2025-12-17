import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface ButtonProps {
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  icon?: LucideIcon;
  title?: string;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  className = "",
  variant = "primary",
  icon: Icon,
  title,
  disabled
}) => {
  // Determine padding based on content
  const hasText = !!children;
  const padding = hasText ? "px-3 py-1.5" : "p-2";
  
  const baseStyle = `flex items-center justify-center ${padding} rounded-xl font-medium transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed`;
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white focus:ring-blue-500 shadow-lg hover:shadow-xl",
    secondary: "bg-gray-100/50 hover:bg-gray-200/50 dark:bg-white/10 dark:hover:bg-white/15 backdrop-blur-sm text-gray-700 dark:text-gray-200 focus:ring-gray-400",
    danger: "bg-red-50/80 hover:bg-red-100/80 dark:bg-red-900/20 dark:hover:bg-red-900/30 backdrop-blur-sm text-red-600 dark:text-red-400 focus:ring-red-400",
    ghost: "bg-transparent hover:bg-gray-100/50 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300",
    success: "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white focus:ring-green-500 shadow-lg hover:shadow-xl"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`${baseStyle} ${variants[variant]} ${className}`} 
      title={title}
    >
      {Icon && <Icon size={16} className={hasText ? "mr-2 flex-shrink-0" : ""} />}
      {children && <span className="text-sm">{children}</span>}
    </button>
  );
};
