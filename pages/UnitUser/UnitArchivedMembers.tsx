import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Archive, AlertCircle, ArrowLeft } from 'lucide-react';
import { Card, Button } from '../../components/ui';
import { ArchivedMembersSection } from '../../components/ArchivedMembersSection';
import { WizardReturnState } from '../../types';
import { useRecentArchivedMembers } from '../../hooks/queries';

export const UnitArchivedMembers: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnState = (location.state as WizardReturnState | null) ?? undefined;
  const returnTo = returnState?.returnTo;
  const returnLabel = returnState?.returnLabel ?? 'Back to Registration';

  const { data, isLoading, isError } = useRecentArchivedMembers();

  const handleBackToWizard = () => {
    if (!returnTo) return;
    navigate(returnTo, {
      state: returnState?.wizardStep ? { wizardStep: returnState.wizardStep } : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-1/3" />
        <div className="h-32 bg-gray-200 rounded" />
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-danger mx-auto mb-3" />
        <h2 className="text-lg font-bold text-textDark">Unable to load archived members</h2>
        <p className="text-sm text-textMuted mt-1">Please try again later.</p>
        {returnTo && (
          <Button type="button" variant="outline" className="mt-4" onClick={handleBackToWizard}>
            {returnLabel}
          </Button>
        )}
      </Card>
    );
  }

  const hasMembers = data.members.length > 0;

  return (
    <div className="space-y-6 animate-slide-in">
      {returnTo && (
        <Button type="button" variant="outline" size="sm" onClick={handleBackToWizard}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          {returnLabel}
        </Button>
      )}

      <div>
        <div className="flex items-center gap-2">
          <Archive className="w-6 h-6 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">
            Recently Archived Members
          </h1>
        </div>
        <p className="mt-1 text-sm text-textMuted">
          Members archived in the most recent registration cycle for your unit.
          {data.archive_year ? ` Season: ${data.archive_year}.` : ''}
        </p>
      </div>

      {hasMembers ? (
        <>
          <ArchivedMembersSection data={data} variant="full" showRaiseConcern />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-borderColor/60">
            <p className="text-xs text-textMuted">
              Raising a concern sends your question to the admin team for review. It does not
              automatically restore a member. Track responses in{' '}
              <Link to="/unit/my-requests" className="text-primary hover:underline">
                My Requests
              </Link>
              .
            </p>
            {returnTo && (
              <Button type="button" onClick={handleBackToWizard}>
                Continue Registration
              </Button>
            )}
          </div>
        </>
      ) : (
        <Card className="text-center py-12">
          <Archive className="w-14 h-14 text-textMuted mx-auto mb-3" />
          <h2 className="text-lg font-bold text-textDark">No recent archived members</h2>
          <p className="text-sm text-textMuted mt-1">
            No members were archived for your unit in the latest registration cycle.
          </p>
          {returnTo && (
            <Button type="button" className="mt-4" onClick={handleBackToWizard}>
              {returnLabel}
            </Button>
          )}
        </Card>
      )}
    </div>
  );
};
