import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "font-medium rounded-lg transition-all duration-200 py-3 px-6 flex items-center justify-center gap-2 active:scale-95";
  
  const variants = {
    // #8A2BE2 is the requested primary color
    primary: "bg-[#8A2BE2] hover:bg-[#7b26cb] text-white shadow-lg shadow-purple-900/20",
    outline: "border border-[#8A2BE2] text-[#8A2BE2] hover:bg-[#8A2BE2]/10",
    ghost: "text-gray-400 hover:text-white hover:bg-white/5",
  };

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthStyle} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;