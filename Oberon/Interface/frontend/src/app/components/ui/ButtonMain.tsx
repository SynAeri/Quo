import Link from 'next/link';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  href?: string;  // Add this for navigation
}

const ButtonMain = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  loading = false,
  onClick,
  href  // Add href parameter
}: ButtonProps) => {
  const baseClasses = "font-medium rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantClasses = {
    primary: "bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500",
    secondary: "bg-gray-300 hover:bg-gray-400 text-gray-800 focus:ring-gray-500",
    danger: "bg-red-500 hover:bg-red-600 text-white focus:ring-red-500"
  };
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };
  
  const stateClasses = disabled || loading
    ? "opacity-50 cursor-not-allowed"
    : "transform hover:scale-105 active:scale-95";

  const className = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${stateClasses}`;

  // If href is provided, render as Link
  if (href && !disabled && !loading) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  // Otherwise, render as button
  return (
    <button 
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      className={className}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default ButtonMain;

