import React, { useEffect, useState } from 'react';
import { getMediaUrl } from '../services/http';

export const ChurchLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="30" fill="#007faf" fillOpacity="0.1" />
    <path d="M32 8v12M26 14h12" stroke="#007faf" strokeWidth="3" strokeLinecap="round" />
    <path d="M20 56V32l12-8 12 8v24" stroke="#007faf" strokeWidth="2.5" fill="none" />
    <path d="M28 56V44h8v12" stroke="#007faf" strokeWidth="2" fill="#007faf" fillOpacity="0.2" />
    <path d="M24 38h4v4h-4zM36 38h4v4h-4z" fill="#007faf" fillOpacity="0.4" />
  </svg>
);

export const YouthLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="30" fill="#007faf" />
    <circle cx="32" cy="20" r="8" fill="white" />
    <path d="M20 52c0-8 5.4-14 12-14s12 6 12 14" stroke="white" strokeWidth="3" fill="none" />
    <circle cx="18" cy="26" r="5" fill="white" fillOpacity="0.7" />
    <path d="M10 46c0-5 3.2-9 8-9" stroke="white" strokeWidth="2" strokeOpacity="0.7" fill="none" />
    <circle cx="46" cy="26" r="5" fill="white" fillOpacity="0.7" />
    <path d="M54 46c0-5-3.2-9-8-9" stroke="white" strokeWidth="2" strokeOpacity="0.7" fill="none" />
  </svg>
);

export const CSLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="30" fill="#18aefa" fillOpacity="0.15" />
    <text x="32" y="28" textAnchor="middle" fill="#007faf" fontSize="14" fontWeight="bold" fontFamily="Poppins, sans-serif">CS</text>
    <text x="32" y="44" textAnchor="middle" fill="#007faf" fontSize="10" fontWeight="500" fontFamily="Poppins, sans-serif">MKD</text>
    <circle cx="32" cy="32" r="26" stroke="#007faf" strokeWidth="2" fill="none" strokeDasharray="4 2" />
  </svg>
);

interface LogoImageProps {
  src: string | null | undefined;
  fallback: React.ReactNode;
  className?: string;
  imageClassName?: string;
}

export const LogoImage: React.FC<LogoImageProps> = ({
  src,
  fallback,
  className = 'w-full h-full',
  imageClassName = 'w-full h-full object-contain',
}) => {
  const [hasError, setHasError] = useState(false);
  const imageUrl = src ? getMediaUrl(src) : null;

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!imageUrl || hasError) {
    return <div className={className}>{fallback}</div>;
  }

  return (
    <div className={className}>
      <img
        src={imageUrl}
        alt=""
        className={imageClassName}
        onError={() => setHasError(true)}
      />
    </div>
  );
};
