import React, { useState } from 'react';
import { ArrowLeft, FileText, Clock, AlertCircle, CheckCircle, XCircle, Search } from 'lucide-react';
import { Button, Card, Badge } from '../../components/ui';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';
import { useCheckAppealEligibility, useSubmitAppeal } from '../../hooks/queries';
import { Footer } from '../../components/Footer';
import { useSiteSettings } from '../../hooks/queries';

interface ParticipantData {
  id: number;
  name: string;
  chestNumber: string;
  unit: string;
  district: string;
  category: string;
  eventResults: Array<{
    eventName: string;
    eventType: 'INDIVIDUAL' | 'GROUP';
    marks: number | null;
    grade: string | null;
    position: number | null;
    status: 'SCORED' | 'PENDING';
  }>;
}

interface EligibilityData {
  eligible: boolean;
  reason?: string;
  score_time?: string;
  time_remaining_minutes?: number;
  time_elapsed_minutes?: number;
  appeal_fee?: number;
  appeal_id?: number;
}

export const SubmitAppeal: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { data: siteSettings } = useSiteSettings();
  
  const [step, setStep] = useState<'search' | 'select' | 'check' | 'submit' | 'success'>('search');
  const [chestNumber, setChestNumber] = useState('');
  const [searching, setSearching] = useState(false);
  const [participant, setParticipant] = useState<ParticipantData | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [eligibility, setEligibility] = useState<EligibilityData | null>(null);
  const [statement, setStatement] = useState('');
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  
  const checkEligibilityMutation = useCheckAppealEligibility();
  const submitAppealMutation = useSubmitAppeal();

  // Search for participant
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chestNumber.trim()) {
      addToast('Please enter a chest number', 'warning');
      return;
    }

    setSearching(true);
    try {
      const response = await api.findParticipantByChestNumber(chestNumber.trim());
      const data = response.data;
      
      if (data) {
        // Combine individual and group participations
        const individualEvents = (data.individual_participations || []).map((participation: any) => ({
          eventName: participation.event_name || 'Unknown Event',
          eventType: 'INDIVIDUAL' as const,
          marks: participation.awarded_mark ?? null,
          grade: participation.grade || null,
          position: participation.position || null,
          status: (participation.awarded_mark !== undefined && participation.awarded_mark !== null) 
                  ? 'SCORED' as const : 'PENDING' as const,
        }));
        
        const groupEvents = (data.group_participations || []).map((participation: any) => ({
          eventName: participation.event_name || 'Unknown Event',
          eventType: 'GROUP' as const,
          marks: participation.awarded_mark ?? null,
          grade: participation.grade || null,
          position: participation.position || null,
          status: (participation.awarded_mark !== undefined && participation.awarded_mark !== null) 
                  ? 'SCORED' as const : 'PENDING' as const,
        }));
        
        // Extract participant info from first participation or root level
        const firstParticipation = data.individual_participations?.[0] || data.group_participations?.[0];
        
        const participantData: ParticipantData = {
          id: data.id || data.participant_id || 0,
          name: firstParticipation?.participant_name || data.participant_name || data.name || data.member_name || 'Unknown Participant',
          chestNumber: data.chest_number || firstParticipation?.chest_number || chestNumber.trim(),
          unit: firstParticipation?.unit_name || data.unit_name || data.unit || 'N/A',
          district: firstParticipation?.district_name || data.district_name || data.district || 'N/A',
          category: firstParticipation?.seniority_category || data.seniority_category || data.category || 'N/A',
          eventResults: [...individualEvents, ...groupEvents],
        };
        
        setParticipant(participantData);
        
        // Filter to only scored events
        const scoredEvents = participantData.eventResults.filter(e => e.status === 'SCORED');
        if (scoredEvents.length === 0) {
          addToast('No scored events found for this participant', 'warning');
          setParticipant(null);
        } else {
          setStep('select');
        }
      } else {
        addToast('Participant not found', 'error');
        setParticipant(null);
      }
    } catch (err: any) {
      console.error('Search failed', err);
      addToast(err.message || 'Failed to search participant', 'error');
      setParticipant(null);
    } finally {
      setSearching(false);
    }
  };

  // Check eligibility for selected event
  const handleCheckEligibility = async () => {
    if (!selectedEvent || !participant) {
      addToast('Please select an event', 'warning');
      return;
    }

    setCheckingEligibility(true);
    try {
      const response = await checkEligibilityMutation.mutateAsync({
        chestNumber: participant.chestNumber,
        eventName: selectedEvent,
      });
      
      setEligibility(response);
      setStep('check');
      
      if (!response.eligible) {
        addToast(response.reason || 'Appeal not eligible', 'warning');
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to check eligibility', 'error');
    } finally {
      setCheckingEligibility(false);
    }
  };

  // Submit appeal
  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!statement.trim() || statement.trim().length < 10) {
      addToast('Please provide an appeal statement (minimum 10 characters)', 'warning');
      return;
    }

    if (!participant || !selectedEvent || !eligibility?.eligible) {
      addToast('Cannot submit appeal. Please check eligibility first.', 'error');
      return;
    }

    try {
      await submitAppealMutation.mutateAsync({
        participant_id: participant.id,
        chest_number: participant.chestNumber,
        event_name: selectedEvent,
        statement: statement.trim(),
        payment_type: 'Appeal Fee',
      });
      
      setStep('success');
    } catch (err: any) {
      // Error handled by mutation
    }
  };

  // Format time remaining
  const formatTimeRemaining = (minutes: number) => {
    if (minutes <= 0) return 'Expired';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m remaining`;
    }
    return `${mins}m remaining`;
  };

  // Get scored events
  const scoredEvents = participant?.eventResults.filter(e => e.status === 'SCORED') || [];

  return (
    <div className="min-h-screen bg-bgLight flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate('/kalamela')}
              className="flex items-center text-textMuted hover:text-primary transition-colors mr-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              aria-label="Back to Kalamela"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">
              K
            </div>
            <h1 className="text-xl font-bold text-textDark">File an Appeal</h1>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate('/login?portal=kalamela')}>
            Official Login
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Info Card */}
          <Card className="bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Appeal Process</h3>
                <p className="text-sm text-blue-800">
                  You have a 30-minute window after results are published to file an appeal. 
                  An appeal fee of ₹1000 is required. Appeals are reviewed by administrators.
                </p>
              </div>
            </div>
          </Card>

          {/* Step 1: Search */}
          {step === 'search' && (
            <Card>
              <h2 className="text-2xl font-bold text-textDark mb-4">Step 1: Enter Chest Number</h2>
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-textDark mb-2">
                    Chest Number
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter Chest Number (e.g., S001-01-001)"
                      className="flex-1 px-4 py-3 border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={chestNumber}
                      onChange={(e) => setChestNumber(e.target.value)}
                      disabled={searching}
                    />
                    <Button type="submit" disabled={searching}>
                      {searching ? (
                        <>
                          <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          Search
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          )}

          {/* Step 2: Select Event */}
          {step === 'select' && participant && (
            <Card>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-textDark mb-2">Step 2: Select Event</h2>
                <div className="bg-bgLight p-4 rounded-md">
                  <p className="font-semibold text-textDark">{participant.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="primary">{participant.chestNumber}</Badge>
                    <Badge variant="light">{participant.unit}</Badge>
                    <span className="text-sm text-textMuted">• {participant.district}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-textDark mb-2">
                  Select an event to appeal:
                </label>
                {scoredEvents.map((event, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedEvent(event.eventName)}
                    className={`w-full p-4 border-2 rounded-md text-left transition-all ${
                      selectedEvent === event.eventName
                        ? 'border-primary bg-primary/5'
                        : 'border-borderColor hover:border-primary/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-textDark">{event.eventName}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={event.grade === 'A' ? 'success' : event.grade === 'B' ? 'warning' : 'danger'}>
                            Grade {event.grade}
                          </Badge>
                          <span className="text-sm text-textMuted">
                            Score: {event.marks}/100
                          </span>
                          {event.position && (
                            <span className="text-sm text-textMuted">
                              • Position: {event.position}{event.position === 1 ? 'st' : event.position === 2 ? 'nd' : event.position === 3 ? 'rd' : 'th'}
                            </span>
                          )}
                        </div>
                      </div>
                      {selectedEvent === event.eventName && (
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={() => {
                  setStep('search');
                  setParticipant(null);
                  setSelectedEvent('');
                }}>
                  Back
                </Button>
                <Button 
                  onClick={handleCheckEligibility}
                  disabled={!selectedEvent || checkingEligibility}
                  className="flex-1"
                >
                  {checkingEligibility ? 'Checking...' : 'Check Eligibility'}
                </Button>
              </div>
            </Card>
          )}

          {/* Step 3: Check Eligibility */}
          {step === 'check' && eligibility && participant && (
            <Card>
              <h2 className="text-2xl font-bold text-textDark mb-4">Step 3: Eligibility Check</h2>
              
              {eligibility.eligible ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-900">Eligible for Appeal</span>
                    </div>
                    <div className="space-y-2 text-sm text-green-800">
                      {eligibility.time_remaining_minutes !== undefined && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatTimeRemaining(eligibility.time_remaining_minutes)}</span>
                        </div>
                      )}
                      {eligibility.appeal_fee !== undefined && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Appeal Fee: ₹{eligibility.appeal_fee}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <form onSubmit={handleSubmitAppeal} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-textDark mb-2">
                        Appeal Statement <span className="text-danger">*</span>
                      </label>
                      <textarea
                        rows={6}
                        className="w-full px-4 py-3 border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Please provide a detailed statement explaining why you are appealing the results (minimum 10 characters)"
                        value={statement}
                        onChange={(e) => setStatement(e.target.value)}
                        required
                      />
                      <p className="text-xs text-textMuted mt-1">
                        {statement.length}/10 characters minimum
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => {
                        setStep('select');
                        setEligibility(null);
                        setStatement('');
                      }}>
                        Back
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={statement.trim().length < 10 || submitAppealMutation.isPending}
                        className="flex-1"
                      >
                        {submitAppealMutation.isPending ? 'Submitting...' : 'Submit Appeal'}
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span className="font-semibold text-red-900">Not Eligible</span>
                    </div>
                    <p className="text-sm text-red-800">{eligibility.reason}</p>
                    {eligibility.time_elapsed_minutes !== undefined && (
                      <p className="text-sm text-red-700 mt-2">
                        Time elapsed: {eligibility.time_elapsed_minutes} minutes
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => {
                      setStep('select');
                      setEligibility(null);
                    }}>
                      Back
                    </Button>
                    <Button onClick={() => navigate('/kalamela')}>
                      Return to Home
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <Card>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-textDark mb-2">Appeal Submitted Successfully!</h2>
                <p className="text-textMuted mb-6">
                  Your appeal has been submitted and will be reviewed by administrators. 
                  You will be notified once a decision is made.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => {
                    navigate('/kalamela');
                    // Reset form
                    setStep('search');
                    setChestNumber('');
                    setParticipant(null);
                    setSelectedEvent('');
                    setEligibility(null);
                    setStatement('');
                  }}>
                    Return to Home
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setStep('search');
                    setChestNumber('');
                    setParticipant(null);
                    setSelectedEvent('');
                    setEligibility(null);
                    setStatement('');
                  }}>
                    Submit Another Appeal
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer siteSettings={siteSettings} />
    </div>
  );
};

