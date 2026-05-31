import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';
import { ArrowLeft, Printer, ChevronDown, Download } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';
import { Unit, UnitOfficial, UnitCouncilor, UnitMember } from '../../types';
import {
  UnitRegistrationFormDocument,
  registrationFormPrintStyles,
} from '../../components/UnitRegistrationFormDocument';
import { mapAdminUnitToDocument } from '../UnitRegistration/utils/registrationFormMapper';
import { useSiteSettings } from '../../hooks/queries/useSiteSettings';
import { generatePdfFromElement } from '../../services/generatePdf';

export const PrintForm: React.FC = () => {
  const { unitId } = useParams<{ unitId: string }>();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { data: siteSettings } = useSiteSettings();

  const [unit, setUnit] = useState<Unit | null>(null);
  const [official, setOfficial] = useState<UnitOfficial | null>(null);
  const [councilors, setCouncilors] = useState<UnitCouncilor[]>([]);
  const [members, setMembers] = useState<UnitMember[]>([]);
  const [fees, setFees] = useState({ unitRegistrationFee: 100, unitMemberFee: 10, totalAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadUnitDetails = async () => {
      if (!unitId) return;

      try {
        setLoading(true);
        const id = parseInt(unitId);

        const [unitRes, officialsRes, councilorsRes, membersRes, settingsRes] = await Promise.all([
          api.getUnitById(id),
          api.getUnitOfficials(id),
          api.getUnitCouncilors(id),
          api.getUnitMembers(id),
          api.getSiteSettings(),
        ]);

        const unitRegistrationFee = settingsRes.unit_registration_fee ?? 100;
        const unitMemberFee = settingsRes.unit_member_fee ?? 10;
        const membersCount = membersRes.data.length;
        const totalAmount = unitRegistrationFee + membersCount * unitMemberFee;

        setUnit({
          ...unitRes.data,
          membersCount,
        });
        setOfficial(officialsRes.data[0] || null);
        setCouncilors(councilorsRes.data);
        setMembers(membersRes.data);
        setFees({ unitRegistrationFee, unitMemberFee, totalAmount });
      } catch (err) {
        console.error('Failed to load unit details', err);
        addToast('Failed to load unit details', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadUnitDetails();
  }, [unitId, addToast]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!formRef.current) return;
    const filename = unit
      ? `${unit.unitNumber.replace(/\//g, '-')}-registration-form.pdf`
      : 'registration-form.pdf';
    try {
      setDownloading(true);
      await generatePdfFromElement(formRef.current, { filename });
      addToast('Registration form downloaded', 'success');
    } catch (error) {
      console.error('Failed to generate registration form PDF', error);
      addToast('Failed to download registration form', 'error');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = () => setShowDropdown(false);
    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDropdown]);

  if (loading || !unit) {
    return (
      <div className="min-h-screen bg-white p-8">
        <p className="text-center text-textMuted">Loading...</p>
      </div>
    );
  }

  const documentProps = mapAdminUnitToDocument(unit, official, councilors, members, fees);

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
        <div className="flex items-center gap-3">
          <div className="relative">
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
            >
              Request Changes
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
            {showDropdown && (
              <div
                className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10 border border-borderColor"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="py-1">
                  <button onClick={() => navigate('/admin/archived-members')} className="block w-full text-left px-4 py-2 text-sm text-textDark hover:bg-gray-100">
                    Archived Members
                  </button>
                  <button onClick={() => navigate('/admin/requests/transfers')} className="block w-full text-left px-4 py-2 text-sm text-textDark hover:bg-gray-100">
                    View Unit Transfer Requests
                  </button>
                  <button onClick={() => navigate('/unit/submit-transfer')} className="block w-full text-left px-4 py-2 text-sm text-textDark hover:bg-gray-100">
                    Create Unit Transfer Request
                  </button>
                  <button onClick={() => navigate('/unit/submit-member-info')} className="block w-full text-left px-4 py-2 text-sm text-textDark hover:bg-gray-100">
                    Create Member Info Change Request
                  </button>
                  <button onClick={() => navigate('/admin/requests/member-info')} className="block w-full text-left px-4 py-2 text-sm text-textDark hover:bg-gray-100">
                    View Member Info Change Requests
                  </button>
                  <button onClick={() => navigate('/unit/submit-officials')} className="block w-full text-left px-4 py-2 text-sm text-textDark hover:bg-gray-100">
                    Create Officials Change Request
                  </button>
                  <button onClick={() => navigate('/admin/requests/officials')} className="block w-full text-left px-4 py-2 text-sm text-textDark hover:bg-gray-100">
                    View Officials Change Requests
                  </button>
                  <button onClick={() => navigate('/unit/submit-councilor')} className="block w-full text-left px-4 py-2 text-sm text-textDark hover:bg-gray-100">
                    Create Councilor Change Request
                  </button>
                  <button onClick={() => navigate('/admin/requests/councilors')} className="block w-full text-left px-4 py-2 text-sm text-textDark hover:bg-gray-100">
                    View Councilor Change Requests
                  </button>
                  <button onClick={() => navigate('/unit/submit-member-add')} className="block w-full text-left px-4 py-2 text-sm text-textDark hover:bg-gray-100">
                    Add New Unit Member
                  </button>
                </div>
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print Form
          </Button>
          <Button variant="primary" size="sm" onClick={handleDownloadPdf} isLoading={downloading}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      <div ref={formRef}>
        <UnitRegistrationFormDocument
          {...documentProps}
          youthLogoUrl={siteSettings?.logo_secondary_url}
          csiLogoUrl={siteSettings?.logo_tertiary_url}
        />
      </div>

      <style>{registrationFormPrintStyles}</style>
    </div>
  );
};
