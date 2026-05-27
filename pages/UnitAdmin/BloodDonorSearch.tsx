import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Card, Badge, Button } from '../../components/ui';
import { DataTable, ColumnDef } from '../../components/DataTable';
import {
  Droplets, Search, X, Users, Archive,
  Phone, MapPin, Building, ChevronDown, Check, Venus, Mars,
} from 'lucide-react';
import { useToast } from '../../components/Toast';
import { BloodDonorResult } from '../../types';
import { api } from '../../services/api';
import { useSiteSettings, useAdminUnitNames, useAdminDistricts } from '../../hooks/queries';
import { getAuthUser } from '../../services/auth';

// ── Helpers ──────────────────────────────────────────────────────────────────
const calcAge = (dob: string | null): number | null => {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

// ── Blood group config ───────────────────────────────────────────────────────
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const BG_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  'A+':  { bg: 'bg-red-100',    text: 'text-red-700',    ring: 'ring-red-400' },
  'A-':  { bg: 'bg-red-50',     text: 'text-red-600',    ring: 'ring-red-300' },
  'B+':  { bg: 'bg-blue-100',   text: 'text-blue-700',   ring: 'ring-blue-400' },
  'B-':  { bg: 'bg-blue-50',    text: 'text-blue-600',   ring: 'ring-blue-300' },
  'AB+': { bg: 'bg-purple-100', text: 'text-purple-700', ring: 'ring-purple-400' },
  'AB-': { bg: 'bg-purple-50',  text: 'text-purple-600', ring: 'ring-purple-300' },
  'O+':  { bg: 'bg-green-100',  text: 'text-green-700',  ring: 'ring-green-400' },
  'O-':  { bg: 'bg-green-50',   text: 'text-green-600',  ring: 'ring-green-300' },
};

