import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

interface RenewalChangeRequestNoticeProps {
  requestPath: string;
  requestLabel: string;
}

export const RenewalChangeRequestNotice: React.FC<RenewalChangeRequestNoticeProps> = ({
  requestPath,
  requestLabel,
}) => (
  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-textDark flex gap-3">
    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
    <p>
      Existing records are read-only during renewal. To update details, submit a{' '}
      <Link to={requestPath} className="font-medium text-primary hover:underline">
        {requestLabel}
      </Link>{' '}
      from My Requests and wait for admin approval before continuing registration.
    </p>
  </div>
);
