import React, { useEffect, useMemo, useState } from 'react';
import { SearchableSelect, SearchableSelectOption } from './SearchableSelect';
import { api } from '../services/api';
import { ResidenceFormValue } from '../utils/memberResidence';

interface MemberResidenceFieldsProps {
  value: ResidenceFormValue;
  onChange: (value: ResidenceFormValue) => void;
  disabled?: boolean;
}

const toOption = (id: number, label: string, extra?: Partial<SearchableSelectOption>): SearchableSelectOption => ({
  value: String(id),
  label,
  ...extra,
});

export const MemberResidenceFields: React.FC<MemberResidenceFieldsProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [countries, setCountries] = useState<SearchableSelectOption[]>([]);
  const [states, setStates] = useState<SearchableSelectOption[]>([]);
  const [cities, setCities] = useState<SearchableSelectOption[]>([]);
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
        setStates(rows.map((state) => toOption(state.id, state.name)));
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

  useEffect(() => {
    if (value.livesInKerala !== false || !value.stateId) {
      setCities([]);
      return;
    }

    let active = true;
    setLoadingCities(true);

    api
      .getMasterCities(value.stateId, debouncedCitySearch || undefined)
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
  }, [value.livesInKerala, value.stateId, debouncedCitySearch]);

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
    if (value.stateId && !selectedState) {
      return [toOption(value.stateId, `State #${value.stateId}`), ...states];
    }
    return states;
  }, [states, selectedState, value.stateId]);

  const cityOptions = useMemo(() => {
    if (value.cityId && !selectedCity) {
      return [toOption(value.cityId, `City #${value.cityId}`), ...cities];
    }
    return cities;
  }, [cities, selectedCity, value.cityId]);

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
              onChange={() =>
                onChange({
                  livesInKerala: true,
                  countryId: null,
                  stateId: null,
                  cityId: null,
                })
              }
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
              onChange={() =>
                onChange({
                  livesInKerala: false,
                  countryId: value.countryId,
                  stateId: value.stateId,
                  cityId: value.cityId,
                  countryIsoCode: value.countryIsoCode,
                })
              }
              className="text-primary focus:ring-primary/20"
            />
            No
          </label>
        </div>
      </fieldset>

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
          <SearchableSelect
            key={value.stateId ?? 'no-state'}
            label="City (optional)"
            initiallyCollapsed
            value={value.cityId ? String(value.cityId) : ''}
            onChange={(cityValue) =>
              onChange({
                ...value,
                livesInKerala: false,
                cityId: cityValue ? Number(cityValue) : null,
              })
            }
            options={cityOptions}
            placeholder={
              !value.stateId
                ? 'Select a state first'
                : cities.length === 0 && !loadingCities
                  ? 'No cities listed — state is enough'
                  : 'Optional — click search to pick a city'
            }
            searchPlaceholder="Search cities (optional)..."
            disabled={disabled || !value.stateId || loadingCities}
            onSearchChange={setCitySearch}
            emptyMessage={
              !value.stateId
                ? 'Select a state to load cities.'
                : loadingCities
                  ? 'Loading cities...'
                  : 'No cities match your search. You can save with country and state only.'
            }
          />
          <p className="text-xs text-textMuted md:col-span-3">
            Country and state are required. City is optional — for example, selecting Dubai (UAE) is enough without a city.
          </p>
        </div>
      )}
    </div>
  );
};