const BloodGroupBadge: React.FC<{ bg: string | null }> = ({ bg }) => {
  if (!bg) return <span className="text-textMuted text-xs">—</span>;
  const c = BG_COLORS[bg] ?? { bg: 'bg-gray-100', text: 'text-gray-700' };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${c.bg} ${c.text}`}>
      <Droplets className="w-3 h-3" />{bg}
    </span>
  );
};

// ── MultiSelect dropdown (Portal-based to escape overflow:hidden cards) ──────
interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  icon?: React.ReactNode;
}

interface DropdownPos { top: number; left: number; width: number; }

const MultiSelect: React.FC<MultiSelectProps> = ({ options, selected, onChange, placeholder, icon }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [pos, setPos] = useState<DropdownPos>({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reposition the floating dropdown to align with the trigger
  const updatePos = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: rect.width });
  };

  const handleOpen = () => {
    updatePos();
    setOpen(o => !o);
    setSearch('');
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!triggerRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    // Reposition on scroll/resize
    const reposition = () => updatePos();
    document.addEventListener('mousedown', handler);
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open]);

  const filtered = useMemo(
    () => options.filter(o => o.toLowerCase().includes(search.toLowerCase())),
    [options, search],
  );

  const toggle = (val: string) =>
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);

  const removeChip = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter(v => v !== val));
  };

  const dropdown = open ? ReactDOM.createPortal(
    <div
      ref={dropdownRef}
      style={{ position: 'absolute', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
      className="bg-white border border-borderColor rounded-xl shadow-2xl max-h-72 flex flex-col"
    >
      {/* Search */}
      <div className="p-2 border-b border-borderColor">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-textMuted" />
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>
      {/* Select all / clear */}
      {options.length > 0 && (
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-borderColor text-xs">
          <button
            onMouseDown={e => { e.preventDefault(); onChange(filtered.length === options.length ? options : filtered); }}
            className="text-primary hover:underline font-medium"
          >
            {filtered.length < options.length ? `Select ${filtered.length} filtered` : 'Select all'}
          </button>
          <button onMouseDown={e => { e.preventDefault(); onChange([]); }} className="text-textMuted hover:text-danger">
            Clear
          </button>
        </div>
      )}
      {/* Options */}
      <div className="overflow-y-auto flex-1">
        {filtered.length === 0 ? (
          <p className="text-center text-textMuted text-sm py-6">No results</p>
        ) : (
          filtered.map(opt => (
            <button
              key={opt}
              onMouseDown={e => { e.preventDefault(); toggle(opt); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition ${
                selected.includes(opt) ? 'bg-primary/5 text-primary font-medium' : 'hover:bg-gray-50 text-textDark'
              }`}
            >
              <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${
                selected.includes(opt) ? 'bg-primary border-primary' : 'border-gray-300'
              }`}>
                {selected.includes(opt) && <Check className="w-2.5 h-2.5 text-white" />}
              </span>
              {opt}
            </button>
          ))
        )}
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <div ref={triggerRef}>
      {/* Trigger */}
      <div
        onClick={handleOpen}
        className={`min-h-[40px] w-full flex flex-wrap items-center gap-1.5 px-3 py-2 border rounded-lg cursor-pointer bg-white transition select-none ${
          open ? 'border-primary ring-2 ring-primary/20' : 'border-borderColor hover:border-gray-400'
        }`}
      >
        {selected.length === 0 ? (
          <span className="flex items-center gap-2 text-textMuted text-sm flex-1">{icon}{placeholder}</span>
        ) : (
          selected.map(v => (
            <span key={v} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
              {v}
              <button onClick={(e) => removeChip(v, e)} className="hover:text-red-500 transition">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
        <ChevronDown className={`w-4 h-4 text-textMuted ml-auto flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>
      {dropdown}
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────────────
export const BloodDonorSearch: React.FC = () => {
  const { addToast } = useToast();
  const { data: siteSettings } = useSiteSettings();
  const { data: allUnitNames = [] } = useAdminUnitNames();
  const { data: allDistricts = [] } = useAdminDistricts();
  const user = getAuthUser();

  // ── Permission guard ──────────────────────────────────────────────────────
  const isAdmin = user?.user_type === '1' || user?.user_type === 'ADMIN';
  const isDistrictOfficial = user?.user_type === 'DISTRICT_OFFICIAL';
  const isUnit = user?.user_type === 'UNIT';
  const hasAccess =
    isAdmin ||
    (isDistrictOfficial && siteSettings?.blood_donor_district_access) ||
    (isUnit && siteSettings?.blood_donor_unit_access);

  // ── Search state ──────────────────────────────────────────────────────────
  const [selectedBG, setSelectedBG] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [selectedGender, setSelectedGender] = useState('');   // '' | 'M' | 'F'
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [includeArchived, setIncludeArchived] = useState(true);

  const [results, setResults] = useState<BloodDonorResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Derived sorted option lists
  const unitOptions = useMemo(
    () => [...new Set(allUnitNames.map(u => u.name))].sort(),
    [allUnitNames],
  );
  const districtOptions = useMemo(
    () => [...new Set(allDistricts.map(d => d.name))].sort(),
    [allDistricts],
  );

  const hasFilters = !!(selectedBG || nameFilter || selectedGender || selectedUnits.length || selectedDistricts.length);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.searchBloodDonors({
        blood_group: selectedBG || undefined,
        name: nameFilter.trim() || undefined,
        gender: selectedGender || undefined,
        units: selectedUnits.length ? selectedUnits : undefined,
        districts: selectedDistricts.length ? selectedDistricts : undefined,
        include_archived: includeArchived,
      });
      setResults(res.data);
      setTotal(res.total);
    } catch {
      addToast('Search failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedBG, nameFilter, selectedGender, selectedUnits, selectedDistricts, includeArchived, addToast]);

  const handleClear = () => {
    setSelectedBG('');
    setNameFilter('');
    setSelectedGender('');
    setSelectedUnits([]);
    setSelectedDistricts([]);
    setIncludeArchived(true);
    setResults([]);
    setSearched(false);
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const bgCount: Record<string, number> = {};
    let activeCount = 0;
    let archivedCount = 0;
    for (const r of results) {
      if (r.blood_group) bgCount[r.blood_group] = (bgCount[r.blood_group] ?? 0) + 1;
      if (r.status === 'active') activeCount++;
      else archivedCount++;
    }
    return { bgCount, activeCount, archivedCount };
  }, [results]);

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<BloodDonorResult, any>[]>(
    () => [
      {
        accessorKey: 'blood_group',
        header: 'Blood Group',
        cell: ({ row }) => <BloodGroupBadge bg={row.original.blood_group} />,
        size: 110,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <span className="font-semibold text-textDark">{row.original.name}</span>,
        size: 180,
      },
      {
        accessorKey: 'gender',
        header: 'Gender',
        cell: ({ row }) => (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            row.original.gender === 'M' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
          }`}>
            {row.original.gender === 'M' ? 'Male' : row.original.gender === 'F' ? 'Female' : '—'}
          </span>
        ),
        size: 80,
      },
      {
        accessorKey: 'number',
        header: 'Contact',
        cell: ({ row }) => (
          <a href={`tel:+91${row.original.number}`} className="flex items-center gap-1.5 font-mono text-sm text-primary hover:underline">
            <Phone className="w-3.5 h-3.5" />+91 {row.original.number}
          </a>
        ),
        size: 160,
      },
      {
        accessorKey: 'unit_name',
        header: 'Unit',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-sm text-textMuted">
            <Building className="w-3.5 h-3.5 flex-shrink-0" />{row.original.unit_name || '—'}
          </div>
        ),
      },
      {
        accessorKey: 'district_name',
        header: 'District',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-sm text-textMuted">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />{row.original.district_name || '—'}
          </div>
        ),
      },
      {
        accessorKey: 'dob',
        header: 'DOB / Age',
        cell: ({ row }) => {
          const dob = row.original.dob;
          const age = calcAge(dob);
          return dob ? (
            <div className="leading-tight">
              <span className="text-textDark text-sm">{new Date(dob).toLocaleDateString()}</span>
              {age !== null && (
                <span className="block text-xs text-textMuted">{age} yrs</span>
              )}
            </div>
          ) : <span className="text-textMuted">—</span>;
        },
        size: 110,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) =>
          row.original.status === 'active' ? (
            <Badge variant="success">Active</Badge>
          ) : (
            <div className="flex items-center gap-1.5">
              <Badge variant="light"><Archive className="w-3 h-3 mr-1" />Archived</Badge>
              {row.original.archive_year && <Badge variant="primary">{row.original.archive_year}</Badge>}
            </div>
          ),
        size: 140,
      },
    ],
    [],
  );

  // ── Access denied ─────────────────────────────────────────────────────────
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
          <Droplets className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-textDark">Access Restricted</h2>
        <p className="text-textMuted max-w-sm text-sm">
          Blood Donor Search is currently only available to Admins.
          Contact your administrator to request access.
        </p>
      </div>
    );
  }

  // ── Active filter chips ───────────────────────────────────────────────────
  const activeFilterChips = [
    ...(selectedBG ? [{ label: selectedBG, onRemove: () => setSelectedBG('') }] : []),
    ...(selectedGender ? [{ label: selectedGender === 'M' ? 'Male' : 'Female', onRemove: () => setSelectedGender('') }] : []),
    ...(nameFilter ? [{ label: `Name: ${nameFilter}`, onRemove: () => setNameFilter('') }] : []),
    ...selectedUnits.map(u => ({ label: u, onRemove: () => setSelectedUnits(prev => prev.filter(v => v !== u)) })),
    ...selectedDistricts.map(d => ({ label: d, onRemove: () => setSelectedDistricts(prev => prev.filter(v => v !== d)) })),
  ];

  return (
    <div className="space-y-6 animate-slide-in">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center">
            <Droplets className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">Blood Donor Search</h1>
            <p className="mt-0.5 text-sm text-textMuted">Search across all active and archived unit members</p>
          </div>
        </div>
        {searched && (
          <Button variant="outline" size="sm" onClick={handleClear}>
            <X className="w-4 h-4 mr-1.5" />Clear Search
          </Button>
        )}
      </div>

      {/* ── Search Card ──────────────────────────────────────────────────── */}
      <Card>
        {/* Blood group selector */}
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-3">
          Blood Group
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {BLOOD_GROUPS.map((bg) => {
            const c = BG_COLORS[bg];
            const active = selectedBG === bg;
            return (
              <button
                key={bg}
                onClick={() => setSelectedBG(active ? '' : bg)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all ${
                  active
                    ? `${c.bg} ${c.text} border-current shadow-sm scale-105`
                    : 'bg-white text-textMuted border-borderColor hover:border-gray-300'
                }`}
              >
                <Droplets className="w-4 h-4" />{bg}
              </button>
            );
          })}
        </div>

        {/* Secondary filters: name + gender + unit + district */}
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-3">
          Filter by Name, Gender, Unit or District
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-textMuted uppercase tracking-wide mb-1.5">Name</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
              <input
                value={nameFilter}
                onChange={e => setNameFilter(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name…"
                className="w-full pl-9 pr-3 py-2 border border-borderColor rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
            </div>
          </div>

          {/* Gender toggle */}
          <div>
            <label className="block text-xs font-semibold text-textMuted uppercase tracking-wide mb-1.5">Gender</label>
            <div className="flex gap-2">
              {(['M', 'F'] as const).map(g => {
                const active = selectedGender === g;
                const isMale = g === 'M';
                return (
                  <button
                    key={g}
                    onClick={() => setSelectedGender(active ? '' : g)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                      active
                        ? isMale
                          ? 'bg-blue-100 text-blue-700 border-blue-400 shadow-sm'
                          : 'bg-pink-100 text-pink-700 border-pink-400 shadow-sm'
                        : 'bg-white text-textMuted border-borderColor hover:border-gray-400'
                    }`}
                  >
                    {isMale ? <Mars className="w-4 h-4" /> : <Venus className="w-4 h-4" />}
                    {isMale ? 'Male' : 'Female'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Unit multi-select */}
          <div>
            <label className="block text-xs font-semibold text-textMuted uppercase tracking-wide mb-1.5">
              Unit {selectedUnits.length > 0 && <span className="normal-case text-primary font-bold">({selectedUnits.length} selected)</span>}
            </label>
            <MultiSelect
              options={unitOptions}
              selected={selectedUnits}
              onChange={setSelectedUnits}
              placeholder="Select units…"
              icon={<Building className="w-4 h-4" />}
            />
          </div>

          {/* District multi-select */}
          <div>
            <label className="block text-xs font-semibold text-textMuted uppercase tracking-wide mb-1.5">
              District {selectedDistricts.length > 0 && <span className="normal-case text-primary font-bold">({selectedDistricts.length} selected)</span>}
            </label>
            <MultiSelect
              options={districtOptions}
              selected={selectedDistricts}
              onChange={setSelectedDistricts}
              placeholder="Select districts…"
              icon={<MapPin className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4 p-3 bg-gray-50 rounded-lg border border-borderColor">
            <span className="text-xs text-textMuted self-center mr-1">Active filters:</span>
            {activeFilterChips.map((chip, i) => (
              <span key={i} className="inline-flex items-center gap-1 bg-white border border-borderColor text-textDark text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
                {chip.label}
                <button onClick={chip.onRemove} className="text-textMuted hover:text-danger ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button onClick={() => { setSelectedBG(''); setNameFilter(''); setSelectedGender(''); setSelectedUnits([]); setSelectedDistricts([]); }} className="text-xs text-danger hover:underline ml-auto">
              Clear all
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={e => setIncludeArchived(e.target.checked)}
              className="rounded border-borderColor text-primary"
            />
            <span className="text-textMuted">Include archived members</span>
          </label>
          <Button variant="primary" size="sm" onClick={handleSearch} isLoading={loading}>
            <Search className="w-4 h-4 mr-1.5" />Search Donors
          </Button>
        </div>
      </Card>

      {/* ── Result stats ─────────────────────────────────────────────────── */}
      {searched && !loading && (
        results.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="py-3 px-4">
              <p className="text-xl font-bold text-primary">{total}</p>
              <p className="text-xs text-textMuted mt-0.5 uppercase tracking-wide font-medium">Total Found</p>
            </Card>
            <Card className="py-3 px-4">
              <p className="text-xl font-bold text-success">{stats.activeCount}</p>
              <p className="text-xs text-textMuted mt-0.5 uppercase tracking-wide font-medium">Active</p>
            </Card>
            <Card className="py-3 px-4">
              <p className="text-xl font-bold text-textMuted">{stats.archivedCount}</p>
              <p className="text-xs text-textMuted mt-0.5 uppercase tracking-wide font-medium">Archived</p>
            </Card>
            {selectedBG ? (
              <Card className="py-3 px-4 flex items-center gap-3">
                <BloodGroupBadge bg={selectedBG} />
                <div>
                  <p className="text-xl font-bold text-textDark">{total}</p>
                  <p className="text-xs text-textMuted uppercase tracking-wide font-medium">Donors</p>
                </div>
              </Card>
            ) : (
              <Card className="py-3 px-4">
                <p className="text-xl font-bold text-textDark">{Object.keys(stats.bgCount).length}</p>
                <p className="text-xs text-textMuted mt-0.5 uppercase tracking-wide font-medium">Blood Groups</p>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                <Droplets className="w-6 h-6 text-textMuted" />
              </div>
              <p className="font-semibold text-textDark">No donors found</p>
              <p className="text-sm text-textMuted">Try adjusting your search filters.</p>
            </div>
          </Card>
        )
      )}

      {/* ── Results table ────────────────────────────────────────────────── */}
      {results.length > 0 && (
        <Card noPadding className="overflow-hidden">
          <div className="px-5 py-4 border-b border-borderColor bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-textDark">Donor Results</h3>
                <p className="text-xs text-textMuted">{total} member{total !== 1 ? 's' : ''} found</p>
              </div>
            </div>
            {/* Per-blood-group breakdown */}
            <div className="hidden sm:flex flex-wrap gap-1.5">
              {Object.entries(stats.bgCount)
                .sort((a, b) => b[1] - a[1])
                .map(([bg, count]) => (
                  <span key={bg} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${BG_COLORS[bg]?.bg ?? 'bg-gray-100'} ${BG_COLORS[bg]?.text ?? 'text-gray-700'}`}>
                    <Droplets className="w-3 h-3" />{bg} <span className="opacity-70">×{count}</span>
                  </span>
                ))}
            </div>
          </div>
          <div className="p-4">
            <DataTable
              data={results}
              columns={columns}
              isLoading={loading}
              showRowSelection={false}
              searchPlaceholder="Filter these results…"
              pageSize={15}
              emptyMessage="No results"
              emptyIcon={<Droplets className="w-8 h-8 text-textMuted" />}
            />
          </div>
        </Card>
      )}

      {/* ── Empty state hint ─────────────────────────────────────────────── */}
      {!searched && (
        <Card className="bg-red-50/40 border-red-100">
          <div className="flex items-start gap-3">
            <Droplets className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-textDark text-sm">How to use Blood Donor Search</p>
              <ul className="mt-2 space-y-1 text-sm text-textMuted list-disc list-inside">
                <li>Click a blood group button to filter by that type</li>
                <li>Use the <strong>Male / Female</strong> toggle to filter by gender</li>
                <li>Pick one or more units from the <strong>Unit</strong> dropdown (multi-select, searchable)</li>
                <li>Pick one or more districts from the <strong>District</strong> dropdown (multi-select, searchable)</li>
                <li>Archived members are included by default — uncheck to show active only</li>
                <li>Results show clickable phone numbers for direct contact, and age alongside DOB</li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
