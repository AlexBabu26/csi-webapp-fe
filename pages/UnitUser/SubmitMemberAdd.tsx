import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../../components/ui';
import { FileUpload } from '../../components/FileUpload';
import { ArrowLeft, Send, UserPlus } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';

export const SubmitMemberAdd: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    gender: 'M' as 'M' | 'F',
    number: '',
    dob: '',
    qualification: '',
    bloodGroup: '',
  });
  const [reason, setReason] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);

  // Mock current unit ID
  const currentUnitId = 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      addToast("Please enter member name", "warning");
      return;
    }
    
    if (!formData.number.match(/^[6-9]\d{9}$/)) {
      addToast("Please enter a valid 10-digit phone number", "warning");
      return;
    }
    
    if (!reason.trim()) {
      addToast("Please provide a reason", "warning");
      return;
    }

    try {
      setLoading(true);
      await api.submitMemberAdd({
        unitId: currentUnitId,
        ...formData,
        reason,
        proof: proofFile || undefined,
      });
      addToast("Member add request submitted successfully", "success");
      navigate('/unit/my-requests');
    } catch (err) {
      addToast("Failed to submit request", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/unit/my-requests')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-textDark">Submit Member Add Request</h1>
          <p className="mt-1 text-sm text-textMuted">Request to add a new member to your unit</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-textDark">New Member Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                Full Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                pattern="[a-zA-Z\s.]+"
                className="w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                Gender <span className="text-danger">*</span>
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'M' | 'F' })}
                className="w-full px-3 py-2 border border-borderColor rounded-md bg-white text-textDark focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                Phone Number <span className="text-danger">*</span>
              </label>
              <input
                type="tel"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                pattern="[6-9]\d{9}"
                placeholder="10-digit mobile number"
                className="w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>

            {/* DOB */}
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                Date of Birth <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                min="1990-01-01"
                max="2011-12-31"
                className="w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>

            {/* Qualification */}
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                Education Qualification / Job
              </label>
              <input
                type="text"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                className="w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                Blood Group
              </label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="w-full px-3 py-2 border border-borderColor rounded-md bg-white text-textDark focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">-- Select Blood Group --</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Reason & Proof */}
        <Card>
          <h3 className="text-lg font-bold text-textDark mb-4">Additional Information</h3>
          
          <div className="space-y-4">
            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                Reason for Adding Member <span className="text-danger">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for adding this member..."
                className="w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                rows={3}
                required
              />
            </div>

            {/* Proof */}
            <FileUpload
              label="Upload Proof"
              helperText="Upload supporting document (PDF, PNG, JPG - max 5MB)"
              onFileSelect={setProofFile}
              accept=".pdf,.png,.jpg,.jpeg"
              maxSize={5}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-borderColor">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/unit/my-requests')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              <Send className="w-4 h-4 mr-2" />
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};


