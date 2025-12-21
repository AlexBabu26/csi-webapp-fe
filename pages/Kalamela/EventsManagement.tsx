import React, { useState } from 'react';
import { Card, Badge, Button } from '../../components/ui';
import { Plus, Info, Edit2, Trash2, X, Users } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { IndividualEvent, GroupEvent } from '../../types';
import { Portal } from '../../components/Portal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { 
  useIndividualEvents, 
  useGroupEvents, 
  useCreateIndividualEvent, 
  useCreateGroupEvent, 
  useUpdateIndividualEvent, 
  useUpdateGroupEvent, 
  useDeleteIndividualEvent, 
  useDeleteGroupEvent,
  useKalamelaCategories
} from '../../hooks/queries';

type TabType = 'individual' | 'group';

export const EventsManagement: React.FC = () => {
  const { addToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<TabType>('individual');
  
  // Use TanStack Query
  const { data: individualEventsData, isLoading: loadingIndividual } = useIndividualEvents();
  const { data: groupEventsData, isLoading: loadingGroup } = useGroupEvents();
  const { data: categoriesData, isLoading: loadingCategories } = useKalamelaCategories();
  
  const individualEvents = individualEventsData ?? [];
  const groupEvents = groupEventsData ?? [];
  const categories = categoriesData ?? [];
  const loading = loadingIndividual || loadingGroup;
  
  // Mutations
  const createIndividualMutation = useCreateIndividualEvent();
  const createGroupMutation = useCreateGroupEvent();
  const updateIndividualMutation = useUpdateIndividualEvent();
  const updateGroupMutation = useUpdateGroupEvent();
  const deleteIndividualMutation = useDeleteIndividualEvent();
  const deleteGroupMutation = useDeleteGroupEvent();
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'info'>('add');
  const [selectedEvent, setSelectedEvent] = useState<IndividualEvent | GroupEvent | null>(null);
  
  // Delete confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<IndividualEvent | GroupEvent | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: undefined as number | undefined,
    min_allowed_limit: 3,
    max_allowed_limit: 10,
    per_unit_allowed_limit: 1,
  });

  const openModal = (type: 'add' | 'edit' | 'info', event?: IndividualEvent | GroupEvent) => {
    setModalType(type);
    setSelectedEvent(event || null);
    
    if (type === 'edit' && event) {
      setFormData({
        name: event.name,
        description: event.description || '',
        category_id: 'category_id' in event ? (event.category_id ?? undefined) : undefined,
        min_allowed_limit: 'min_allowed_limit' in event ? event.min_allowed_limit : 3,
        max_allowed_limit: 'max_allowed_limit' in event ? event.max_allowed_limit : 10,
        per_unit_allowed_limit: 'per_unit_allowed_limit' in event ? event.per_unit_allowed_limit : 1,
      });
    } else if (type === 'add') {
      setFormData({
        name: '',
        description: '',
        category_id: undefined,
        min_allowed_limit: 3,
        max_allowed_limit: 10,
        per_unit_allowed_limit: 1,
      });
    }
    
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (modalType === 'add') {
      if (activeTab === 'individual') {
        createIndividualMutation.mutate(
          {
            name: formData.name,
            description: formData.description || undefined,
            category_id: formData.category_id,
          },
          { onSuccess: closeModal }
        );
      } else {
        createGroupMutation.mutate(
          {
            name: formData.name,
            description: formData.description || undefined,
            min_allowed_limit: formData.min_allowed_limit,
            max_allowed_limit: formData.max_allowed_limit,
            per_unit_allowed_limit: formData.per_unit_allowed_limit,
          },
          { onSuccess: closeModal }
        );
      }
    } else if (modalType === 'edit' && selectedEvent) {
      if (activeTab === 'individual') {
        updateIndividualMutation.mutate(
          { 
            eventId: selectedEvent.id, 
            data: {
              name: formData.name,
              description: formData.description || undefined,
              category_id: formData.category_id,
            }
          },
          { onSuccess: closeModal }
        );
      } else {
        updateGroupMutation.mutate(
          { 
            eventId: selectedEvent.id, 
            data: {
              name: formData.name,
              description: formData.description || undefined,
              min_allowed_limit: formData.min_allowed_limit,
              max_allowed_limit: formData.max_allowed_limit,
              per_unit_allowed_limit: formData.per_unit_allowed_limit,
            }
          },
          { onSuccess: closeModal }
        );
      }
    }
  };

  const handleDeleteClick = (event: IndividualEvent | GroupEvent) => {
    setEventToDelete(event);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    if (!eventToDelete) return;
    
    if (activeTab === 'individual') {
      deleteIndividualMutation.mutate(eventToDelete.id, {
        onSuccess: () => {
          setShowDeleteConfirm(false);
          setEventToDelete(null);
        },
        onError: () => {
          setShowDeleteConfirm(false);
          setEventToDelete(null);
        }
      });
    } else {
      deleteGroupMutation.mutate(eventToDelete.id, {
        onSuccess: () => {
          setShowDeleteConfirm(false);
          setEventToDelete(null);
        },
        onError: () => {
          setShowDeleteConfirm(false);
          setEventToDelete(null);
        }
      });
    }
  };

  const events = activeTab === 'individual' ? individualEvents : groupEvents;
  const isDeleting = deleteIndividualMutation.isPending || deleteGroupMutation.isPending;

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">Kalamela Events Management</h1>
          <p className="mt-1 text-sm text-textMuted">Create and manage individual and group events</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => openModal('add')}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Event
        </Button>
      </div>

      {/* Tabs */}
      <Card className="p-1 inline-flex gap-1">
        <button
          onClick={() => setActiveTab('individual')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'individual'
              ? 'bg-primary text-white'
              : 'text-textMuted hover:bg-bgLight'
          }`}
        >
          Individual Events ({individualEvents.length})
        </button>
        <button
          onClick={() => setActiveTab('group')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'group'
              ? 'bg-primary text-white'
              : 'text-textMuted hover:bg-bgLight'
          }`}
        >
          Group Events ({groupEvents.length})
        </button>
      </Card>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </Card>
          ))
        ) : events.length === 0 ? (
          <Card className="col-span-full text-center py-12">
            <p className="text-textMuted">No {activeTab} events found</p>
            <Button variant="primary" size="sm" className="mt-4" onClick={() => openModal('add')}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Event
            </Button>
          </Card>
        ) : (
          events.map((event, index) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-textDark">{index + 1}. {event.name}</h3>
                {activeTab === 'individual' && 'category_name' in event && event.category_name && (
                  <Badge variant="light">{event.category_name}</Badge>
                )}
              </div>
              <p className="text-sm text-textMuted mb-4 line-clamp-2">{event.description || 'No description'}</p>
              
              {activeTab === 'group' && 'min_allowed_limit' in event && (
                <div className="flex items-center gap-4 text-sm text-textMuted mb-3">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {event.min_allowed_limit} - {event.max_allowed_limit} per team
                  </span>
                  <span>
                    {event.per_unit_allowed_limit} team(s)/unit
                  </span>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={() => openModal('info', event)}>
                  <Info className="w-4 h-4" />
                </Button>
                <Button variant="warning" size="sm" onClick={() => openModal('edit', event)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="danger" 
                  size="sm" 
                  onClick={() => handleDeleteClick(event)}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal - Using Portal to render at body level */}
      {showModal && (
        <Portal>
          <div className="fixed inset-0 bg-black/35 backdrop-blur z-[100] transition-opacity" onClick={closeModal} aria-hidden="true" />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full pointer-events-auto animate-slide-in" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-borderColor">
                <h3 className="text-xl font-bold text-textDark">
                  {modalType === 'add' && `Add New ${activeTab === 'individual' ? 'Individual' : 'Group'} Event`}
                  {modalType === 'edit' && `Edit ${selectedEvent?.name}`}
                  {modalType === 'info' && selectedEvent?.name}
                </h3>
                <button onClick={closeModal} className="p-1 rounded hover:bg-bgLight">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {modalType === 'info' && selectedEvent ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-textMuted">Event Name</label>
                      <p className="text-textDark">{selectedEvent.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-textMuted">Description</label>
                      <p className="text-textDark">{selectedEvent.description || 'N/A'}</p>
                    </div>
                    {activeTab === 'individual' && 'category_name' in selectedEvent && (
                      <div>
                        <label className="text-sm font-medium text-textMuted">Category</label>
                        <p className="text-textDark">{selectedEvent.category_name || 'N/A'}</p>
                      </div>
                    )}
                    {activeTab === 'group' && 'min_allowed_limit' in selectedEvent && (
                      <>
                        <div>
                          <label className="text-sm font-medium text-textMuted">Minimum Participants</label>
                          <p className="text-textDark">{selectedEvent.min_allowed_limit}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-textMuted">Maximum Participants</label>
                          <p className="text-textDark">{selectedEvent.max_allowed_limit}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-textMuted">Teams Allowed Per Unit</label>
                          <p className="text-textDark">{selectedEvent.per_unit_allowed_limit}</p>
                        </div>
                      </>
                    )}
                    <div>
                      <label className="text-sm font-medium text-textMuted">Created On</label>
                      <p className="text-textDark">{new Date(selectedEvent.created_on).toLocaleDateString()}</p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-textDark mb-2">
                        Event Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-textDark mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                        rows={3}
                        placeholder="Enter event description..."
                      />
                    </div>

                    {activeTab === 'individual' && (
                      <div>
                        <label className="block text-sm font-medium text-textDark mb-2">Category</label>
                        <select
                          value={formData.category_id ?? ''}
                          onChange={(e) => setFormData({ ...formData, category_id: e.target.value ? parseInt(e.target.value) : undefined })}
                          className="w-full px-3 py-2 border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                        >
                          <option value="">Select a category</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                        {categories.length === 0 && !loadingCategories && (
                          <p className="text-xs text-textMuted mt-1">No categories available. Create categories first.</p>
                        )}
                      </div>
                    )}

                    {activeTab === 'group' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-textDark mb-2">
                              Min Participants
                            </label>
                            <input
                              type="number"
                              value={formData.min_allowed_limit}
                              onChange={(e) => setFormData({ ...formData, min_allowed_limit: parseInt(e.target.value) || 1 })}
                              min="1"
                              className="w-full px-3 py-2 border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-textDark mb-2">
                              Max Participants
                            </label>
                            <input
                              type="number"
                              value={formData.max_allowed_limit}
                              onChange={(e) => setFormData({ ...formData, max_allowed_limit: parseInt(e.target.value) || 2 })}
                              min={formData.min_allowed_limit}
                              className="w-full px-3 py-2 border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-textDark mb-2">
                            Teams Allowed Per Unit
                          </label>
                          <input
                            type="number"
                            value={formData.per_unit_allowed_limit}
                            onChange={(e) => setFormData({ ...formData, per_unit_allowed_limit: parseInt(e.target.value) || 1 })}
                            min="1"
                            className="w-full px-3 py-2 border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          <p className="text-xs text-textMuted mt-1">How many teams can each unit register for this event</p>
                        </div>
                      </>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={closeModal}>
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        variant="primary"
                        disabled={createIndividualMutation.isPending || createGroupMutation.isPending || updateIndividualMutation.isPending || updateGroupMutation.isPending}
                      >
                        {(createIndividualMutation.isPending || createGroupMutation.isPending || updateIndividualMutation.isPending || updateGroupMutation.isPending) 
                          ? 'Saving...' 
                          : modalType === 'add' ? 'Create Event' : 'Update Event'
                        }
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Event"
        message={`Are you sure you want to delete "${eventToDelete?.name}"? This action cannot be undone. Events with existing participants cannot be deleted.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setEventToDelete(null);
        }}
        isLoading={isDeleting}
      />
    </div>
  );
};
