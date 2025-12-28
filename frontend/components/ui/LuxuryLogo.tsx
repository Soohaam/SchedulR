'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface LuxuryLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LuxuryLogo: React.FC<LuxuryLogoProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12 text-xl',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-20 h-20 text-3xl'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05, rotate: -2 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`${sizeClasses[size]} ${className}`}
    >
      <div className="relative w-full h-full">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-accent/30 animate-pulse" />
        
        {/* Inner circle with gradient */}
        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-accent via-accent/80 to-accent/60 flex items-center justify-center shadow-2xl">
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent/20 to-transparent animate-pulse" />
          
          {/* Letter S */}
          <span className="relative z-10 font-bold text-accent-foreground font-serif">
            S
          </span>
          
          {/* Shine effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-60" />
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-pulse delay-500" />
        <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-accent/60 rounded-full animate-pulse delay-1000" />
      </div>
    </motion.div>
  );
};