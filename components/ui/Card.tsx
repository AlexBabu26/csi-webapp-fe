import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  title?: string;
  onClick?: () => void;
  id?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', noPadding = false, title, onClick, id }) => {
  // Check if className contains padding (p-) to avoid double padding
  const hasPaddingInClassName = /\bp-\d/.test(className);
  const shouldApplyDefaultPadding = !noPadding && !hasPaddingInClassName && !title;
  
  return (
    <div 
      id={id}
      className={`bg-white rounded-md border border-borderColor shadow-sm overflow-hidden ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      {title && (
        <div className="px-6 py-4 border-b border-borderColor">
          <h3 className="text-lg font-semibold text-textDark">{title}</h3>
        </div>
      )}
      {title ? (
        <div className={noPadding ? '' : 'p-6'}>
          {children}
        </div>
      ) : shouldApplyDefaultPadding ? (
        <div className="p-6">
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
};
