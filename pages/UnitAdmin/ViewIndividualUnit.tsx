import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Badge, Button } from '../../components/ui';
import { ArrowLeft, Download, FileText, Archive } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { api } from '../../services/api';
import { Unit, UnitOfficial, UnitCouncilor, UnitMember } from '../../types';

export const ViewIndividualUnit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  const [unit, setUnit] = useState<Unit | null>(null);
  const [official, setOfficial] = useState<UnitOfficial | null>(null);
  const [councilors, setCouncilors] = useState<UnitCouncilor[]>([]);
  const [members, setMembers] = useState<UnitMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<UnitMember | null>(null);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  useEffect(() => {
    loadUnitDetails();
  }, [id]);

  const loadUnitDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const unitId = parseInt(id);
      
      const [unitRes, officialsRes, councilorsRes, membersRes] = await Promise.all([
        api.getUnitById(unitId),
        api.getUnitOfficials(unitId),
        api.getUnitCouncilors(unitId),
        api.getUnitMembers(unitId),
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

  const handlePrint = () => {
    navigate(`/admin/print-form/${id}`);
  };

  const handleArchive = (member: UnitMember) => {
    setSelectedMember(member);
    setShowArchiveDialog(true);
  };

  const handleConfirmArchive = async (reason?: string) => {
    if (!selectedMember) return;
    
    try {
      setIsArchiving(true);
      await api.archiveMember(selectedMember.id, reason);
      addToast(`${selectedMember.name} archived successfully`, "success");
      setShowArchiveDialog(false);
      setSelectedMember(null);
      // Reload the unit details
      loadUnitDetails();
    } catch (err) {
      addToast("Failed to archive member", "error");
    } finally {
      setIsArchiving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-in">
        <Card className="h-48">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="space-y-6 animate-slide-in">
        <Card>
          <p className="text-center text-textMuted">Unit not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/admin/units')}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Units
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">
            Unit Details: {unit.unitNumber}
          </h1>
          <p className="mt-1 text-sm text-textMuted">{unit.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={handlePrint}>
            <FileText className="w-4 h-4 mr-2" />
            Print Form
          </Button>
          <Button variant="outline" size="sm" onClick={() => api.exportData('unit', unit.id)}>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Unit Details */}
      <Card>
        <h3 className="text-lg font-bold text-textDark mb-4">Unit Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-textMuted">Clergy District</span>
            <p className="text-textDark font-medium">{unit.clergyDistrict}</p>
          </div>
          <div>
            <span className="text-sm text-textMuted">Unit Name</span>
            <p className="text-textDark font-medium">{unit.name}</p>
          </div>
          <div>
            <span className="text-sm text-textMuted">Registration Year</span>
            <p className="text-textDark font-medium">{unit.registrationYear}</p>
          </div>
          <div>
            <span className="text-sm text-textMuted">No of Members</span>
            <p className="text-textDark font-medium">{unit.membersCount}</p>
          </div>
          <div>
            <span className="text-sm text-textMuted">Status</span>
            <div className="mt-1">
              <Badge variant={unit.status === 'Completed' ? 'success' : unit.status === 'Pending' ? 'warning' : 'light'}>
                {unit.status}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Officials */}
      {official && (
        <Card>
          <h3 className="text-lg font-bold text-textDark mb-4">Unit Officials</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-borderColor">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase">Designation</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase">Contact No.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderColor">
                <tr>
                  <td className="px-4 py-3 text-sm text-textMuted">President</td>
                  <td className="px-4 py-3 text-sm font-medium text-textDark">
                    {official.presidentDesignation && `${official.presidentDesignation} `}
                    {official.presidentName}
                  </td>
                  <td className="px-4 py-3 text-sm text-textMuted font-mono">+91 {official.presidentPhone}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-textMuted">Vice President</td>
                  <td className="px-4 py-3 text-sm font-medium text-textDark">{official.vicePresidentName}</td>
                  <td className="px-4 py-3 text-sm text-textMuted font-mono">+91 {official.vicePresidentPhone}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-textMuted">Secretary</td>
                  <td className="px-4 py-3 text-sm font-medium text-textDark">{official.secretaryName}</td>
                  <td className="px-4 py-3 text-sm text-textMuted font-mono">+91 {official.secretaryPhone}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-textMuted">Joint Secretary</td>
                  <td className="px-4 py-3 text-sm font-medium text-textDark">{official.jointSecretaryName}</td>
                  <td className="px-4 py-3 text-sm text-textMuted font-mono">+91 {official.jointSecretaryPhone}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-textMuted">Treasurer</td>
                  <td className="px-4 py-3 text-sm font-medium text-textDark">{official.treasurerName}</td>
                  <td className="px-4 py-3 text-sm text-textMuted font-mono">+91 {official.treasurerPhone}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Councilors */}
      <Card>
        <h3 className="text-lg font-bold text-textDark mb-4">Councilors</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-borderColor">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase">No.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase">Contact No.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderColor">
              {councilors.map((councilor, index) => (
                <tr key={councilor.id}>
                  <td className="px-4 py-3 text-sm text-textMuted">{index + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-textDark">{councilor.memberName}</td>
                  <td className="px-4 py-3 text-sm text-textMuted font-mono">+91 {councilor.memberPhone}</td>
                </tr>
              ))}
              {councilors.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-textMuted">
                    No councilors found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Members */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-textDark">Unit Members</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/archived-members')}
          >
            <Archive className="w-4 h-4 mr-2" />
            View Archived
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-borderColor">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase">No.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase">Gender</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase">Age / DOB</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase">Contact No.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase">Qualification</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase">Blood Group</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderColor">
              {members.map((member, index) => (
                <tr key={member.id}>
                  <td className="px-4 py-3 text-sm text-textMuted">{index + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-textDark">{member.name}</td>
                  <td className="px-4 py-3 text-sm text-textMuted">{member.gender === 'M' ? 'Male' : 'Female'}</td>
                  <td className="px-4 py-3 text-sm text-textMuted">
                    <div>
                      <span className="font-medium">{member.age} years</span>
                      <br />
                      <span className="text-xs">{new Date(member.dob).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-textMuted font-mono">+91 {member.number}</td>
                  <td className="px-4 py-3 text-sm text-textMuted">{member.qualification || '-'}</td>
                  <td className="px-4 py-3 text-sm text-textMuted">{member.bloodGroup || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleArchive(member)}
                    >
                      <Archive className="w-3 h-3 mr-1" />
                      Archive
                    </Button>
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-textMuted">
                    No members found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showArchiveDialog}
        onClose={() => {
          setShowArchiveDialog(false);
          setSelectedMember(null);
        }}
        onConfirm={handleConfirmArchive}
        title="Archive Member"
        message={`Are you sure you want to archive ${selectedMember?.name}? They will be moved to archived members list and can be restored later.`}
        confirmText="Archive"
        cancelText="Cancel"
        variant="warning"
        showRemarksField={true}
        remarksLabel="Archive Reason (Optional)"
        remarksPlaceholder="e.g., Age limit exceeded, Transferred to another diocese..."
        isLoading={isArchiving}
      />
    </div>
  );
};

