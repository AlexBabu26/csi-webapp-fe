import React, { useState } from 'react';
import { Card, Badge, Button } from '../../components/ui';
import { Plus, Info, Edit2, Trash2, X } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { IndividualEvent, GroupEvent } from '../../types';
import { Portal } from '../../components/Portal';
import { 
  useIndividualEvents, 
  useGroupEvents, 
  useCreateIndividualEvent, 
  useCreateGroupEvent, 
  useUpdateIndividualEvent, 
  useUpdateGroupEvent, 
  useDeleteIndividualEvent, 
  useDeleteGroupEvent 
} from '../../hooks/queries';

type TabType = 'individual' | 'group';

export const EventsManagement: React.FC = () => {
  const { addToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<TabType>('individual');
  
  // Use TanStack Query
  const { data: individualEventsData, isLoading: loadingIndividual } = useIndividualEvents();
  const { data: groupEventsData, isLoading: loadingGroup } = useGroupEvents();
  
  const individualEvents = individualEventsData ?? [];
  const groupEvents = groupEventsData ?? [];
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
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    minAllowedLimit: 3,
    maxAllowedLimit: 10,
  });

  const openModal = (type: 'add' | 'edit' | 'info', event?: IndividualEvent | GroupEvent) => {
    setModalType(type);
    setSelectedEvent(event || null);
    
    if (type === 'edit' && event) {
      setFormData({
        name: event.name,
        description: event.description,
        category: 'category' in event ? event.category || '' : '',
        minAllowedLimit: 'minAllowedLimit' in event ? event.minAllowedLimit : 3,
        maxAllowedLimit: 'maxAllowedLimit' in event ? event.maxAllowedLimit : 10,
      });
    } else if (type === 'add') {
      setFormData({
        name: '',
        description: '',
        category: '',
        minAllowedLimit: 3,
        maxAllowedLimit: 10,
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
            description: formData.description,
            category: formData.category,
          },
          { onSuccess: closeModal }
        );
      } else {
        createGroupMutation.mutate(
          {
            name: formData.name,
            description: formData.description,
            minAllowedLimit: formData.minAllowedLimit,
            maxAllowedLimit: formData.maxAllowedLimit,
          },
          { onSuccess: closeModal }
        );
      }
    } else if (modalType === 'edit' && selectedEvent) {
      if (activeTab === 'individual') {
        updateIndividualMutation.mutate(
          { eventId: selectedEvent.id, data: formData },
          { onSuccess: closeModal }
        );
      } else {
        updateGroupMutation.mutate(
          { eventId: selectedEvent.id, data: formData },
          { onSuccess: closeModal }
        );
      }
    }
  };

  const events = activeTab === 'individual' ? individualEvents : groupEvents;

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
                <Badge variant="light">Rs.{event.registrationFee}</Badge>
              </div>
              <p className="text-sm text-textMuted mb-4 line-clamp-2">{event.description}</p>
              
              {activeTab === 'individual' && 'category' in event && event.category && (
                <Badge variant="light" className="mb-3">{event.category}</Badge>
              )}
              
              {activeTab === 'group' && 'minAllowedLimit' in event && (
                <p className="text-sm text-textMuted mb-3">
                  Participants: {event.minAllowedLimit} - {event.maxAllowedLimit}
                </p>
              )}
              
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={() => openModal('info', event)}>
                  <Info className="w-4 h-4" />
                </Button>
                <Button variant="warning" size="sm" onClick={() => openModal('edit', event)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="danger" size="sm" disabled>
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
                      <p className="text-textDark">{selectedEvent.description}</p>
                    </div>
                    {activeTab === 'individual' && 'category' in selectedEvent && (
                      <div>
                        <label className="text-sm font-medium text-textMuted">Category</label>
                        <p className="text-textDark">{selectedEvent.category || 'N/A'}</p>
                      </div>
                    )}
                    {activeTab === 'group' && 'minAllowedLimit' in selectedEvent && (
                      <>
                        <div>
                          <label className="text-sm font-medium text-textMuted">Minimum Participants</label>
                          <p className="text-textDark">{selectedEvent.minAllowedLimit}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-textMuted">Maximum Participants</label>
                          <p className="text-textDark">{selectedEvent.maxAllowedLimit}</p>
                        </div>
                      </>
                    )}
                    <div>
                      <label className="text-sm font-medium text-textMuted">Registration Fee</label>
                      <p className="text-textDark">Rs.{selectedEvent.registrationFee}</p>
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
                        Description <span className="text-danger">*</span>
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                        rows={3}
                        required
                      />
                    </div>

                    {activeTab === 'individual' && (
                      <div>
                        <label className="block text-sm font-medium text-textDark mb-2">Category</label>
                        <input
                          type="text"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          placeholder="e.g., Music, Dance, Arts, Literary"
                          className="w-full px-3 py-2 border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    )}

                    {activeTab === 'group' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-textDark mb-2">
                            Min Participants <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            value={formData.minAllowedLimit}
                            onChange={(e) => setFormData({ ...formData, minAllowedLimit: parseInt(e.target.value) })}
                            min="1"
                            className="w-full px-3 py-2 border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-textDark mb-2">
                            Max Participants <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            value={formData.maxAllowedLimit}
                            onChange={(e) => setFormData({ ...formData, maxAllowedLimit: parseInt(e.target.value) })}
                            min={formData.minAllowedLimit}
                            className="w-full px-3 py-2 border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                            required
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={closeModal}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary">
                        {modalType === 'add' ? 'Create Event' : 'Update Event'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};


