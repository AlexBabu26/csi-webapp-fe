import React, { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';
import { ArrowLeft, Download } from 'lucide-react';
import { UnitRegistrationFormDocument } from '../../components/UnitRegistrationFormDocument';
import { mapAdminUnitToDocument } from '../UnitRegistration/utils/registrationFormMapper';
import { useSiteSettings } from '../../hooks/queries/useSiteSettings';
import { useUnitDetailFull } from '../../hooks/queries';
import { useToast } from '../../components/Toast';

export const PrintForm: React.FC = () => {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { data: siteSettings } = useSiteSettings();

  const parsedUnitId = unitId ? parseInt(unitId, 10) : 0;
  const {
    unit,
    official,
    councilors,
    members,
    unitRegistrationFee,
    unitMemberFee,
    totalAmount,
    isLoading: loading,
  } = useUnitDetailFull(parsedUnitId);

  const [downloading, setDownloading] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    if (!formRef.current) return;
    const filename = unit
      ? `${unit.unitNumber.replace(/\//g, '-')}-registration-form.pdf`
      : 'registration-form.pdf';
    try {
      setDownloading(true);
      const { generatePdfFromElement } = await import('../../services/generatePdf');
      await generatePdfFromElement(formRef.current, { filename });
      addToast('Registration form downloaded', 'success');
    } catch (error) {
      console.error('Failed to generate registration form PDF', error);
      addToast('Failed to download registration form', 'error');
    } finally {
      setDownloading(false);
    }
  };

  if (loading || !unit) {
    return (
      <div className="min-h-screen bg-white p-8">
        <p className="text-center text-textMuted">Loading...</p>
      </div>
    );
  }

  const documentProps = mapAdminUnitToDocument(
    unit,
    official,
    councilors,
    members,
    {
      unitRegistrationFee,
      unitMemberFee,
      totalAmount,
    },
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="no-print p-4 bg-gray-50 border-b border-borderColor flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/admin/units/${unitId}`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button variant="primary" size="sm" onClick={handleDownloadPdf} isLoading={downloading}>
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
      </div>

      <div ref={formRef}>
        <UnitRegistrationFormDocument
          {...documentProps}
          youthLogoUrl={siteSettings?.logo_secondary_url}
          churchLogoUrl={siteSettings?.logo_primary_url}
        />
      </div>

    </div>
  );
};
