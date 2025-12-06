
import React, { memo } from 'react';

// --- Loading Skeleton ---
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

// --- Badge ---
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'light' | 'dark';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = memo(({ children, variant = 'secondary', className = '' }) => {
  const colors = {
    primary: 'bg-primary text-white',
    secondary: 'bg-secondary text-white',
    success: 'bg-success text-white',
    warning: 'bg-warning text-dark',
    danger: 'bg-danger text-white',
    info: 'bg-info text-dark',
    light: 'bg-light text-dark border border-gray-200',
    dark: 'bg-dark text-white',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[variant]} ${className}`}>
      {children}
    </span>
  );
});

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = memo(({ children, variant = 'primary', size = 'md', isLoading = false, className = '', ...props }) => {
  const baseStyle = "inline-flex items-center justify-center font-medium rounded-[6px] transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-blue-700 focus:ring-primary shadow-sm",
    secondary: "bg-secondary text-white hover:bg-gray-600 focus:ring-secondary shadow-sm",
    danger: "bg-danger text-white hover:bg-red-700 focus:ring-danger shadow-sm",
    outline: "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-500",
    ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm h-[32px]",
    md: "px-4 py-2 text-sm h-[40px]",
    lg: "px-6 py-3 text-base h-[48px]",
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </>
      ) : children}
    </button>
  );
});

// --- Card ---
interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', noPadding = false }) => {
  return (
    <div className={`bg-white rounded-[6px] border border-border-color shadow-card overflow-hidden ${className}`}>
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
};

// --- Common Input Styles ---
const inputBaseStyles = "block w-full rounded-[6px] border border-border-color px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-shadow";
const labelStyles = "block text-sm font-medium text-gray-700 mb-1.5";
const errorStyles = "border-danger focus:border-danger focus:ring-danger";

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = memo(({ label, helperText, error, className = '', ...props }) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className={labelStyles}>
          {label} {props.required && <span className="text-danger">*</span>}
        </label>
      )}
      <input
        className={`${inputBaseStyles} ${error ? errorStyles : ''}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
    </div>
  );
});

// --- Select ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    helperText?: string;
    error?: string;
    options: { value: string | number; label: string }[];
}

export const Select: React.FC<SelectProps> = memo(({ label, helperText, error, options, className = '', ...props }) => {
    return (
        <div className={`mb-4 ${className}`}>
            {label && (
                <label className={labelStyles}>
                    {label} {props.required && <span className="text-danger">*</span>}
                </label>
            )}
            <select
                className={`${inputBaseStyles} ${error ? errorStyles : ''} bg-white`}
                {...props}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && <p className="mt-1 text-xs text-danger">{error}</p>}
            {helperText && !error && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
        </div>
    );
});

// --- Table ---
interface TableProps {
  headers: string[];
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ headers, children, className = '' }) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200 border border-border-color rounded-[6px]">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            {headers.map((h, i) => (
              <th key={i} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {children}
        </tbody>
      </table>
    </div>
  );
};

export const TableRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tr className="hover:bg-gray-50 transition-colors">
    {children}
  </tr>
);

export const TableCell: React.FC<{ children: React.ReactNode; className?: string; align?: 'left' | 'right' | 'center' }> = ({ children, className = '', align = 'left' }) => {
  const alignment = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${alignment} ${className}`}>
      {children}
    </td>
  );
};
