import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../../../components/ui';
import { FileText, CheckCircle } from 'lucide-react';
import { useFinishRegistration, useCompleteDeclaration } from '../../../hooks/queries';
import { formatRegistrationSeason } from '../../../services/authRouting';
import { FeeSummary } from '../components/FeeSummary';
import { WizardStepActions, WizardStepNavigationProps } from '../components/WizardStepActions';

export const DeclarationStep: React.FC<WizardStepNavigationProps> = ({
  onPrevious,
  showPrevious,
}) => {
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(false);
  const { data: summary, isLoading } = useFinishRegistration(true);
  const completeDeclaration = useCompleteDeclaration();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) return;
    await completeDeclaration.mutateAsync();
    navigate('/register/complete');
  };

  if (isLoading || !summary) {
    return (
      <Card>
        <p className="text-textMuted text-center py-8">Loading registration summary...</p>
      </Card>
    );
  }

  const officials = summary.unit_officials;
  const registrationSeason =
    summary.unit_details?.registration_year != null
      ? formatRegistrationSeason(summary.unit_details.registration_year)
      : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="text-lg font-bold text-textDark mb-4">Unit Details</h3>
            <p className="text-sm text-textMuted">
              Registration year:{' '}
              {summary.unit_details?.registration_year != null
                ? `${summary.unit_details.registration_year - 1}–${summary.unit_details.registration_year}`
                : new Date().getFullYear()}
            </p>
            <p className="text-sm text-textMuted mt-1">Total members: {summary.members_count}</p>
          </Card>

          {officials && (
            <Card>
              <h3 className="text-lg font-bold text-textDark mb-4">Unit Officials</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {officials.president_name && (
                  <div>
                    <dt className="text-textMuted">President</dt>
                    <dd className="font-medium">{officials.president_designation} {officials.president_name} — {officials.president_phone}</dd>
                  </div>
                )}
                {officials.vice_president_name && (
                  <div>
                    <dt className="text-textMuted">Vice President</dt>
                    <dd className="font-medium">{officials.vice_president_name} — {officials.vice_president_phone}</dd>
                  </div>
                )}
                {officials.secretary_name && (
                  <div>
                    <dt className="text-textMuted">Secretary</dt>
                    <dd className="font-medium">{officials.secretary_name} — {officials.secretary_phone}</dd>
                  </div>
                )}
                {officials.joint_secretary_name && (
                  <div>
                    <dt className="text-textMuted">Joint Secretary</dt>
                    <dd className="font-medium">{officials.joint_secretary_name} — {officials.joint_secretary_phone}</dd>
                  </div>
                )}
                {officials.treasurer_name && (
                  <div>
                    <dt className="text-textMuted">Treasurer</dt>
                    <dd className="font-medium">{officials.treasurer_name} — {officials.treasurer_phone}</dd>
                  </div>
                )}
              </dl>
            </Card>
          )}

          <Card>
            <h3 className="text-lg font-bold text-textDark mb-4">Councilors ({summary.councilors_count})</h3>
            <ul className="text-sm space-y-1">
              {summary.unit_members
                .filter((m) => summary.unit_councilors.some((c) => c.unit_member_id === m.id))
                .map((m, i) => (
                  <li key={m.id}>{i + 1}. {m.name}</li>
                ))}
            </ul>
          </Card>

          <Card>
            <h3 className="text-lg font-bold text-textDark mb-4">Members ({summary.members_count})</h3>
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-textMuted border-b">
                    <th className="py-1 pr-2">Name</th>
                    <th className="py-1 pr-2">Gender</th>
                    <th className="py-1">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.unit_members.map((m) => (
                    <tr key={m.id} className="border-b border-borderColor/30">
                      <td className="py-1 pr-2">{m.name}</td>
                      <td className="py-1 pr-2">{m.gender}</td>
                      <td className="py-1">{m.number}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold text-textDark">Declaration</h3>
            </div>
            <p className="text-sm text-textDark leading-relaxed mb-4">
              I hereby declare that all the above-mentioned information provided by me is true and accurate to the best of my knowledge and belief.
              Additionally, I am submitting a payment of Rs.{summary.total_amount}/- (incl. unit reg. fee - Rs.{summary.unit_registration_fee}/- & Rs.{summary.unit_member_fee}/- for {summary.members_count} member{summary.members_count === 1 ? '' : 's'}).
              Please register the above unit and its members for the year {registrationSeason ?? 'the current registration season'}.
            </p>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1 h-4 w-4 text-primary rounded border-borderColor"
              />
              <span className="text-sm text-textDark">
                I confirm all information is accurate and agree to the declaration above.
              </span>
            </label>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <FeeSummary
            memberCount={summary.members_count}
            unitRegistrationFee={summary.unit_registration_fee}
            unitMemberFee={summary.unit_member_fee}
            membersAmount={summary.members_amount}
            totalAmount={summary.total_amount}
          />
        </div>
      </div>

      <WizardStepActions standalone onPrevious={onPrevious} showPrevious={showPrevious}>
        <Button type="submit" disabled={!confirmed} isLoading={completeDeclaration.isPending}>
          <CheckCircle className="w-4 h-4 mr-2" />
          Complete Registration
        </Button>
      </WizardStepActions>
    </form>
  );
};
