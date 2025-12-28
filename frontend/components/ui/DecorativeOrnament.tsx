'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface DecorativeOrnamentProps {
  className?: string;
}

export const DecorativeOrnament: React.FC<DecorativeOrnamentProps> = ({ 
  className = '' 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, delay: 0.6 }}
      className={`flex items-center justify-center space-x-4 ${className}`}
    >
      <div className="w-16 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-60"></div>
      <div className="relative">
        <div className="w-3 h-3 border border-accent rotate-45 bg-accent/10"></div>
        <div className="absolute inset-0 w-3 h-3 border border-accent rotate-45 bg-accent/5 animate-pulse"></div>
      </div>
      <div className="w-16 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-60"></div>
    </motion.div>
  );
};