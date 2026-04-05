import React, { useState, useRef } from 'react';
import {
  Plus,
  Upload,
  Send,
  Trash2,
  Pencil,
  X,
  AlertTriangle,
  Image,
  FileText,
} from 'lucide-react';
import { Card, Badge, Button, Input, Skeleton } from '../../../components/ui';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import {
  useYMAdminMagazines,
  useYMAdminCreateMagazine,
  useYMAdminUpdateMagazine,
  useYMAdminUploadMagazineFiles,
  useYMAdminPublishMagazine,
  useYMAdminDeleteMagazine,
} from '../../../hooks/queries';
import { useToast } from '../../../components/Toast';
import { YMMagazine, YMMagazineForm } from '../../../types';

const emptyForm: YMMagazineForm = { title: '', issue_number: '', volume: '', description: '' };

export const YMMagazineManagement: React.FC = () => {
  const { addToast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingMag, setEditingMag] = useState<YMMagazine | null>(null);
  const [form, setForm] = useState<YMMagazineForm>(emptyForm);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [uploadTargetId, setUploadTargetId] = useState<number | null>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  const [publishId, setPublishId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: magazines, isLoading, error } = useYMAdminMagazines(statusFilter || undefined);
  const createMag = useYMAdminCreateMagazine();
  const updateMag = useYMAdminUpdateMagazine();
  const uploadFiles = useYMAdminUploadMagazineFiles();
  const publishMag = useYMAdminPublishMagazine();
  const deleteMag = useYMAdminDeleteMagazine();

  const openCreate = () => {
    setEditingMag(null);
    setForm(emptyForm);
    setCoverFile(null);
    setPdfFile(null);
    setShowForm(true);
  };

  const openEdit = (mag: YMMagazine) => {
    setEditingMag(mag);
    setForm({
      title: mag.title,
      issue_number: mag.issue_number ?? '',
      volume: mag.volume ?? '',
      description: mag.description ?? '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingMag(null);
    setForm(emptyForm);
    setCoverFile(null);
    setPdfFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      addToast('Title is required', 'warning');
      return;
    }

    if (editingMag) {
      updateMag.mutate(
        { id: editingMag.id, data: form },
        {
          onSuccess: () => { addToast('Magazine updated', 'success'); closeForm(); },
          onError: () => addToast('Failed to update magazine', 'error'),
        }
      );
    } else {
      setIsSubmitting(true);
      try {
        const created: any = await new Promise((resolve, reject) => {
          createMag.mutate(form, { onSuccess: resolve, onError: reject });
        });
        const magId = created?.id;
        if (magId && (coverFile || pdfFile)) {
          await new Promise<void>((resolve, reject) => {
            uploadFiles.mutate(
              { id: magId, files: { cover: coverFile || undefined, pdf: pdfFile || undefined } },
              { onSuccess: () => resolve(), onError: reject }
            );
          });
        }
        addToast('Magazine created successfully', 'success');
        closeForm();
      } catch {
        addToast('Failed to create magazine', 'error');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleUpload = () => {
    if (!uploadTargetId) return;
    const cover = coverRef.current?.files?.[0];
    const pdf = pdfRef.current?.files?.[0];
    if (!cover && !pdf) {
      addToast('Select at least one file', 'warning');
      return;
    }
    uploadFiles.mutate(
      { id: uploadTargetId, files: { cover, pdf } },
      {
        onSuccess: () => { addToast('Files uploaded', 'success'); setUploadTargetId(null); },
        onError: () => addToast('Upload failed', 'error'),
      }
    );
  };

  const handlePublish = () => {
    if (publishId === null) return;
    publishMag.mutate(publishId, {
      onSuccess: () => { addToast('Magazine published', 'success'); setPublishId(null); },
      onError: () => addToast('Failed to publish', 'error'),
    });
  };

  const handleDelete = () => {
    if (deleteId === null) return;
    deleteMag.mutate(deleteId, {
      onSuccess: () => { addToast('Magazine deleted', 'success'); setDeleteId(null); },
      onError: () => addToast('Failed to delete', 'error'),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textDark">Magazine Management</h1>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-1.5" /> New Magazine
        </Button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        {['', 'draft', 'published'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              statusFilter === s
                ? 'bg-primary text-white'
                : 'bg-white border border-borderColor text-textMuted hover:bg-bgLight'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-textDark">
              {editingMag ? 'Edit Magazine' : 'Create Magazine'}
            </h2>
            <button onClick={closeForm} className="p-1 rounded-md hover:bg-bgLight text-textMuted">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Title"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <Input
                label="Issue Number"
                value={form.issue_number ?? ''}
                onChange={(e) => setForm({ ...form, issue_number: e.target.value })}
              />
              <Input
                label="Volume"
                value={form.volume ?? ''}
                onChange={(e) => setForm({ ...form, volume: e.target.value })}
              />
              <Input
                label="Description"
                value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            {/* File uploads -- only for new magazines */}
            {!editingMag && (
              <div className="pt-3 border-t border-borderColor">
                <p className="text-sm font-medium text-textDark mb-3">Upload Files <span className="text-textMuted font-normal">(optional)</span></p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-textMuted mb-1.5">
                      <Image size={14} className="inline mr-1" /> Cover Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                      className="w-full text-sm text-textDark file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />
                    {coverFile && <p className="mt-1 text-xs text-textMuted">{coverFile.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-textMuted mb-1.5">
                      <FileText size={14} className="inline mr-1" /> PDF File
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                      className="w-full text-sm text-textDark file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />
                    {pdfFile && <p className="mt-1 text-xs text-textMuted">{pdfFile.name}</p>}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={closeForm}>Cancel</Button>
              <Button type="submit" isLoading={isSubmitting || updateMag.isPending}>
                {editingMag ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Upload modal */}
      {uploadTargetId && (
        <Card>
          <h2 className="text-lg font-semibold text-textDark mb-4">
            Upload Files for Magazine #{uploadTargetId}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-textDark mb-1.5">
                <Image size={14} className="inline mr-1" /> Cover Image
              </label>
              <input
                ref={coverRef}
                type="file"
                accept="image/*"
                className="w-full text-sm text-textDark file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textDark mb-1.5">
                <FileText size={14} className="inline mr-1" /> PDF File
              </label>
              <input
                ref={pdfRef}
                type="file"
                accept=".pdf"
                className="w-full text-sm text-textDark file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setUploadTargetId(null)}>Cancel</Button>
            <Button onClick={handleUpload} isLoading={uploadFiles.isPending}>
              <Upload size={16} className="mr-1.5" /> Upload
            </Button>
          </div>
        </Card>
      )}

      {/* Magazine list */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-40 w-full mb-3 rounded" />
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          Failed to load magazines.
        </div>
      ) : magazines && (magazines as YMMagazine[]).length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(magazines as YMMagazine[]).map((mag) => (
            <Card key={mag.id} noPadding>
              {/* Cover thumbnail */}
              <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                {mag.cover_image_url ? (
                  <img
                    src={mag.cover_image_url}
                    alt={mag.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image size={32} className="text-gray-300" />
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-textDark line-clamp-1">{mag.title}</h3>
                  <Badge variant={mag.status === 'published' ? 'success' : 'light'}>
                    {mag.status}
                  </Badge>
                </div>

                <p className="text-xs text-textMuted mb-3">
                  {mag.issue_number && `Issue ${mag.issue_number}`}
                  {mag.issue_number && mag.volume && ' · '}
                  {mag.volume && `Vol. ${mag.volume}`}
                  {mag.published_date && ` · ${new Date(mag.published_date).toLocaleDateString('en-IN')}`}
                </p>

                <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-borderColor">
                  <Button variant="outline" size="sm" onClick={() => openEdit(mag)}>
                    <Pencil size={13} className="mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setUploadTargetId(mag.id)}>
                    <Upload size={13} className="mr-1" /> Files
                  </Button>
                  {mag.status === 'draft' && (
                    <>
                      <Button variant="primary" size="sm" onClick={() => setPublishId(mag.id)}>
                        <Send size={13} className="mr-1" /> Publish
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => setDeleteId(mag.id)}>
                        <Trash2 size={13} />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <p className="text-center text-sm text-textMuted py-8">No magazines found.</p>
        </Card>
      )}

      {/* Publish confirmation */}
      <ConfirmDialog
        isOpen={publishId !== null}
        onClose={() => setPublishId(null)}
        onConfirm={handlePublish}
        title="Publish Magazine"
        message="Publishing will make this magazine visible to all subscribers. Continue?"
        confirmText="Publish"
        variant="info"
        isLoading={publishMag.isPending}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Magazine"
        message="This will permanently delete this draft magazine. This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMag.isPending}
      />
    </div>
  );
};
