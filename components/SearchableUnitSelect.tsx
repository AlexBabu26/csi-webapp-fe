import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { TransferDestinationUnit } from '../types';

interface SearchableUnitSelectProps {
  units: TransferDestinationUnit[];
  value: number;
  onChange: (unitId: number) => void;
  isLoading?: boolean;
  label?: string;
  required?: boolean;
}

export const SearchableUnitSelect: React.FC<SearchableUnitSelectProps> = ({
  units,
  value,
  onChange,
  isLoading = false,
  label = 'Destination Unit',
  required = false,
}) => {
  const [search, setSearch] = useState('');
  const [showPicker, setShowPicker] = useState(value === 0);

  useEffect(() => {
    if (value === 0) {
      setShowPicker(true);
    }
  }, [value]);

  const filteredUnits = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return units;
    return units.filter(
      (unit) =>
        unit.name.toLowerCase().includes(query) ||
        unit.clergyDistrict.toLowerCase().includes(query) ||
        unit.unitNumber.toLowerCase().includes(query),
    );
  }, [units, search]);

  const selectedUnit = units.find((unit) => unit.id === value) ?? null;

  return (
    <div>
      <label className="block text-sm font-medium text-textDark mb-2">
        {label} {required && <span className="text-danger">*</span>}
      </label>

      {selectedUnit && !showPicker ? (
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-textMuted">Selected destination</p>
              <p className="font-medium text-textDark mt-0.5">
                {selectedUnit.name} - {selectedUnit.clergyDistrict}
              </p>
              <p className="text-sm text-textMuted mt-0.5">{selectedUnit.unitNumber}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setShowPicker(true);
              }}
              className="text-sm text-primary hover:underline shrink-0"
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by unit name, district, or unit number..."
              className="w-full pl-9 pr-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              disabled={isLoading}
            />
          </div>

          {isLoading ? (
            <p className="text-sm text-textMuted py-4 text-center">Loading units...</p>
          ) : filteredUnits.length === 0 ? (
            <p className="text-sm text-textMuted py-4 text-center">
              {units.length === 0
                ? 'No destination units available.'
                : 'No units match your search.'}
            </p>
          ) : (
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 border border-borderColor rounded-lg p-2">
              {filteredUnits.map((unit) => {
                const isSelected = unit.id === value;
                return (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={() => {
                      onChange(unit.id);
                      setShowPicker(false);
                      setSearch('');
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-borderColor hover:border-primary/40 hover:bg-bgLight'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-textDark truncate">{unit.name}</p>
                        <p className="text-sm text-textMuted mt-0.5">
                          {unit.clergyDistrict} • {unit.unitNumber}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-primary bg-primary' : 'border-borderColor'
                        }`}
                      >
                        {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
