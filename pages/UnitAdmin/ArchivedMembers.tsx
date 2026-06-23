import React, { useState, useMemo, useEffect, useRef } from 'react';
import { formatDateIST, getCurrentYearIST } from '../../utils/datetime';
import { Card, Badge, Button, IconButton } from '../../components/ui';
import { DataTable, ColumnDef } from '../../components/DataTable';
import {
  Download, RotateCcw, Archive, Save, SlidersHorizontal,
  CalendarCheck, AlertTriangle, CheckSquare, Square, Users,
  ChevronDown, ChevronUp, Filter, RefreshCw,
} from 'lucide-react';
import { useToast } from '../../components/Toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { api } from '../../services/api';
import { downloadBlob } from '../../services/download';
import { ArchivedMember, ArchivePreviewMember } from '../../types';
import {
  useArchivedMembers,
  useRestoreMember,
  useSiteSettings,
  useUpdateSiteSettings,
  useArchivePreview,
  useBulkArchive,
} from '../../hooks/queries';

// ─── small helpers ────────────────────────────────────────────────────────────
const StatCard: React.FC<{ label: string; value: string | number; sub?: string; color?: string }> = ({
  label, value, sub, color = 'text-textDark',
}) => (
  <div className="flex flex-col gap-0.5">
    <span className={`text-2xl font-bold ${color}`}>{value}</span>
    <span className="text-xs font-medium text-textMuted uppercase tracking-wide">{label}</span>
    {sub && <span className="text-xs text-textMuted">{sub}</span>}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
export const ArchivedMembers: React.FC = () => {
  const { addToast } = useToast();

  // ── DOB limits ──────────────────────────────────────────────────────────────
  const { data: siteSettings } = useSiteSettings();
  const updateSettingsMutation = useUpdateSiteSettings();
  const [minDob, setMinDob] = useState('1990-01-01');
  const [maxDob, setMaxDob] = useState('2011-12-31');
  const [dobError, setDobError] = useState('');

  useEffect(() => {
    if (siteSettings) {
      setMinDob(siteSettings.member_min_dob ?? '1990-01-01');
      setMaxDob(siteSettings.member_max_dob ?? '2011-12-31');
    }
  }, [siteSettings]);

  const handleSaveAgeLimits = () => {
    if (!minDob || !maxDob) { setDobError('Both dates are required.'); return; }
    if (minDob >= maxDob) { setDobError('Min DOB must be earlier than Max DOB.'); return; }
    setDobError('');
    updateSettingsMutation.mutate({ member_min_dob: minDob, member_max_dob: maxDob });
  };

  // ── Yearly archive review ───────────────────────────────────────────────────
  const { data: previewData, isLoading: previewLoading, refetch: refetchPreview } = useArchivePreview();
  const bulkArchiveMutation = useBulkArchive();
  const currentYear = getCurrentYearIST();
  const [archiveYear, setArchiveYear] = useState(String(currentYear));
  const [archiveReason, setArchiveReason] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(true);
  const [previewPage, setPreviewPage] = useState(1);
  const PREVIEW_PAGE_SIZE = 10;

  const previewMembers: ArchivePreviewMember[] = previewData?.data ?? [];
  const previewTotalPages = Math.ceil(previewMembers.length / PREVIEW_PAGE_SIZE);
  const pagedPreview = previewMembers.slice(
    (previewPage - 1) * PREVIEW_PAGE_SIZE,
    previewPage * PREVIEW_PAGE_SIZE,
  );

  useEffect(() => {
    if (previewMembers.length > 0) setSelectedIds(new Set(previewMembers.map((m) => m.id)));
  }, [previewMembers.length]);

  const toggleSelectAll = () =>
    setSelectedIds(
      selectedIds.size === previewMembers.length
        ? new Set()
        : new Set(previewMembers.map((m) => m.id)),
    );

  const toggleMember = (id: number) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleBulkArchiveConfirm = () => {
    bulkArchiveMutation.mutate(
      { member_ids: Array.from(selectedIds), archive_year: archiveYear, archive_reason: archiveReason || undefined },
      {
        onSuccess: () => {
          setShowBulkConfirm(false);
          setSelectedIds(new Set());
          refetchPreview();
        },
      },
    );
  };

  // ── Archived members list ──────────────────────────────────────────────────
  const { data: members = [], isLoading: loading, refetch } = useArchivedMembers();
  const restoreMutation = useRestoreMember();
  const [selectedMember, setSelectedMember] = useState<ArchivedMember | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [exportingFormat, setExportingFormat] = useState<'xlsx' | 'csv' | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [exportMenuOpen]);

  const archiveYears = useMemo(() => {
    const years = new Set(members.map((m) => m.archiveYear).filter(Boolean) as string[]);
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [members]);

  const filteredMembers = useMemo(
    () => (yearFilter === 'all' ? members : members.filter((m) => m.archiveYear === yearFilter)),
    [members, yearFilter],
  );

  const handleRestore = (member: ArchivedMember) => { setSelectedMember(member); setShowRestoreDialog(true); };
  const handleConfirmRestore = () => {
    if (!selectedMember) return;
    restoreMutation.mutate(selectedMember.id, {
      onSuccess: () => { setShowRestoreDialog(false); setSelectedMember(null); },
    });
  };

  const handleExport = async (format: 'xlsx' | 'csv') => {
    setExportMenuOpen(false);
    setExportingFormat(format);
    try {
      const blob = await api.exportArchivedMembers({ format, archiveYear: yearFilter });
      const yearSuffix = yearFilter === 'all' ? 'all' : yearFilter.replace(/[/\\]/g, '-');
      downloadBlob(blob, `archived_members_${yearSuffix}.${format === 'xlsx' ? 'xlsx' : 'csv'}`);
      addToast(`Archived members exported as ${format.toUpperCase()}`, 'success');
    } catch {
      addToast('Failed to export archived members', 'error');
    } finally {
      setExportingFormat(null);
    }
  };

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<ArchivedMember, any>[]>(
    () => [
      {
        accessorKey: 'archivedAt',
        header: 'Archived',
        cell: ({ row }) => (
          <span className="text-textMuted text-sm whitespace-nowrap">
            {formatDateIST(row.original.archivedAt)}
          </span>
        ),
        size: 100,
      },
      {
        accessorKey: 'name',
        header: 'Member',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-textDark text-sm leading-tight">{row.original.name}</p>
            <p className="text-xs text-textMuted mt-0.5">{row.original.unitName || '—'}</p>
          </div>
        ),
        size: 180,
      },
      {
        accessorKey: 'gender',
        header: 'Gender',
        cell: ({ row }) => (
          <Badge variant={row.original.gender === 'M' ? 'primary' : 'light'}>
            {row.original.gender === 'M' ? 'Male' : 'Female'}
          </Badge>
        ),
        size: 80,
      },
      {
        accessorKey: 'dob',
        header: 'DOB / Age',
        cell: ({ row }) => (
          <div>
            <p className="text-sm text-textDark">{formatDateIST(row.original.dob)}</p>
            <p className="text-xs text-textMuted">{row.original.age} yrs</p>
          </div>
        ),
        size: 110,
      },
      {
        accessorKey: 'number',
        header: 'Contact',
        cell: ({ row }) => (
          <span className="font-mono text-textMuted text-sm">+91 {row.original.number}</span>
        ),
        size: 140,
      },
      {
        accessorKey: 'qualification',
        header: 'Qualification',
        cell: ({ row }) => (
          <span className="text-textMuted text-sm">{row.original.qualification || '—'}</span>
        ),
      },
      {
        accessorKey: 'bloodGroup',
        header: 'Blood',
        cell: ({ row }) => (
          <span className="text-textMuted text-sm">{row.original.bloodGroup || '—'}</span>
        ),
        size: 70,
      },
      {
        accessorKey: 'archiveYear',
        header: 'Year',
        cell: ({ row }) =>
          row.original.archiveYear ? (
            <Badge variant="primary" className="font-semibold">{row.original.archiveYear}</Badge>
          ) : (
            <span className="text-textMuted text-xs">—</span>
          ),
        size: 80,
      },
      {
        accessorKey: 'archiveReason',
        header: 'Reason',
        cell: ({ row }) => (
          <span className="text-textMuted text-xs italic">
            {row.original.archiveReason || 'Not specified'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <IconButton
            icon={<RotateCcw className="w-4 h-4" />}
            tooltip="Restore to active members"
            variant="info"
            onClick={() => handleRestore(row.original)}
          />
        ),
        enableSorting: false,
        size: 60,
      },
    ],
    [],
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-slide-in">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">Archive Members</h1>
          <p className="mt-1 text-sm text-textMuted">Manage DOB limits, review yearly candidates, and restore members</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { refetch(); refetchPreview(); }}>
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* ── Stats strip ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="py-4 px-5">
          <StatCard label="Total Archived" value={members.length} color="text-primary" />
        </Card>
        <Card className="py-4 px-5">
          <StatCard
            label="Eligible This Year"
            value={previewLoading ? '…' : previewMembers.length}
            color={previewMembers.length > 0 ? 'text-warning' : 'text-success'}
          />
        </Card>
        <Card className="py-4 px-5">
          <StatCard label="Min DOB Limit" value={minDob} sub="Oldest allowed" />
        </Card>
        <Card className="py-4 px-5">
          <StatCard label="Max DOB Limit" value={maxDob} sub="Youngest allowed" />
        </Card>
      </div>

      {/* ── DOB Limits ───────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-textDark text-sm">Member Registration DOB Limits</h3>
            <p className="text-xs text-textMuted">Controls which dates of birth are accepted for new member registration</p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-semibold text-textMuted uppercase tracking-wide mb-1.5">
              Min DOB <span className="normal-case font-normal">(oldest member)</span>
            </label>
            <input
              type="date"
              value={minDob}
              onChange={(e) => { setMinDob(e.target.value); setDobError(''); }}
              className="px-3 py-2 border border-borderColor rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
          </div>
          <div className="flex items-end pb-2 text-textMuted">→</div>
          <div>
            <label className="block text-xs font-semibold text-textMuted uppercase tracking-wide mb-1.5">
              Max DOB <span className="normal-case font-normal">(youngest member)</span>
            </label>
            <input
              type="date"
              value={maxDob}
              onChange={(e) => { setMaxDob(e.target.value); setDobError(''); }}
              className="px-3 py-2 border border-borderColor rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
          </div>
          <Button variant="primary" size="sm" onClick={handleSaveAgeLimits} isLoading={updateSettingsMutation.isPending}>
            <Save className="w-4 h-4 mr-1.5" />
            Save Limits
          </Button>
        </div>

        {dobError && (
          <p className="mt-2 text-sm text-danger flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />{dobError}
          </p>
        )}
      </Card>

      {/* ── Yearly Archive Review ────────────────────────────────────── */}
      <Card>
        {/* Collapsible header */}
        <button
          onClick={() => setReviewOpen((v) => !v)}
          className="w-full flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-center flex-shrink-0">
              <CalendarCheck className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-textDark text-sm">Yearly Archive Review</h3>
              <p className="text-xs text-textMuted">
                {previewLoading
                  ? 'Checking eligible members…'
                  : previewMembers.length === 0
                    ? 'All active members are within the current DOB limits'
                    : `${previewMembers.length} member${previewMembers.length !== 1 ? 's' : ''} outside DOB range — ready to review`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!previewLoading && previewMembers.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                {previewMembers.length} eligible
              </span>
            )}
            {reviewOpen
              ? <ChevronUp className="w-4 h-4 text-textMuted group-hover:text-textDark transition" />
              : <ChevronDown className="w-4 h-4 text-textMuted group-hover:text-textDark transition" />}
          </div>
        </button>

        {reviewOpen && (
          <div className="mt-5 pt-5 border-t border-borderColor">
            {/* DOB range context */}
            <div className="mb-4 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 flex-shrink-0" />
              Members with DOB outside&nbsp;
              <strong>{previewData?.min_dob ?? minDob}</strong>
              &nbsp;→&nbsp;
              <strong>{previewData?.max_dob ?? maxDob}</strong>
              &nbsp;are shown below.
            </div>

            {/* Year label + reason */}
            <div className="flex flex-wrap items-end gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-textMuted uppercase tracking-wide mb-1.5">Archive Year Label</label>
                <input
                  type="text"
                  value={archiveYear}
                  onChange={(e) => setArchiveYear(e.target.value)}
                  placeholder="e.g. 2026"
                  className="w-32 px-3 py-2 border border-borderColor rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>
              <div className="flex-1 min-w-48">
                <label className="block text-xs font-semibold text-textMuted uppercase tracking-wide mb-1.5">
                  Reason <span className="normal-case font-normal text-textMuted">(optional)</span>
                </label>
                <input
                  type="text"
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  placeholder="e.g. Annual DOB limit update"
                  className="w-full px-3 py-2 border border-borderColor rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>
            </div>

            {/* Member list */}
            {previewLoading ? (
              <div className="flex items-center justify-center gap-3 py-10 text-textMuted text-sm">
                <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                Loading eligible members…
              </div>
            ) : previewMembers.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                  <CheckSquare className="w-6 h-6 text-success" />
                </div>
                <p className="font-semibold text-textDark text-sm">All clear!</p>
                <p className="text-xs text-textMuted">No active members fall outside the current DOB limits.</p>
              </div>
            ) : (
              <>
                {/* Selection toolbar */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                    <AlertTriangle className="w-4 h-4" />
                    {selectedIds.size} / {previewMembers.length} selected
                  </div>
                  <button
                    onClick={toggleSelectAll}
                    className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition"
                  >
                    {selectedIds.size === previewMembers.length
                      ? <><CheckSquare className="w-3.5 h-3.5" /> Deselect All</>
                      : <><Square className="w-3.5 h-3.5" /> Select All</>}
                  </button>
                </div>

                {/* Table */}
                <div className="rounded-xl border border-borderColor overflow-hidden mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-borderColor">
                        <th className="px-3 py-2.5 w-10">
                          <input
                            type="checkbox"
                            checked={selectedIds.size === previewMembers.length && previewMembers.length > 0}
                            onChange={toggleSelectAll}
                            className="rounded border-borderColor"
                          />
                        </th>
                        {['Name', 'Unit', 'DOB', 'Age', 'Gender', 'Phone'].map((h) => (
                          <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-textMuted uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-borderColor">
                      {pagedPreview.map((m) => (
                        <tr
                          key={m.id}
                          onClick={() => toggleMember(m.id)}
                          className={`cursor-pointer transition-colors ${
                            selectedIds.has(m.id) ? 'bg-amber-50 hover:bg-amber-100/70' : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(m.id)}
                              onChange={() => toggleMember(m.id)}
                              className="rounded border-borderColor"
                            />
                          </td>
                          <td className="px-3 py-2.5 font-medium text-textDark">{m.name}</td>
                          <td className="px-3 py-2.5 text-textMuted text-xs">{m.unit_name ?? '—'}</td>
                          <td className="px-3 py-2.5 text-textMuted font-mono text-xs">{m.dob}</td>
                          <td className="px-3 py-2.5 text-textMuted">{m.age} yrs</td>
                          <td className="px-3 py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              m.gender === 'M' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                            }`}>
                              {m.gender === 'M' ? 'Male' : m.gender === 'F' ? 'Female' : m.gender ?? '—'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-textMuted font-mono text-xs">{m.number}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination for preview */}
                {previewTotalPages > 1 && (
                  <div className="flex items-center justify-between text-xs text-textMuted mb-4">
                    <span>Page {previewPage} of {previewTotalPages} ({previewMembers.length} members)</span>
                    <div className="flex gap-1">
                      <button
                        disabled={previewPage === 1}
                        onClick={() => setPreviewPage((p) => p - 1)}
                        className="px-2.5 py-1 rounded border border-borderColor disabled:opacity-40 hover:bg-gray-50 transition"
                      >←</button>
                      <button
                        disabled={previewPage === previewTotalPages}
                        onClick={() => setPreviewPage((p) => p + 1)}
                        className="px-2.5 py-1 rounded border border-borderColor disabled:opacity-40 hover:bg-gray-50 transition"
                      >→</button>
                    </div>
                  </div>
                )}

                {/* Archive action */}
                <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-amber-800">
                      Ready to archive {selectedIds.size} member{selectedIds.size !== 1 ? 's' : ''} as&nbsp;
                      <span className="font-bold">"{archiveYear}"</span>
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      They will be moved from active unit members to the archive list.
                    </p>
                  </div>
                  <Button
                    variant="warning"
                    size="sm"
                    onClick={() => setShowBulkConfirm(true)}
                    disabled={selectedIds.size === 0 || !archiveYear.trim()}
                  >
                    <Archive className="w-4 h-4 mr-1.5" />
                    Archive Selected
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Card>

      {/* ── Archive Members List ──────────────────────────────────────── */}
      <Card noPadding className="overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-borderColor bg-gray-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-textDark">Archive Members List</h3>
                <p className="text-xs text-textMuted">{filteredMembers.length} of {members.length} members</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Year filter chips */}
              {archiveYears.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-textMuted mr-1">Filter:</span>
                  <button
                    onClick={() => setYearFilter('all')}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                      yearFilter === 'all'
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-textMuted border-borderColor hover:border-primary hover:text-primary'
                    }`}
                  >
                    All years
                  </button>
                  {archiveYears.map((y) => (
                    <button
                      key={y}
                      onClick={() => setYearFilter(y)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                        yearFilter === y
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-textMuted border-borderColor hover:border-primary hover:text-primary'
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              )}

              <div className="relative sm:ml-auto" ref={exportMenuRef}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExportMenuOpen((open) => !open)}
                  disabled={filteredMembers.length === 0 || exportingFormat !== null}
                  isLoading={exportingFormat !== null}
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  Export
                  <ChevronDown className={`w-4 h-4 ml-1.5 transition-transform ${exportMenuOpen ? 'rotate-180' : ''}`} />
                </Button>
                {exportMenuOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg z-20 border border-borderColor py-1">
                    <button
                      type="button"
                      onClick={() => handleExport('xlsx')}
                      className="block w-full text-left px-4 py-2 text-sm text-textDark hover:bg-gray-50 transition"
                    >
                      Export as Excel (.xlsx)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExport('csv')}
                      className="block w-full text-left px-4 py-2 text-sm text-textDark hover:bg-gray-50 transition"
                    >
                      Export as CSV (.csv)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          <DataTable
            data={filteredMembers}
            columns={columns}
            isLoading={loading}
            showRowSelection={false}
            searchPlaceholder="Search by name, unit, contact…"
            pageSize={10}
            emptyMessage="No archived members found"
            emptyIcon={<Archive className="w-8 h-8 text-textMuted" />}
          />
        </div>
      </Card>

      {/* ── Dialogs ───────────────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={showBulkConfirm}
        onClose={() => setShowBulkConfirm(false)}
        onConfirm={handleBulkArchiveConfirm}
        title={`Archive ${selectedIds.size} Member${selectedIds.size !== 1 ? 's' : ''} as "${archiveYear}"`}
        message={`You are about to archive ${selectedIds.size} member${selectedIds.size !== 1 ? 's' : ''} under the year label "${archiveYear}". They will be moved to the archived list and can be restored later.`}
        confirmText="Confirm Archive"
        cancelText="Cancel"
        variant="warning"
        isLoading={bulkArchiveMutation.isPending}
      />

      <ConfirmDialog
        isOpen={showRestoreDialog}
        onClose={() => { setShowRestoreDialog(false); setSelectedMember(null); }}
        onConfirm={handleConfirmRestore}
        title="Restore Member"
        message={`Restore ${selectedMember?.name} back to the active members list?`}
        confirmText="Restore"
        cancelText="Cancel"
        variant="info"
        isLoading={restoreMutation.isPending}
      />
    </div>
  );
};
