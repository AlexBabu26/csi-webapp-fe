import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Badge, Button } from '../../components/ui';
import { ArrowLeft, Plus, CheckCircle, XCircle, Search } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';

interface Member {
  id: number;
  name: string;
  age: number;
  gender: string;
  unit_name: string;
  is_excluded: boolean;
  is_registered: boolean;
}

export const SelectIndividualParticipants: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'NA' | 'Junior' | 'Senior'>('NA');
  const [data, setData] = useState<{
    event_id: number;
    event_name: string;
    event_description: string;
    eligible_members: Member[];
  } | null>(null);

  useEffect(() => {
    loadMembers();
  }, [eventId]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const response = await api.selectIndividualEvent(parseInt(eventId!));
      setData(response.data);
    } catch (err: any) {
      addToast(err.message || "Failed to load members", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddParticipant = async (memberId: number) => {
    if (!selectedCategory || selectedCategory === 'NA') {
      addToast("Please select a seniority category", "warning");
      return;
    }

    try {
      setSubmitting(true);
      await api.addIndividualParticipant({
        individual_event_id: parseInt(eventId!),
        participant_id: memberId,
        seniority_category: selectedCategory,
      });
      addToast("Participant added successfully", "success");
      loadMembers(); // Reload to update registered status
    } catch (err: any) {
      addToast(err.message || "Failed to add participant", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMembers = data?.eligible_members.filter((member) =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.unit_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-in">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        <Card className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-full mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/kalamela/official')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-textDark">{data.event_name}</h1>
          <p className="text-sm text-textMuted mt-1">{data.event_description}</p>
        </div>
      </div>

      {/* Seniority Category Selection */}
      <Card className="bg-warning/5 border-warning/20">
        <h3 className="font-semibold text-textDark mb-3">Select Seniority Category</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('Junior')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedCategory === 'Junior'
                ? 'bg-primary text-white'
                : 'bg-bgLight text-textMuted hover:bg-gray-200'
            }`}
          >
            Junior
          </button>
          <button
            onClick={() => setSelectedCategory('Senior')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedCategory === 'Senior'
                ? 'bg-primary text-white'
                : 'bg-bgLight text-textMuted hover:bg-gray-200'
            }`}
          >
            Senior
          </button>
          <button
            onClick={() => setSelectedCategory('NA')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedCategory === 'NA'
                ? 'bg-primary text-white'
                : 'bg-bgLight text-textMuted hover:bg-gray-200'
            }`}
          >
            Not Applicable
          </button>
        </div>
        {selectedCategory && (
          <p className="text-sm text-textMuted mt-3">
            Selected: <span className="font-semibold">{selectedCategory}</span>
          </p>
        )}
      </Card>

      {/* Search */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
          <input
            type="text"
            placeholder="Search by name or unit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </Card>

      {/* Members List */}
      <Card>
        <h2 className="text-lg font-bold text-textDark mb-4">
          Eligible Members ({filteredMembers.length})
        </h2>
        
        {filteredMembers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-textMuted">
              {searchTerm ? 'No members found matching your search' : 'No eligible members available'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-bgLight rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-textDark">{member.name}</p>
                    <Badge variant={member.gender === 'M' ? 'primary' : 'success'}>
                      {member.gender === 'M' ? 'Male' : 'Female'}
                    </Badge>
                    <Badge variant="light">{member.age} years</Badge>
                    {member.is_excluded && (
                      <Badge variant="danger">Excluded</Badge>
                    )}
                    {member.is_registered && (
                      <Badge variant="success">
                        <CheckCircle className="w-3 h-3 mr-1 inline" />
                        Registered
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-textMuted mt-1">{member.unit_name}</p>
                </div>
                
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleAddParticipant(member.id)}
                  disabled={submitting || member.is_registered || member.is_excluded}
                >
                  {member.is_registered ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Added
                    </>
                  ) : member.is_excluded ? (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Excluded
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Footer Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => navigate('/kalamela/official')}>
          Back to Events
        </Button>
        <Button variant="primary" onClick={() => navigate('/kalamela/official/participants')}>
          View All Participants
        </Button>
      </div>
    </div>
  );
};


