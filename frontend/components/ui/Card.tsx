import React from 'react';
import { cn } from '@/lib/utils';

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({
  children,
  className,
  onClick,
}) => {
    return (
      <div
        className={cn("bg-card text-card-foreground py-8 px-4 shadow-sm border border-border sm:rounded-xl sm:px-10", className)}
        onClick={onClick}
      >
        {children}
      </div>
    );
  };
