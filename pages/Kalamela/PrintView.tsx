import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';
import { ArrowLeft, Printer } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';

export const PrintView: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    unit_name: string;
    district_name: string;
    individual_event_participations: Record<string, any[]>;
    group_event_participations: Record<string, any[]>;
    total_amount_paid: number;
    payment_date?: string;
  } | null>(null);

  useEffect(() => {
    loadPrintData();
  }, []);

  const loadPrintData = async () => {
    try {
      setLoading(true);
      const response = await api.getOfficialPrintView();
      setData(response.data);
    } catch (err) {
      addToast("Failed to load print data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      {/* Non-Printable Header */}
      <div className="no-print mb-6 flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/kalamela/official/preview')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-textDark">Print Registration Form</h1>
          <p className="text-sm text-textMuted mt-1">Print your Kalamela registration details</p>
        </div>
        <Button variant="primary" size="sm" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
      </div>

      {/* Printable Content */}
      <div className="print-content bg-white p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-gray-300 pb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CSI Madhya Kerala Diocese</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-1">Youth Movement</h2>
          <h3 className="text-xl text-gray-600">Kalamela Registration Form</h3>
        </div>

        {/* Unit Details */}
        <div className="mb-8 bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Unit Name</p>
              <p className="font-semibold text-gray-900">{data.unit_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Clergy District</p>
              <p className="font-semibold text-gray-900">{data.district_name}</p>
            </div>
            {data.payment_date && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Payment Date</p>
                <p className="font-semibold text-gray-900">
                  {new Date(data.payment_date).toLocaleDateString('en-IN')}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Amount Paid</p>
              <p className="font-semibold text-gray-900">Rs.{data.total_amount_paid}</p>
            </div>
          </div>
        </div>

        {/* Individual Events */}
        {Object.keys(data.individual_event_participations).length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
              Individual Event Registrations
            </h3>
            {Object.entries(data.individual_event_participations).map(([eventName, participants], eventIdx) => (
              <div key={eventIdx} className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3 text-lg">
                  {eventIdx + 1}. {eventName}
                </h4>
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm">Sl. No.</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm">Chest Number</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm">Participant Name</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((participant: any, idx: number) => (
                      <tr key={idx}>
                        <td className="border border-gray-300 px-4 py-2 text-sm">{idx + 1}</td>
                        <td className="border border-gray-300 px-4 py-2 text-sm font-medium">
                          {participant.chest_number}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-sm">{participant.participant_name}</td>
                        <td className="border border-gray-300 px-4 py-2 text-sm">
                          {participant.seniority_category || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {/* Group Events */}
        {Object.keys(data.group_event_participations).length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
              Group Event Registrations
            </h3>
            {Object.entries(data.group_event_participations).map(([eventName, teams], eventIdx) => (
              <div key={eventIdx} className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3 text-lg">
                  {eventIdx + 1}. {eventName}
                </h4>
                {teams.map((team: any, teamIdx: number) => (
                  <div key={teamIdx} className="mb-4">
                    <p className="font-medium text-gray-700 mb-2">
                      Team {teamIdx + 1} - Chest Number: {team.chest_number}
                    </p>
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-4 py-2 text-left text-sm">Sl. No.</th>
                          <th className="border border-gray-300 px-4 py-2 text-left text-sm">Participant Name</th>
                          <th className="border border-gray-300 px-4 py-2 text-left text-sm">Age</th>
                          <th className="border border-gray-300 px-4 py-2 text-left text-sm">Gender</th>
                        </tr>
                      </thead>
                      <tbody>
                        {team.members.map((member: any, idx: number) => (
                          <tr key={idx}>
                            <td className="border border-gray-300 px-4 py-2 text-sm">{idx + 1}</td>
                            <td className="border border-gray-300 px-4 py-2 text-sm">{member.name}</td>
                            <td className="border border-gray-300 px-4 py-2 text-sm">{member.age}</td>
                            <td className="border border-gray-300 px-4 py-2 text-sm">{member.gender}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t-2 border-gray-300">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-sm text-gray-600 mb-8">Unit President Signature:</p>
              <div className="border-b border-gray-400 w-3/4"></div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-8">Date:</p>
              <div className="border-b border-gray-400 w-3/4"></div>
            </div>
          </div>
          
          <div className="mt-8 text-center text-sm text-gray-600">
            <p>Generated on: {new Date().toLocaleString('en-IN')}</p>
            <p className="mt-2">For official use only - CSI Madhya Kerala Diocese Youth Movement</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          .print-content {
            max-width: 100%;
            padding: 20mm;
          }
          
          body {
            background: white;
          }
          
          @page {
            size: A4;
            margin: 15mm;
          }
        }
      `}</style>
    </>
  );
};


