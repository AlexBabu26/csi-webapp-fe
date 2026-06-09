import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

export interface SearchableSelectOption {
  value: string;
  label: string;
  isoCode?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  emptyMessage?: string;
  onSearchChange?: (search: string) => void;
  /** When true, option list stays hidden until the user focuses the search input. */
  initiallyCollapsed?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  disabled = false,
  required = false,
  label,
  emptyMessage = 'No options match your search.',
  onSearchChange,
  initiallyCollapsed = false,
}) => {
  const [search, setSearch] = useState('');
  const [showPicker, setShowPicker] = useState(() => {
    if (value) return false;
    return !initiallyCollapsed;
  });

  const filteredOptions = useMemo(() => {
    if (onSearchChange) return options;
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) => option.label.toLowerCase().includes(query));
  }, [options, search, onSearchChange]);

  const selectedOption = options.find((option) => option.value === value) ?? null;

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-textDark mb-1.5">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}

      {selectedOption && !showPicker ? (
        <div className="p-3 border border-borderColor rounded-lg bg-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-textMuted">Selected</p>
              <p className="font-medium text-textDark mt-0.5">{selectedOption.label}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setShowPicker(true);
              }}
              disabled={disabled}
              className="text-sm text-primary hover:underline shrink-0 disabled:opacity-60"
            >
              Change
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
            <input
              type="search"
              value={search}
              onFocus={() => {
                if (initiallyCollapsed) setShowPicker(true);
              }}
              onChange={(e) => {
                const nextSearch = e.target.value;
                setSearch(nextSearch);
                onSearchChange?.(nextSearch);
                if (initiallyCollapsed) setShowPicker(true);
              }}
              placeholder={searchPlaceholder}
              disabled={disabled}
              className="w-full pl-9 pr-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {showPicker && (
            filteredOptions.length === 0 ? (
              <p className="text-sm text-textMuted py-3 text-center">{emptyMessage}</p>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 border border-borderColor rounded-lg p-2">
                {filteredOptions.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        onChange(option.value);
                        setShowPicker(false);
                        setSearch('');
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-colors disabled:opacity-60 ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-borderColor hover:border-primary/40 hover:bg-bgLight'
                      }`}
                    >
                      <p className="font-medium text-textDark">{option.label}</p>
                    </button>
                  );
                })}
              </div>
            )
          )}

          {!value && (
            <p className="text-xs text-textMuted mt-2">{placeholder}</p>
          )}
        </>
      )}
    </div>
  );
};
