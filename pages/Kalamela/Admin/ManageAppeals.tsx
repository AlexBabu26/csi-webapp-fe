import React, { useEffect, useState } from 'react';
import { Card, Badge, Button } from '../../../components/ui';
import { MessageSquare, AlertCircle } from 'lucide-react';
import { useToast } from '../../../components/Toast';
import { api } from '../../../services/api';

export const ManageAppeals: React.FC = () => {
  const { addToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [selectedAppeal, setSelectedAppeal] = useState<any | null>(null);
  const [reply, setReply] = useState('');
  const [newPosition, setNewPosition] = useState<number | null>(null);
  const [appeals, setAppeals] = useState<any[]>([]);

  useEffect(() => {
    loadAppeals();
  }, []);

  const loadAppeals = async () => {
    try {
      setLoading(true);
      const response = await api.getKalamelaAdminAppeals();
      setAppeals(response.data);
    } catch (err) {
      addToast("Failed to load appeals", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!selectedAppeal || !reply.trim()) {
      addToast("Please enter a reply", "warning");
      return;
    }

    try {
      setSubmitting(true);
      await api.replyToAppeal(selectedAppeal.appeal_id, reply, newPosition || undefined);
      addToast("Reply sent successfully", "success");
      setShowReplyDialog(false);
      setSelectedAppeal(null);
      setReply('');
      setNewPosition(null);
      loadAppeals();
    } catch (err: any) {
      addToast(err.message || "Failed to send reply", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openReplyDialog = (appeal: any) => {
    setSelectedAppeal(appeal);
    setShowReplyDialog(true);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-in">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        <Card className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-full mb-3"></div>
        </Card>
      </div>
    );
  }

  const pendingAppeals = appeals.filter(a => a.status === 'Pending');
  const repliedAppeals = appeals.filter(a => a.status === 'Replied');

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">
          Appeals Management
        </h1>
        <p className="mt-1 text-sm text-textMuted">
          Review and respond to participant appeals
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-textMuted mb-2">Pending Appeals</p>
          <p className="text-3xl font-bold text-warning">{pendingAppeals.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-textMuted mb-2">Replied</p>
          <p className="text-3xl font-bold text-success">{repliedAppeals.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-textMuted mb-2">Total Appeals</p>
          <p className="text-3xl font-bold text-primary">{appeals.length}</p>
        </Card>
      </div>

      {/* Pending Appeals */}
      {pendingAppeals.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-textDark mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warning" />
            Pending Appeals
          </h2>
          <div className="space-y-4">
            {pendingAppeals.map((appeal) => (
              <Card key={appeal.appeal_id} className="bg-warning/5 border-warning/20">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-textDark">{appeal.event_name}</h3>
                        <Badge variant="warning">Pending</Badge>
                        {appeal.event_type && (
                          <Badge variant="light">{appeal.event_type}</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-textMuted">Chest Number:</p>
                          <p className="font-semibold text-textDark">{appeal.chest_number}</p>
                        </div>
                        <div>
                          <p className="text-textMuted">Participant:</p>
                          <p className="font-semibold text-textDark">{appeal.participant_name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-textMuted">Unit:</p>
                          <p className="font-semibold text-textDark">{appeal.unit_name}</p>
                        </div>
                        <div>
                          <p className="text-textMuted">Current Position:</p>
                          <p className="font-semibold text-textDark">{appeal.current_position || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => openReplyDialog(appeal)}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Reply
                    </Button>
                  </div>

                  <div className="p-3 bg-bgLight rounded-lg">
                    <p className="text-sm font-medium text-textDark mb-1">Appeal Statement:</p>
                    <p className="text-sm text-textMuted">{appeal.statement}</p>
                  </div>

                  {appeal.submitted_at && (
                    <p className="text-xs text-textMuted">
                      Submitted: {new Date(appeal.submitted_at).toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Replied Appeals */}
      {repliedAppeals.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-textDark mb-4">Replied Appeals</h2>
          <div className="space-y-4">
            {repliedAppeals.map((appeal) => (
              <Card key={appeal.appeal_id} className="bg-success/5 border-success/20">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-textDark">{appeal.event_name}</h3>
                        <Badge variant="success">Replied</Badge>
                      </div>
                      <p className="text-sm text-textMuted">
                        {appeal.chest_number} • {appeal.participant_name || appeal.unit_name}
                      </p>
                    </div>
                    {appeal.new_position && (
                      <Badge variant="warning">New Position: {appeal.new_position}</Badge>
                    )}
                  </div>

                  <div className="p-3 bg-bgLight rounded-lg">
                    <p className="text-sm font-medium text-textDark mb-1">Admin Reply:</p>
                    <p className="text-sm text-textMuted">{appeal.admin_reply}</p>
                  </div>

                  {appeal.replied_at && (
                    <p className="text-xs text-textMuted">
                      Replied: {new Date(appeal.replied_at).toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {appeals.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-textMuted">No appeals submitted yet</p>
        </Card>
      )}

      {/* Reply Dialog */}
      {showReplyDialog && selectedAppeal && (
        <>
          <div className="fixed inset-0 bg-textDark/50 backdrop-blur-sm z-50" onClick={() => setShowReplyDialog(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full pointer-events-auto animate-slide-in">
              <div className="p-6">
                <h3 className="text-xl font-bold text-textDark mb-4">Reply to Appeal</h3>
                
                {/* Appeal Details */}
                <div className="mb-4 p-4 bg-bgLight rounded-lg">
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-textMuted">Event:</p>
                      <p className="font-semibold text-textDark">{selectedAppeal.event_name}</p>
                    </div>
                    <div>
                      <p className="text-textMuted">Chest Number:</p>
                      <p className="font-semibold text-textDark">{selectedAppeal.chest_number}</p>
                    </div>
                    <div>
                      <p className="text-textMuted">Participant:</p>
                      <p className="font-semibold text-textDark">{selectedAppeal.participant_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-textMuted">Current Position:</p>
                      <p className="font-semibold text-textDark">{selectedAppeal.current_position || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-textMuted mb-1">Appeal Statement:</p>
                    <p className="text-sm text-textDark">{selectedAppeal.statement}</p>
                  </div>
                </div>

                {/* Reply Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-textDark mb-2">
                      Reply <span className="text-danger">*</span>
                    </label>
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      className="w-full px-3 py-2 border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                      rows={4}
                      placeholder="Enter your reply to the appellant..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-textDark mb-2">
                      New Position (Optional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newPosition || ''}
                      onChange={(e) => setNewPosition(e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="Leave blank if no position change"
                      className="w-full px-3 py-2 border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <p className="text-xs text-textMuted mt-1">
                      Only enter a new position if the appeal is accepted and position needs to be updated
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => {
                    setShowReplyDialog(false);
                    setReply('');
                    setNewPosition(null);
                  }}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleReply}
                    disabled={submitting || !reply.trim()}
                  >
                    {submitting ? 'Sending...' : 'Send Reply'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};


