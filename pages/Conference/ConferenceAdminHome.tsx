import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from '../../components/ui';
import { Plus, Edit2, Trash2, X, Calendar, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Portal } from '../../components/Portal';
import { useConferencesAdmin, useCreateConference, useUpdateConference, useDeleteConference } from '../../hooks/queries';

interface Conference {
  id: number;
  title: string;
  details: string;
  added_on: string;
  status: 'Active' | 'Inactive' | 'Completed';
}

export const ConferenceAdminHome: React.FC = () => {
  const { addToast } = useToast();
  
  // Use TanStack Query
  const { data: conferences = [], isLoading: loading } = useConferencesAdmin();
  const createMutation = useCreateConference();
  const updateMutation = useUpdateConference();
  const deleteMutation = useDeleteConference();
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [selectedConference, setSelectedConference] = useState<Conference | null>(null);
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [conferenceToDelete, setConferenceToDelete] = useState<Conference | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    title: '',
    details: '',
    status: 'Active' as 'Active' | 'Inactive' | 'Completed',
  });

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showModal || showDeleteConfirm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal, showDeleteConfirm]);

  const openModal = (type: 'add' | 'edit', conference?: Conference) => {
    setModalType(type);
    setSelectedConference(conference || null);
    
    if (type === 'edit' && conference) {
      setFormData({
        title: conference.title,
        details: conference.details || '',
        status: conference.status,
      });
    } else {
      setFormData({
        title: '',
        details: '',
        status: 'Active',
      });
    }
    
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedConference(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (modalType === 'add') {
      createMutation.mutate(
        { title: formData.title, details: formData.details },
        { onSuccess: closeModal }
      );
    } else if (modalType === 'edit' && selectedConference) {
      updateMutation.mutate(
        {
          conferenceId: selectedConference.id,
          data: { title: formData.title, details: formData.details, status: formData.status },
        },
        { onSuccess: closeModal }
      );
    }
  };

  const handleDelete = async () => {
    if (!conferenceToDelete) return;
    
    deleteMutation.mutate(conferenceToDelete.id, {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        setConferenceToDelete(null);
      },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'Completed':
        return <Badge variant="light"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'Inactive':
        return <Badge variant="warning"><AlertCircle className="w-3 h-3 mr-1" />Inactive</Badge>;
      default:
        return <Badge variant="light">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">Conference Management</h1>
          <p className="mt-1 text-sm text-textMuted">Create and manage conferences for delegate registration</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => openModal('add')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Conference
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-textMuted">Total Conferences</p>
              <p className="text-2xl font-bold text-textDark">{conferences.length}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-success/10 rounded-lg">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-textMuted">Active</p>
              <p className="text-2xl font-bold text-textDark">
                {conferences.filter(c => c.status === 'Active').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-warning/10 rounded-lg">
              <Users className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-textMuted">Completed</p>
              <p className="text-2xl font-bold text-textDark">
                {conferences.filter(c => c.status === 'Completed').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Conferences Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </Card>
          ))
        ) : conferences.length === 0 ? (
          <Card className="col-span-full text-center py-12">
            <Calendar className="w-12 h-12 text-textMuted mx-auto mb-4" />
            <p className="text-textMuted mb-4">No conferences found</p>
            <Button variant="primary" size="sm" onClick={() => openModal('add')}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Conference
            </Button>
          </Card>
        ) : (
          conferences.map((conference) => (
            <Card key={conference.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-textDark line-clamp-1">{conference.title}</h3>
                {getStatusBadge(conference.status)}
              </div>
              <p className="text-sm text-textMuted mb-4 line-clamp-2">
                {conference.details || 'No description provided'}
              </p>
              <p className="text-xs text-textMuted mb-4">
                Created: {new Date(conference.added_on).toLocaleDateString()}
              </p>
              
              <div className="flex gap-2">
                <Button variant="warning" size="sm" onClick={() => openModal('edit', conference)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="danger" 
                  size="sm" 
                  onClick={() => {
                    setConferenceToDelete(conference);
                    setShowDeleteConfirm(true);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Modal - Using Portal to render at body level */}
      {showModal && (
        <Portal>
          {/* Overlay - darker for better focus */}
          <div 
            className="fixed inset-0 bg-black/35 backdrop-blur z-[100] transition-opacity" 
            onClick={closeModal}
            aria-hidden="true"
          />
          
          {/* Modal Container */}
          <div 
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div 
              className="bg-white rounded-xl shadow-2xl w-full max-w-md pointer-events-auto animate-slide-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-borderColor">
                <h3 id="modal-title" className="text-lg font-semibold text-textDark">
                  {modalType === 'add' ? 'Create New Conference' : 'Edit Conference'}
                </h3>
                <button 
                  onClick={closeModal} 
                  className="p-2 -mr-2 rounded-lg text-textMuted hover:text-textDark hover:bg-bgLight transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-textDark mb-1.5">
                    Conference Title <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Annual Conference 2025"
                    className="w-full px-3 py-2 bg-white text-textDark border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-textMuted text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-textDark mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={formData.details}
                    onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                    placeholder="Add conference details and information..."
                    className="w-full px-3 py-2 bg-white text-textDark border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none placeholder:text-textMuted text-sm"
                    rows={3}
                  />
                </div>

                {modalType === 'edit' && (
                  <div>
                    <label className="block text-sm font-medium text-textDark mb-1.5">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' | 'Completed' })}
                      className="w-full px-3 py-2 bg-white text-textDark border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                )}

                {/* Modal Footer */}
                <div className="flex justify-end gap-2 pt-4 border-t border-borderColor">
                  <Button type="button" variant="outline" size="sm" onClick={closeModal}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    {modalType === 'add' ? 'Create Conference' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Conference"
        message={`Are you sure you want to delete "${conferenceToDelete?.title}"? This action cannot be undone and will remove all associated delegate data.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setConferenceToDelete(null);
        }}
      />
    </div>
  );
};

