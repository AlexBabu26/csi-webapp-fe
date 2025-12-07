import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  title?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', noPadding = false, title }) => {
  return (
    <div className={`bg-white rounded-md border border-borderColor shadow-sm overflow-hidden ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-borderColor">
          <h3 className="text-lg font-semibold text-textDark">{title}</h3>
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
};
