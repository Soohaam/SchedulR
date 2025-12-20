import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <div className={`bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 ${className}`}>
      {children}
    </div>
  );
};
