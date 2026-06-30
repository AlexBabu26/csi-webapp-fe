import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Check, X } from 'lucide-react';

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
  /** Allow clearing the current selection from the trigger. */
  clearable?: boolean;
  /** Retained for API compatibility; the dropdown is always collapsed until opened. */
  initiallyCollapsed?: boolean;
}

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

const DROPDOWN_MAX_HEIGHT = 240;
const DROPDOWN_MIN_HEIGHT = 160;

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
  clearable = false,
}) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<DropdownPosition>({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: DROPDOWN_MAX_HEIGHT,
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const gap = 6;
    const spaceBelow = window.innerHeight - rect.bottom - gap - 8;
    const spaceAbove = rect.top - gap - 8;
    const openBelow = spaceBelow >= DROPDOWN_MIN_HEIGHT || spaceBelow >= spaceAbove;
    const availableSpace = openBelow ? spaceBelow : spaceAbove;
    const maxHeight = Math.min(
      DROPDOWN_MAX_HEIGHT,
      Math.max(DROPDOWN_MIN_HEIGHT, availableSpace),
    );

    setDropdownPos({
      top: openBelow ? rect.bottom + gap : rect.top - gap - maxHeight,
      left: rect.left,
      width: rect.width,
      maxHeight,
    });
  }, []);

  useEffect(() => {
    if (!open) return;

    updatePosition();

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || dropdownRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const handleScrollOrResize = () => updatePosition();

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => searchInputRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
    setSearch('');
  }, [open]);

  const filteredOptions = useMemo(() => {
    if (onSearchChange) return options;
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) => option.label.toLowerCase().includes(query));
  }, [options, search, onSearchChange]);

  const selectedOption = options.find((option) => option.value === value) ?? null;

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
    setSearch('');
  };

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation();
    onChange('');
    setSearch('');
    onSearchChange?.('');
  };

  const dropdownPanel = open ? (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: dropdownPos.width,
        maxHeight: dropdownPos.maxHeight,
        zIndex: 9999,
      }}
      className="flex flex-col rounded-lg border border-borderColor bg-white shadow-lg"
    >
      <div className="shrink-0 border-b border-borderColor p-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-textMuted" />
          <input
            ref={searchInputRef}
            type="search"
            value={search}
            onChange={(e) => {
              const nextSearch = e.target.value;
              setSearch(nextSearch);
              onSearchChange?.(nextSearch);
            }}
            placeholder={searchPlaceholder}
            disabled={disabled}
            className="w-full rounded-md border border-borderColor py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {filteredOptions.length === 0 ? (
        <p className="px-3 py-6 text-center text-sm text-textMuted">{emptyMessage}</p>
      ) : (
        <ul role="listbox" className="min-h-0 flex-1 overflow-y-auto p-1">
          {filteredOptions.map((option) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={disabled}
                  onClick={() => handleSelect(option.value)}
                  className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    isSelected
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-textDark hover:bg-bgLight'
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  ) : null;

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-textDark mb-1.5">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}

      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!open) updatePosition();
          setOpen((prev) => !prev);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-70 ${
          open
            ? 'border-primary ring-2 ring-primary/20'
            : 'border-borderColor hover:border-primary/40'
        }`}
      >
        <span className={`truncate ${selectedOption ? 'text-textDark' : 'text-textMuted'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {clearable && selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              className="rounded p-0.5 text-textMuted hover:bg-gray-100 hover:text-textDark"
              aria-label="Clear selection"
            >
              <X className="h-4 w-4" />
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-textMuted transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {dropdownPanel && createPortal(dropdownPanel, document.body)}
    </div>
  );
};
