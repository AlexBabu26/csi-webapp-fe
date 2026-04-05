import React, { useState } from 'react';
import {
  MessageSquarePlus,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Send,
  MessageCircle,
} from 'lucide-react';
import {
  Card,
  Badge,
  Button,
  Input,
  Select,
  Skeleton,
  EmptyState,
} from '../../../components/ui';
import { useToast } from '../../../components/Toast';
import { useYMComplaints, useYMCreateComplaint } from '../../../hooks/queries';
import { YMComplaint, YMComplaintCategory } from '../../../types';

const PAGE_SIZE = 10;

const CATEGORY_OPTIONS: { value: YMComplaintCategory | ''; label: string }[] = [
  { value: '', label: 'Select category' },
  { value: 'delivery_issue', label: 'Delivery Issue' },
  { value: 'payment_dispute', label: 'Payment Dispute' },
  { value: 'content_issue', label: 'Content Issue' },
  { value: 'subscription_problem', label: 'Subscription Problem' },
  { value: 'other', label: 'Other' },
];

const statusBadge = (status: string) => {
  switch (status) {
    case 'open':
      return <Badge variant="info">Open</Badge>;
    case 'resolved':
      return <Badge variant="success">Resolved</Badge>;
    case 'closed':
      return <Badge variant="light">Closed</Badge>;
    default:
      return <Badge variant="light">{status}</Badge>;
  }
};

const categoryLabel = (cat: string) =>
  CATEGORY_OPTIONS.find((o) => o.value === cat)?.label ?? cat;

export const YMComplaints: React.FC = () => {
  const { addToast } = useToast();

  const [page, setPage] = useState(0);
  const skip = page * PAGE_SIZE;
  const { data, isLoading, isError } = useYMComplaints(skip, PAGE_SIZE);
  const createComplaint = useYMCreateComplaint();

  const [category, setCategory] = useState<YMComplaintCategory | ''>('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const items: YMComplaint[] = data?.items ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      addToast('Please select a category', 'error');
      return;
    }
    if (!subject.trim()) {
      addToast('Subject is required', 'error');
      return;
    }
    if (!description.trim()) {
      addToast('Description is required', 'error');
      return;
    }

    createComplaint.mutate(
      { category: category as YMComplaintCategory, subject: subject.trim(), description: description.trim() },
      {
        onSuccess: () => {
          addToast('Complaint submitted successfully');
          setCategory('');
          setSubject('');
          setDescription('');
          setPage(0);
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.detail || 'Failed to submit complaint';
          addToast(typeof msg === 'string' ? msg : 'Failed to submit complaint', 'error');
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-textDark">Complaints</h1>
        <p className="text-textMuted mt-1">Submit a new complaint or track existing ones.</p>
      </div>

      {/* Create Complaint Form */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <MessageSquarePlus className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-textDark">New Complaint</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-1">
          <Select
            label="Category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value as YMComplaintCategory | '')}
            options={CATEGORY_OPTIONS}
          />

          <Input
            label="Subject"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief summary of the issue"
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-textDark mb-1.5">
              Description <span className="text-danger">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe your issue in detail..."
              className="block w-full rounded-md border border-borderColor px-3 py-2.5 text-textDark placeholder-gray-400 bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-sm transition-all resize-y"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" isLoading={createComplaint.isPending}>
              <Send className="w-4 h-4 mr-1.5" />
              Submit Complaint
            </Button>
          </div>
        </form>
      </Card>

      {/* Complaint History */}
      <div>
        <h2 className="text-base font-semibold text-textDark mb-3">Complaint History</h2>

        {isError ? (
          <Card>
            <p className="text-center text-textMuted py-6">Failed to load complaints.</p>
          </Card>
        ) : items.length === 0 ? (
          <Card>
            <EmptyState
              icon={<MessageCircle className="w-7 h-7 text-textMuted" />}
              title="No complaints"
              description="You haven't submitted any complaints yet."
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((c) => (
              <ComplaintItem key={c.id} complaint={c} />
            ))}

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-textMuted">
                  Showing {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-textDark font-medium px-1">
                    {page + 1} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ComplaintItem: React.FC<{ complaint: YMComplaint }> = ({ complaint }) => {
  const [expanded, setExpanded] = useState(false);
  const hasResponse = complaint.status === 'resolved' && complaint.admin_response;

  return (
    <Card>
      <div
        className={`flex items-start gap-3 ${hasResponse ? 'cursor-pointer' : ''}`}
        onClick={() => hasResponse && setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {statusBadge(complaint.status)}
            <Badge variant="light">{categoryLabel(complaint.category)}</Badge>
            <span className="text-xs text-textMuted ml-auto flex-shrink-0">
              {new Date(complaint.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <p className="font-medium text-textDark text-sm">{complaint.subject}</p>
          <p className="text-sm text-textMuted mt-0.5 line-clamp-2">{complaint.description}</p>
        </div>

        {hasResponse && (
          <button className="p-1 flex-shrink-0 text-textMuted mt-1">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}
      </div>

      {expanded && hasResponse && (
        <div className="mt-3 pt-3 border-t border-borderColor">
          <p className="text-xs font-medium text-textMuted mb-1">Admin Response</p>
          <p className="text-sm text-textDark bg-green-50 border border-green-200 rounded-md p-3">
            {complaint.admin_response}
          </p>
          {complaint.responded_at && (
            <p className="text-xs text-textMuted mt-1.5">
              Responded on {new Date(complaint.responded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
      )}
    </Card>
  );
};
