import React, { useState, useMemo } from 'react';
import { Card, Badge, Button } from '../../components/ui';
import { Plus, Info, Edit2, Trash2, X, Users, Filter, CheckCircle, XCircle, AlertCircle, Calendar, Tag, UserCheck, Clock, Layers } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { IndividualEvent, GroupEvent, GenderRestriction, SeniorityRestriction } from '../../types';
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
type StatusFilter = 'all' | 'active' | 'inactive';

export const EventsManagement: React.FC = () => {
  const { addToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<TabType>('individual');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  
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
    is_active: true,
    is_mandatory: false,
    gender_restriction: null as GenderRestriction,
    seniority_restriction: null as SeniorityRestriction,
  });

  // Filter events by status
  const filteredIndividualEvents = useMemo(() => {
    if (statusFilter === 'all') return individualEvents;
    return individualEvents.filter(e => statusFilter === 'active' ? e.is_active : !e.is_active);
  }, [individualEvents, statusFilter]);

  const filteredGroupEvents = useMemo(() => {
    if (statusFilter === 'all') return groupEvents;
    return groupEvents.filter(e => statusFilter === 'active' ? e.is_active : !e.is_active);
  }, [groupEvents, statusFilter]);

  // Count active/inactive for tabs
  const activeIndividualCount = individualEvents.filter(e => e.is_active).length;
  const inactiveIndividualCount = individualEvents.filter(e => !e.is_active).length;
  const activeGroupCount = groupEvents.filter(e => e.is_active).length;
  const inactiveGroupCount = groupEvents.filter(e => !e.is_active).length;

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
        is_active: event.is_active ?? true,
        is_mandatory: event.is_mandatory ?? false,
        gender_restriction: event.gender_restriction ?? null,
        seniority_restriction: event.seniority_restriction ?? null,
      });
    } else if (type === 'add') {
      setFormData({
        name: '',
        description: '',
        category_id: undefined,
        min_allowed_limit: 3,
        max_allowed_limit: 10,
        per_unit_allowed_limit: 1,
        is_active: true,
        is_mandatory: false,
        gender_restriction: null,
        seniority_restriction: null,
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
            is_active: formData.is_active,
            is_mandatory: formData.is_mandatory,
            gender_restriction: formData.gender_restriction,
            seniority_restriction: formData.seniority_restriction,
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
            is_active: formData.is_active,
            is_mandatory: formData.is_mandatory,
            gender_restriction: formData.gender_restriction,
            seniority_restriction: formData.seniority_restriction,
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
              is_active: formData.is_active,
              is_mandatory: formData.is_mandatory,
              gender_restriction: formData.gender_restriction,
              seniority_restriction: formData.seniority_restriction,
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
              is_active: formData.is_active,
              is_mandatory: formData.is_mandatory,
              gender_restriction: formData.gender_restriction,
              seniority_restriction: formData.seniority_restriction,
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

  const events = activeTab === 'individual' ? filteredIndividualEvents : filteredGroupEvents;
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

      {/* Tabs and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
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

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-textMuted" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
          >
            <option value="all">All Events</option>
            <option value="active">Active Only ({activeTab === 'individual' ? activeIndividualCount : activeGroupCount})</option>
            <option value="inactive">Inactive Only ({activeTab === 'individual' ? inactiveIndividualCount : inactiveGroupCount})</option>
          </select>
        </div>
      </div>

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
            <p className="text-textMuted">
              {statusFilter === 'all' 
                ? `No ${activeTab} events found` 
                : `No ${statusFilter} ${activeTab} events found`}
            </p>
            <Button variant="primary" size="sm" className="mt-4" onClick={() => openModal('add')}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Event
            </Button>
          </Card>
        ) : (
          events.map((event, index) => (
            <Card 
              key={event.id} 
              className={`hover:shadow-md transition-all ${!event.is_active ? 'opacity-60 border-dashed border-gray-300' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-textDark">{index + 1}. {event.name}</h3>
                </div>
                {/* Status Badge */}
                {event.is_active ? (
                  <Badge variant="success" className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="danger" className="flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    Inactive
                  </Badge>
                )}
              </div>

              {/* Category and Mandatory badges */}
              <div className="flex flex-wrap gap-1 mb-2">
                {activeTab === 'individual' && 'category_name' in event && event.category_name && (
                  <Badge variant="light">{event.category_name}</Badge>
                )}
                {event.is_mandatory && (
                  <Badge variant="warning" className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Mandatory
                  </Badge>
                )}
              </div>

              {/* Restriction badges */}
              {(event.gender_restriction || event.seniority_restriction) && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {event.gender_restriction && (
                    <Badge variant="info" className="text-xs">
                      {event.gender_restriction} Only
                    </Badge>
                  )}
                  {event.seniority_restriction && (
                    <Badge variant="info" className="text-xs">
                      {event.seniority_restriction} Only
                    </Badge>
                  )}
                </div>
              )}

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
              <div className={`flex items-center justify-between p-6 border-b border-borderColor ${
                modalType === 'info' ? 'bg-gradient-to-r from-primary/5 to-primary/10' : ''
              }`}>
                <div className="flex items-center gap-3">
                  {modalType === 'info' && (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Info className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-textDark">
                      {modalType === 'add' && `Add New ${activeTab === 'individual' ? 'Individual' : 'Group'} Event`}
                      {modalType === 'edit' && `Edit Event`}
                      {modalType === 'info' && 'Event Details'}
                    </h3>
                    {modalType === 'info' && (
                      <p className="text-sm text-textMuted">{activeTab === 'individual' ? 'Individual' : 'Group'} Event</p>
                    )}
                  </div>
                </div>
                <button onClick={closeModal} className="p-2 rounded-full hover:bg-bgLight transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {modalType === 'info' && selectedEvent ? (
                  <div className="space-y-5">
                    {/* Event Header with Status */}
                    <div className="flex items-start justify-between pb-4 border-b border-borderColor">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-textDark mb-1">{selectedEvent.name}</h4>
                        <p className="text-sm text-textMuted">{selectedEvent.description || 'No description provided'}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-4">
                        {selectedEvent.is_active ? (
                          <Badge variant="success" className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="danger" className="flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            Inactive
                          </Badge>
                        )}
                        {selectedEvent.is_mandatory && (
                          <Badge variant="warning" className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Mandatory
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Info Cards Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Category Card - Individual Events */}
                      {activeTab === 'individual' && 'category_name' in selectedEvent && (
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                              <Tag className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">Category</span>
                          </div>
                          <p className="text-lg font-semibold text-purple-900">{selectedEvent.category_name || 'Uncategorized'}</p>
                        </div>
                      )}

                      {/* Gender Restriction Card */}
                      <div className={`rounded-lg p-4 border ${
                        selectedEvent.gender_restriction 
                          ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            selectedEvent.gender_restriction ? 'bg-blue-500' : 'bg-gray-400'
                          }`}>
                            <UserCheck className="w-4 h-4 text-white" />
                          </div>
                          <span className={`text-xs font-medium uppercase tracking-wide ${
                            selectedEvent.gender_restriction ? 'text-blue-600' : 'text-gray-500'
                          }`}>Gender</span>
                        </div>
                        <p className={`text-lg font-semibold ${
                          selectedEvent.gender_restriction ? 'text-blue-900' : 'text-gray-600'
                        }`}>
                          {selectedEvent.gender_restriction ? `${selectedEvent.gender_restriction} Only` : 'Any Gender'}
                        </p>
                      </div>

                      {/* Seniority Restriction Card */}
                      <div className={`rounded-lg p-4 border ${
                        selectedEvent.seniority_restriction 
                          ? 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            selectedEvent.seniority_restriction ? 'bg-amber-500' : 'bg-gray-400'
                          }`}>
                            <Layers className="w-4 h-4 text-white" />
                          </div>
                          <span className={`text-xs font-medium uppercase tracking-wide ${
                            selectedEvent.seniority_restriction ? 'text-amber-600' : 'text-gray-500'
                          }`}>Age Category</span>
                        </div>
                        <p className={`text-lg font-semibold ${
                          selectedEvent.seniority_restriction ? 'text-amber-900' : 'text-gray-600'
                        }`}>
                          {selectedEvent.seniority_restriction ? `${selectedEvent.seniority_restriction} Only` : 'Junior & Senior'}
                        </p>
                      </div>

                      {/* Created Date Card */}
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-slate-500 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">Created</span>
                        </div>
                        <p className="text-lg font-semibold text-slate-900">
                          {selectedEvent.created_on ? new Date(selectedEvent.created_on).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 'Unknown'}
                        </p>
                      </div>
                    </div>

                    {/* Group Event Specific: Team Size Info */}
                    {activeTab === 'group' && 'min_allowed_limit' in selectedEvent && (
                      <div className="bg-gradient-to-r from-teal-50 via-cyan-50 to-teal-50 rounded-xl p-5 border border-teal-200">
                        <div className="flex items-center gap-2 mb-4">
                          <Users className="w-5 h-5 text-teal-600" />
                          <h5 className="font-semibold text-teal-800">Team Configuration</h5>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-teal-600">{selectedEvent.min_allowed_limit}</div>
                            <div className="text-xs text-teal-700 font-medium mt-1">Min Members</div>
                          </div>
                          <div className="text-center border-x border-teal-200">
                            <div className="text-3xl font-bold text-teal-600">{selectedEvent.max_allowed_limit}</div>
                            <div className="text-xs text-teal-700 font-medium mt-1">Max Members</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-teal-600">{selectedEvent.per_unit_allowed_limit}</div>
                            <div className="text-xs text-teal-700 font-medium mt-1">Teams/Unit</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-2 border-t border-borderColor">
                      <Button variant="outline" onClick={closeModal}>
                        Close
                      </Button>
                      <Button variant="warning" onClick={() => {
                        closeModal();
                        setTimeout(() => openModal('edit', selectedEvent), 100);
                      }}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit Event
                      </Button>
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

                    {/* Status and Mandatory toggles */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-textDark mb-2">Event Status</label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              formData.is_active ? 'bg-success' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                formData.is_active ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className={`text-sm font-medium ${formData.is_active ? 'text-success' : 'text-textMuted'}`}>
                            {formData.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-xs text-textMuted mt-1">Inactive events won't be visible to officials</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-textDark mb-2">Mandatory Event</label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, is_mandatory: !formData.is_mandatory })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              formData.is_mandatory ? 'bg-warning' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                formData.is_mandatory ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className={`text-sm font-medium ${formData.is_mandatory ? 'text-warning' : 'text-textMuted'}`}>
                            {formData.is_mandatory ? 'Mandatory' : 'Optional'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Gender and Seniority Restrictions */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-textDark mb-2">Gender Restriction</label>
                        <select
                          value={formData.gender_restriction || ''}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            gender_restriction: (e.target.value || null) as GenderRestriction 
                          })}
                          className="w-full px-3 py-2 border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                        >
                          <option value="">Any Gender</option>
                          <option value="Male">Male Only</option>
                          <option value="Female">Female Only</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-textDark mb-2">Seniority Restriction</label>
                        <select
                          value={formData.seniority_restriction || ''}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            seniority_restriction: (e.target.value || null) as SeniorityRestriction 
                          })}
                          className="w-full px-3 py-2 border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                        >
                          <option value="">Any (Junior or Senior)</option>
                          <option value="Junior">Junior Only</option>
                          <option value="Senior">Senior Only</option>
                        </select>
                      </div>
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
