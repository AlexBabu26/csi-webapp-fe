import React, { useId } from 'react';
import { AlertCircle, Phone } from 'lucide-react';
import {
  DEFAULT_PHONE_COUNTRY,
  formatPhoneForDisplay,
  normalizePhone,
  toIndianNationalInput,
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

  const handleIndiaChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 10);
    if (!digits) {
      onChange('');
      return;
    }
    const normalized = normalizePhone(digits, defaultCountry);
    onChange(normalized ?? digits);
  };

  const handleInternationalChange = (raw: string) => {
    onChange(raw.trim());
  };

  const handleInternationalBlur = () => {
    if (!value.trim()) return;
    const normalized = normalizePhone(value, defaultCountry);
    if (normalized) {
      onChange(normalized);
    }
  };

  const indiaDisplayValue = toIndianNationalInput(formatPhoneForDisplay(value));
  const internationalDisplayValue = value ? formatPhoneForDisplay(value) : '';

  const baseInputClass = isInline
    ? `w-full px-2 py-1.5 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono ${inputClassName}`
    : `w-full py-2.5 border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono ${showIcon ? 'pl-10 pr-3' : 'px-3'} ${inputClassName}`;

  const input = international ? (
    <input
      id={fieldId}
      name={name}
      type="tel"
      value={internationalDisplayValue}
      onChange={(e) => handleInternationalChange(e.target.value)}
      onBlur={handleInternationalBlur}
      placeholder={placeholder ?? '+1 555 123 4567'}
      className={baseInputClass}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      autoComplete="tel"
    />
  ) : (
    <div className="flex">
      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-borderColor bg-gray-50 text-sm text-textMuted font-mono">
        +91
      </span>
      <input
        id={fieldId}
        name={name}
        type="tel"
        inputMode="numeric"
        value={indiaDisplayValue}
        onChange={(e) => handleIndiaChange(e.target.value)}
        placeholder={placeholder ?? '10-digit mobile number'}
        className={`${baseInputClass} rounded-l-none flex-1`}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        maxLength={10}
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
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
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
