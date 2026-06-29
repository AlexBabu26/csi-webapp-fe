import React, { useId } from 'react';
import { AlertCircle, Phone } from 'lucide-react';
import {
  DEFAULT_PHONE_COUNTRY,
  formatPhoneForDisplay,
  getCallingCodePrefix,
  getPhonePlaceholder,
  normalizePhone,
  toNationalInput,
} from '../utils/phoneNumber';
import type { CountryCode } from 'libphonenumber-js';

export interface PhoneFieldProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  name?: string;
  label?: React.ReactNode;
  error?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  showIcon?: boolean;
  /** @deprecated Use defaultCountry instead */
  international?: boolean;
  defaultCountry?: CountryCode;
  variant?: 'default' | 'inline';
}

export const PhoneField: React.FC<PhoneFieldProps> = ({
  value,
  onChange,
  id,
  name,
  label,
  error,
  placeholder,
  className = '',
  inputClassName = '',
  disabled = false,
  readOnly = false,
  required = false,
  showIcon = false,
  international = false,
  defaultCountry = DEFAULT_PHONE_COUNTRY,
  variant = 'default',
}) => {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const isInline = variant === 'inline';
  const country = defaultCountry;
  const callingCodePrefix = getCallingCodePrefix(country);
  const resolvedPlaceholder = placeholder ?? getPhonePlaceholder(country);

  const handleNationalChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      onChange('');
      return;
    }
    const normalized = normalizePhone(digits, country);
    onChange(normalized ?? digits);
  };

  const handleBlur = () => {
    if (!value.trim()) return;
    const normalized = normalizePhone(value, country);
    if (normalized) {
      onChange(normalized);
    }
  };

  const nationalDisplayValue = toNationalInput(formatPhoneForDisplay(value), country);

  const baseInputClass = isInline
    ? `w-full px-2 py-1.5 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono ${inputClassName}`
    : `w-full py-2.5 border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono ${showIcon ? 'pl-10 pr-3' : 'px-3'} ${inputClassName}`;

  const input = (
    <div className="flex">
      <span
        className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-borderColor bg-gray-50 text-sm text-textMuted font-mono whitespace-nowrap"
        aria-hidden="true"
      >
        {callingCodePrefix}
      </span>
      <input
        id={fieldId}
        name={name}
        type="tel"
        inputMode="numeric"
        value={nationalDisplayValue}
        onChange={(e) => handleNationalChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={resolvedPlaceholder}
        className={`${baseInputClass} rounded-l-none flex-1`}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        maxLength={country === DEFAULT_PHONE_COUNTRY && !international ? 10 : 15}
        autoComplete="tel-national"
      />
    </div>
  );

  if (isInline) {
    return (
      <div className={className}>
        {input}
        {error && (
          <p className="mt-1 text-xs text-danger flex items-center">
            <AlertCircle className="w-3 h-3 mr-1" />
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-textDark mb-1.5">
          {label}
          {required && <span className="text-danger"> *</span>}
        </label>
      )}
      <div className={showIcon ? 'relative' : undefined}>
        {showIcon && (
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none z-10" />
        )}
        {input}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-danger flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
};
