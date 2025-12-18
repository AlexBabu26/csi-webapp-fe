import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';
import { ArrowLeft, Printer, ChevronDown } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';
import { Unit, UnitOfficial, UnitCouncilor, UnitMember } from '../../types';

export const PrintForm: React.FC = () => {
  const { unitId } = useParams<{ unitId: string }>();
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  const [unit, setUnit] = useState<Unit | null>(null);
  const [official, setOfficial] = useState<UnitOfficial | null>(null);
  const [councilors, setCouncilors] = useState<UnitCouncilor[]>([]);
  const [members, setMembers] = useState<UnitMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const loadUnitDetails = async () => {
      if (!unitId) return;
      
      try {
        setLoading(true);
        const id = parseInt(unitId);
        
        const [unitRes, officialsRes, councilorsRes, membersRes] = await Promise.all([
          api.getUnitById(id),
          api.getUnitOfficials(id),
          api.getUnitCouncilors(id),
          api.getUnitMembers(id),
        ]);
        
        setUnit(unitRes.data);
        setOfficial(officialsRes.data[0] || null);
        setCouncilors(councilorsRes.data);
        setMembers(membersRes.data);
      } catch (err) {
        console.error("Failed to load unit details", err);
        addToast("Failed to load unit details", "error");
      } finally {
        setLoading(false);
      }
    };

    loadUnitDetails();
  }, [unitId, addToast]);

  const handlePrint = () => {
    window.print();
  };

  const totalAmount = unit ? 100 + (unit.membersCount * 10) : 0;

  // Close dropdown when clicking outside
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

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar with Buttons - Hidden on print */}
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
          {/* Request Changes Dropdown */}
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
          <Button variant="primary" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Click to Print Form
          </Button>
        </div>
      </div>

      {/* Print Content */}
      <div className="p-8 max-w-[210mm] mx-auto print:p-5" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Unit Number */}
        <div className="text-right mb-6">
          <table className="inline-block border border-borderColor">
            <tbody>
              <tr>
                <th className="border border-borderColor px-4 py-2 bg-gray-100">
                  Unit Registration Number: {unit.unitNumber}
                </th>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Header with Logos */}
        <div className="flex items-center justify-between mb-6">
          <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
            {/* Youth Logo Placeholder */}
            <span className="text-xs text-textMuted text-center">YOUTH<br />LOGO</span>
          </div>
          <div className="text-center flex-1 mx-4">
            <h1 className="text-2xl font-bold text-textDark mb-1">YOUTH MOVEMENT</h1>
            <h2 className="text-base font-semibold text-textDark mb-2">CSI MADHYA KERALA DIOCESE</h2>
            <br />
            <h3 className="text-base font-bold text-textDark">UNIT REGISTRATION FORM</h3>
          </div>
          <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
            {/* CSI Logo Placeholder */}
            <span className="text-xs text-textMuted text-center">CSI<br />LOGO</span>
          </div>
        </div>
        <br />

        {/* Unit Details */}
        <div className="mb-6 break-inside-avoid">
          <h3 className="text-left text-lg font-bold text-textDark mb-4">UNIT DETAILS</h3>
          <div className="space-y-3">
            <div className="border border-borderColor p-2">
              <label className="text-sm text-textMuted">Clergy District</label>
              <input 
                type="text" 
                value={unit.clergyDistrict} 
                readOnly 
                className="w-full border-none bg-transparent font-medium"
              />
            </div>
            <div className="border border-borderColor p-2">
              <label className="text-sm text-textMuted">Unit Name</label>
              <input 
                type="text" 
                value={unit.name} 
                readOnly 
                className="w-full border-none bg-transparent font-medium"
              />
            </div>
            <div className="border border-borderColor p-2">
              <label className="text-sm text-textMuted">Registration Year</label>
              <input 
                type="text" 
                value={unit.registrationYear} 
                readOnly 
                className="w-full border-none bg-transparent font-medium"
              />
            </div>
            <div className="border border-borderColor p-2">
              <label className="text-sm text-textMuted">No of Members</label>
              <input 
                type="text" 
                value={unit.membersCount} 
                readOnly 
                className="w-full border-none bg-transparent font-medium"
              />
            </div>
          </div>
        </div>
        <br />

        {/* Officials */}
        {official && (
          <div className="mb-6 break-inside-avoid">
            <h3 className="text-left text-lg font-bold text-textDark mb-4">UNIT OFFICIALS</h3>
            <table className="w-full border-collapse border border-borderColor">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-borderColor px-3 py-2 text-left">Designation</th>
                  <th className="border border-borderColor px-3 py-2 text-left">Name</th>
                  <th className="border border-borderColor px-3 py-2 text-left">Contact No.</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-borderColor px-3 py-2">President</td>
                  <td className="border border-borderColor px-3 py-2">
                    {official.presidentDesignation && `${official.presidentDesignation} `}
                    {official.presidentName}
                  </td>
                  <td className="border border-borderColor px-3 py-2">{official.presidentPhone}</td>
                </tr>
                <tr>
                  <td className="border border-borderColor px-3 py-2">Vice President</td>
                  <td className="border border-borderColor px-3 py-2">{official.vicePresidentName}</td>
                  <td className="border border-borderColor px-3 py-2">{official.vicePresidentPhone}</td>
                </tr>
                <tr>
                  <td className="border border-borderColor px-3 py-2">Secretary</td>
                  <td className="border border-borderColor px-3 py-2">{official.secretaryName}</td>
                  <td className="border border-borderColor px-3 py-2">{official.secretaryPhone}</td>
                </tr>
                <tr>
                  <td className="border border-borderColor px-3 py-2">Joint Secretary</td>
                  <td className="border border-borderColor px-3 py-2">{official.jointSecretaryName}</td>
                  <td className="border border-borderColor px-3 py-2">{official.jointSecretaryPhone}</td>
                </tr>
                <tr>
                  <td className="border border-borderColor px-3 py-2">Treasurer</td>
                  <td className="border border-borderColor px-3 py-2">{official.treasurerName}</td>
                  <td className="border border-borderColor px-3 py-2">{official.treasurerPhone}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        <br />
        <br />

        {/* Councilors */}
        <div className="mb-6 break-inside-avoid">
          <h3 className="text-left text-lg font-bold text-textDark mb-4">COUNCILORS</h3>
          <table className="w-full border-collapse border border-borderColor">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-borderColor px-3 py-2 text-left w-16">No.</th>
                <th className="border border-borderColor px-3 py-2 text-left">Name</th>
                <th className="border border-borderColor px-3 py-2 text-left">Contact No.</th>
              </tr>
            </thead>
            <tbody>
              {councilors.map((councilor, index) => (
                <tr key={councilor.id}>
                  <td className="border border-borderColor px-3 py-2">{index + 1}</td>
                  <td className="border border-borderColor px-3 py-2">{councilor.memberName}</td>
                  <td className="border border-borderColor px-3 py-2">+91 {councilor.memberPhone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <br />
        <br />

        {/* Unit Members */}
        <div className="mb-6">
          <h3 className="text-left text-lg font-bold text-textDark mb-4">UNIT MEMBERS</h3>
          <table className="w-full border-collapse border border-borderColor text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-borderColor px-2 py-2 text-left w-10">No.</th>
                <th className="border border-borderColor px-2 py-2 text-left">Name</th>
                <th className="border border-borderColor px-2 py-2 text-left w-16">Gender</th>
                <th className="border border-borderColor px-2 py-2 text-left w-28">DOB</th>
                <th className="border border-borderColor px-2 py-2 text-left w-16">Age</th>
                <th className="border border-borderColor px-2 py-2 text-left">Contact No.</th>
                <th className="border border-borderColor px-2 py-2 text-left">Qualification</th>
                <th className="border border-borderColor px-2 py-2 text-left w-20">Blood<br />Group</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member, index) => (
                <tr key={member.id}>
                  <td className="border border-borderColor px-2 py-2">{index + 1}</td>
                  <td className="border border-borderColor px-2 py-2">{member.name}</td>
                  <td className="border border-borderColor px-2 py-2">{member.gender}</td>
                  <td className="border border-borderColor px-2 py-2">
                    {new Date(member.dob).toLocaleDateString('en-GB').replace(/\//g, '-')}
                  </td>
                  <td className="border border-borderColor px-2 py-2">{member.age}</td>
                  <td className="border border-borderColor px-2 py-2">+91 {member.number}</td>
                  <td className="border border-borderColor px-2 py-2">{member.qualification || ''}</td>
                  <td className="border border-borderColor px-2 py-2 text-center">{member.bloodGroup || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <br />

        {/* Declaration */}
        <div className="mb-6 break-inside-avoid">
          <h3 className="text-left text-lg font-bold text-textDark mb-4">DECLARATION</h3>
          <p className="text-sm text-textDark text-justify leading-relaxed mb-6">
            I hereby declare that all the above-mentioned information provided by me is true and accurate to the best of my knowledge and belief. 
            Additionally, I am submitting a payment of Rs.{totalAmount}/- <i>(incl. unit reg. fee - Rs.100/- & Rs.10/- for {unit.membersCount} members)</i>. 
            Please register the above unit and its members for the year 2025-2026.
          </p>
          <div className="flex justify-between items-start mt-16">
            <div className="flex-1">
              <p className="mb-4">Date: </p>
              <div className="mt-12"></div>
              <p className="mb-4">Place: </p>
            </div>
            <div className="flex-1 text-center">
              <div className="mt-12"></div>
              <div className="mt-12"></div>
              <p><i>(seal)</i></p>
            </div>
            <div className="flex-1 text-center">
              <div className="mt-12"></div>
              <div className="mt-4"></div>
              <p className="font-medium">Signature of Unit President</p>
              <p className="text-sm mt-1"><i>(Vicar/Catechist/ Reader)</i></p>
            </div>
          </div>
        </div>
        <br />

        {/* Instructions */}
        <div className="mb-8 break-inside-avoid">
          <h3 className="text-left text-lg font-bold text-textDark mb-4">INSTRUCTIONS</h3>
          <div className="space-y-3 text-sm leading-relaxed">
            <p><strong>SUBMIT</strong> the hard copy of the generated form to the Youth Office before 30th of June 2025 by post or in person.</p>
            <p>Form should be duly signed by the Unit President (Vicar/Catechist/ Reader).</p>
            <p>If there is any Manipulation or Over writing in the submitted form, form and unit registration will be terminated.</p>
            <div className="mt-12 space-y-1">
              <p><strong>Postal Address:</strong></p>
              <p>THE GENERAL SECRETARY</p>
              <p>HEADQUARTERS CSI MKD YOUTH MOVEMENT</p>
              <p>CSI YOUTH CENTRE CHANGANASSERY</p>
              <p>KOTTAYAM KERALA - 686101</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            font-family: Arial, sans-serif;
          }
          
          .break-inside-avoid {
            page-break-inside: avoid;
          }
          
          table {
            page-break-inside: auto;
            margin-bottom: 20px;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-before: auto;
            page-break-after: auto;
          }
          
          thead {
            display: table-header-group;
          }
          
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
          }
          
          th {
            background-color: #f2f2f2;
          }
        }
        
        /* General styles */
        table {
          border-collapse: collapse;
        }
      `}</style>
    </div>
  );
};

