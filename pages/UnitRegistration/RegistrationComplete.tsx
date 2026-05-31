import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowLeft, FileText } from 'lucide-react';
import { Button } from '../../components/ui';
import { useApplicationForm } from '../../hooks/queries';
import { FeeSummary } from './components/FeeSummary';
import { Navigate } from 'react-router-dom';
import { isRegistrationComplete } from './utils';

export const RegistrationComplete: React.FC = () => {
  const { data: formData, isLoading } = useApplicationForm();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bgLight flex items-center justify-center">
        <p className="text-textMuted">Loading...</p>
      </div>
    );
  }

  if (formData && !isRegistrationComplete(formData.registration_status)) {
    return <Navigate to="/register/wizard" replace />;
  }

  return (
    <div className="min-h-screen bg-bgLight flex flex-col justify-center py-12 px-4">
      <div className="max-w-lg mx-auto text-center">
        <div className="h-16 w-16 bg-success/10 rounded-full mx-auto flex items-center justify-center mb-4">
          <CheckCircle size={36} className="text-success" />
        </div>
        <h1 className="text-2xl font-bold text-textDark">Registration Complete</h1>
        <p className="mt-2 text-sm text-textMuted">
          Your unit registration has been submitted successfully.
        </p>
        {formData && (
          <>
            <p className="mt-4 text-sm text-textDark">
              Unit: <strong>{formData.user_data.unit_name}</strong>
            </p>
            <p className="text-sm text-textMuted">
              Registration ID: {formData.user_data.username}
            </p>
            <div className="mt-6 text-left">
              <FeeSummary
                memberCount={formData.member_count}
                membersAmount={formData.members_amount}
                totalAmount={formData.total_amount}
              />
            </div>
          </>
        )}

        <div className="mt-8 p-4 bg-white border border-borderColor rounded-lg text-left text-sm text-textMuted">
          <div className="flex items-center gap-2 mb-2 text-textDark font-medium">
            <FileText className="w-4 h-4" />
            Next Steps
          </div>
          <p>
            Submit the hard copy of the generated registration form to the Youth Office before the deadline, by post or in person.
            You can manage change requests from your unit portal after logging in.
          </p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <Link to="/unit/my-requests">
            <Button variant="primary">View My Requests</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
