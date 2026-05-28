import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ label, icon, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-400 mb-1.5">{label}</label>}
      <div className="relative group">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-[#8A2BE2] transition-colors">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg 
            py-3 ${icon ? 'pl-10' : 'pl-3'} pr-3 
            placeholder-gray-600 focus:outline-none focus:border-[#8A2BE2] focus:ring-1 focus:ring-[#8A2BE2] 
            transition-all duration-200
            ${className}
          `}
          {...props}
        />
      </div>
    </div>
  );
};

export default Input;