import React, { useEffect, useMemo, useState } from 'react';
import { SearchableSelect, SearchableSelectOption } from './SearchableSelect';
import { api } from '../services/api';
import { ResidenceFormValue } from '../utils/memberResidence';

interface MemberResidenceFieldsProps {
  value: ResidenceFormValue;
  onChange: (value: ResidenceFormValue) => void;
  disabled?: boolean;
}

interface KeralaMasterIds {
  countryId: number;
  stateId: number;
}

const toOption = (id: number, label: string, extra?: Partial<SearchableSelectOption>): SearchableSelectOption => ({
  value: String(id),
  label,
  ...extra,
});

const LockedLocationField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <label className="block text-sm font-medium text-textDark mb-1.5">{label}</label>
    <div className="p-3 border border-borderColor rounded-lg bg-gray-50 text-sm text-textDark">{value}</div>
  </div>
);

export const MemberResidenceFields: React.FC<MemberResidenceFieldsProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [countries, setCountries] = useState<SearchableSelectOption[]>([]);
  const [states, setStates] = useState<SearchableSelectOption[]>([]);
  const [cities, setCities] = useState<SearchableSelectOption[]>([]);
  const [keralaIds, setKeralaIds] = useState<KeralaMasterIds | null>(null);
  const [countrySearch, setCountrySearch] = useState('');
  const [stateSearch, setStateSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [debouncedCountrySearch, setDebouncedCountrySearch] = useState('');
  const [debouncedStateSearch, setDebouncedStateSearch] = useState('');
  const [debouncedCitySearch, setDebouncedCitySearch] = useState('');
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedCountrySearch(countrySearch), 300);
    return () => window.clearTimeout(timer);
  }, [countrySearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedStateSearch(stateSearch), 300);
    return () => window.clearTimeout(timer);
  }, [stateSearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedCitySearch(citySearch), 300);
    return () => window.clearTimeout(timer);
  }, [citySearch]);

  useEffect(() => {
    let active = true;

    api
      .getMasterCountries('India')
      .then(async (rows) => {
        if (!active) return;
        const india =
          rows.find((country) => (country.iso_code || '').toUpperCase() === 'IN') ??
          rows.find((country) => country.name.toLowerCase() === 'india');
        if (!india) return;

        const stateRows = await api.getMasterStates(india.id, 'Kerala');
        if (!active) return;
        const kerala = stateRows.find((state) => state.name === 'Kerala');
        if (!kerala) return;

        setKeralaIds({ countryId: india.id, stateId: kerala.id });
      })
      .catch(() => {
        if (active) setLoadError('Unable to load Kerala location data.');
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (value.livesInKerala !== true || !keralaIds) return;

    const needsSync =
      value.countryId !== keralaIds.countryId ||
      value.stateId !== keralaIds.stateId ||
      value.countryIsoCode !== 'IN';

    if (needsSync) {
      onChange({
        ...value,
        livesInKerala: true,
        countryId: keralaIds.countryId,
        stateId: keralaIds.stateId,
        countryIsoCode: 'IN',
      });
    }
  }, [
    value.livesInKerala,
    value.countryId,
    value.stateId,
    value.countryIsoCode,
    value.cityId,
    keralaIds,
    onChange,
    value,
  ]);

  useEffect(() => {
    if (value.livesInKerala !== false) return;

    let active = true;
    setLoadingCountries(true);
    setLoadError('');

    api
      .getMasterCountries(debouncedCountrySearch || undefined)
      .then((rows) => {
        if (!active) return;
        setCountries(
          rows.map((country) =>
            toOption(country.id, country.name, { isoCode: country.iso_code || undefined }),
          ),
        );
      })
      .catch(() => {
        if (active) setLoadError('Unable to load countries. Please try again.');
      })
      .finally(() => {
        if (active) setLoadingCountries(false);
      });

    return () => {
      active = false;
    };
  }, [value.livesInKerala, debouncedCountrySearch]);

  useEffect(() => {
    if (value.livesInKerala !== false || !value.countryId) {
      setStates([]);
      return;
    }

    let active = true;
    setLoadingStates(true);

    api
      .getMasterStates(value.countryId, debouncedStateSearch || undefined)
      .then((rows) => {
        if (!active) return;
        setStates(
          rows
            .filter((state) => state.name !== 'Kerala')
            .map((state) => toOption(state.id, state.name)),
        );
      })
      .catch(() => {
        if (active) setLoadError('Unable to load states. Please try again.');
      })
      .finally(() => {
        if (active) setLoadingStates(false);
      });

    return () => {
      active = false;
    };
  }, [value.livesInKerala, value.countryId, debouncedStateSearch]);

  const activeStateId = value.stateId;

  useEffect(() => {
    if (!activeStateId) {
      setCities([]);
      return;
    }

    let active = true;
    setLoadingCities(true);

    api
      .getMasterCities(activeStateId, debouncedCitySearch || undefined)
      .then((rows) => {
        if (!active) return;
        setCities(rows.map((city) => toOption(city.id, city.name)));
      })
      .catch(() => {
        if (active) setLoadError('Unable to load cities. Please try again.');
      })
      .finally(() => {
        if (active) setLoadingCities(false);
      });

    return () => {
      active = false;
    };
  }, [activeStateId, debouncedCitySearch]);

  const selectedCountry = useMemo(
    () => countries.find((country) => country.value === String(value.countryId ?? '')),
    [countries, value.countryId],
  );

  const selectedState = useMemo(
    () => states.find((state) => state.value === String(value.stateId ?? '')),
    [states, value.stateId],
  );

  const selectedCity = useMemo(
    () => cities.find((city) => city.value === String(value.cityId ?? '')),
    [cities, value.cityId],
  );

  const countryOptions = useMemo(() => {
    if (value.countryId && !selectedCountry) {
      return [toOption(value.countryId, `Country #${value.countryId}`), ...countries];
    }
    return countries;
  }, [countries, selectedCountry, value.countryId]);

  const stateOptions = useMemo(() => {
    if (value.stateId && !selectedState && value.livesInKerala === false) {
      return [toOption(value.stateId, `State #${value.stateId}`), ...states];
    }
    return states;
  }, [states, selectedState, value.stateId, value.livesInKerala]);

  const cityOptions = useMemo(() => {
    if (value.cityId && !selectedCity) {
      return [toOption(value.cityId, `City #${value.cityId}`), ...cities];
    }
    return cities;
  }, [cities, selectedCity, value.cityId]);

  const handleYesSelect = () => {
    onChange({
      livesInKerala: true,
      countryId: keralaIds?.countryId ?? null,
      stateId: keralaIds?.stateId ?? null,
      cityId: value.livesInKerala === true ? value.cityId : null,
      countryIsoCode: 'IN',
    });
    if (value.livesInKerala !== true) setCitySearch('');
  };

  const handleNoSelect = () => {
    onChange({
      livesInKerala: false,
      countryId: null,
      stateId: null,
      cityId: null,
      countryIsoCode: undefined,
    });
    setCountrySearch('');
    setStateSearch('');
    setCitySearch('');
  };

  const citySelect = (
    <SearchableSelect
      key={`city-${activeStateId ?? 'none'}`}
      label="City (optional)"
      initiallyCollapsed
      value={value.cityId ? String(value.cityId) : ''}
      onChange={(cityValue) =>
        onChange({
          ...value,
          cityId: cityValue ? Number(cityValue) : null,
        })
      }
      options={cityOptions}
      placeholder={
        !activeStateId
          ? 'Select a state first'
          : cities.length === 0 && !loadingCities
            ? 'No cities listed — state is enough'
            : 'Optional — click search to pick a city'
      }
      searchPlaceholder="Search cities (optional)..."
      disabled={disabled || !activeStateId || loadingCities}
      onSearchChange={setCitySearch}
      emptyMessage={
        !activeStateId
          ? 'Select a state to load cities.'
          : loadingCities
            ? 'Loading cities...'
            : 'No cities match your search. You can save without selecting a city.'
      }
    />
  );

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="block text-sm font-medium text-textDark mb-2">
          Lives in Kerala <span className="text-danger">*</span>
        </legend>
        <div className="flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-textDark cursor-pointer">
            <input
              type="radio"
              name="lives-in-kerala"
              checked={value.livesInKerala === true}
              disabled={disabled}
              onChange={handleYesSelect}
              className="text-primary focus:ring-primary/20"
            />
            Yes
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-textDark cursor-pointer">
            <input
              type="radio"
              name="lives-in-kerala"
              checked={value.livesInKerala === false}
              disabled={disabled}
              onChange={handleNoSelect}
              className="text-primary focus:ring-primary/20"
            />
            No
          </label>
        </div>
      </fieldset>

      {value.livesInKerala === true && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loadError && <p className="text-sm text-danger md:col-span-3">{loadError}</p>}
          <LockedLocationField label="Country" value="India" />
          <LockedLocationField label="State" value="Kerala" />
          {citySelect}
          <p className="text-xs text-textMuted md:col-span-3">
            Members living in Kerala are recorded under India and Kerala. City is optional.
          </p>
        </div>
      )}

      {value.livesInKerala === false && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loadError && <p className="text-sm text-danger md:col-span-3">{loadError}</p>}
          <SearchableSelect
            label="Country"
            required
            value={value.countryId ? String(value.countryId) : ''}
            onChange={(countryValue) => {
              const option = countryOptions.find((country) => country.value === countryValue);
              onChange({
                ...value,
                livesInKerala: false,
                countryId: countryValue ? Number(countryValue) : null,
                stateId: null,
                cityId: null,
                countryIsoCode: option?.isoCode,
              });
              setStateSearch('');
              setCitySearch('');
            }}
            options={countryOptions}
            placeholder="Select country"
            searchPlaceholder="Search countries..."
            disabled={disabled || loadingCountries}
            onSearchChange={setCountrySearch}
            emptyMessage={loadingCountries ? 'Loading countries...' : 'No countries match your search.'}
          />
          <SearchableSelect
            key={`state-${value.countryId ?? 'none'}`}
            label="State / Emirate"
            required
            value={value.stateId ? String(value.stateId) : ''}
            onChange={(stateValue) => {
              onChange({
                ...value,
                livesInKerala: false,
                stateId: stateValue ? Number(stateValue) : null,
                cityId: null,
              });
              setCitySearch('');
            }}
            options={stateOptions}
            placeholder={value.countryId ? 'Select state' : 'Select a country first'}
            searchPlaceholder="Search states..."
            disabled={disabled || !value.countryId || loadingStates}
            onSearchChange={setStateSearch}
            emptyMessage={
              !value.countryId
                ? 'Select a country to load states.'
                : loadingStates
                  ? 'Loading states...'
                  : 'No states match your search.'
            }
          />
          {citySelect}
          <p className="text-xs text-textMuted md:col-span-3">
            Country and state are required. City is optional — for example, selecting Dubai (UAE) is enough without a city.
          </p>
        </div>
      )}
    </div>
  );
};
