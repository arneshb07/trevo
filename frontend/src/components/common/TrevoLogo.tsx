import React from 'react';

interface TrevoLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const TrevoLogo: React.FC<TrevoLogoProps> = ({ className = '', size = 'md' }) => {
  const widthClass = size === 'sm' ? 'w-24 h-7' : size === 'lg' ? 'w-36 h-11' : 'w-28 h-8';

  return (
    <div className={`flex items-center select-none ${className}`}>
      {/* Exact curved brand wordmark "trevo" */}
      <svg 
        viewBox="0 0 160 52" 
        className={widthClass} 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M16 14V34C16 38.5 19.5 40 23 40C26.5 40 29 38 30 36.5" 
          stroke="#0F2E22" 
          strokeWidth="6.5" 
          strokeLinecap="round"
        />
        <path 
          d="M8 20H26" 
          stroke="#0F2E22" 
          strokeWidth="6.5" 
          strokeLinecap="round"
        />
        <path 
          d="M38 40V24C41 21 44 20 48 20C50.5 20 53 21 54 22.5" 
          stroke="#0F2E22" 
          strokeWidth="6.5" 
          strokeLinecap="round"
        />
        <path 
          d="M81 30H61C61 36 65 40 71 40C75 40 78 38 80 35.5M80 29C79 23 75 20 70.5 20C65 20 61 24.5 61 30" 
          stroke="#0F2E22" 
          strokeWidth="6.5" 
          strokeLinecap="round"
        />
        <path 
          d="M89 20L99.5 39C100.5 40.5 102.5 40.5 103.5 39L114 20" 
          stroke="#0F2E22" 
          strokeWidth="6.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <path 
          d="M136 20C127.5 20 121 26.5 121 35C121 43.5 127.5 50 136 50C144.5 50 151 43.5 151 35C151 26.5 144.5 20 136 20Z" 
          stroke="#0F2E22" 
          strokeWidth="6.5" 
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};
