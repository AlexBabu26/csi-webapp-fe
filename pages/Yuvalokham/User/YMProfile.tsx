import React, { useState, useEffect } from 'react';
import { Save, User, Building } from 'lucide-react';
import { Card, Button, Input, Skeleton } from '../../../components/ui';
import { useToast } from '../../../components/Toast';
import { useYMProfile, useYMUpdateProfile } from '../../../hooks/queries';
import { YMProfileUpdateForm } from '../../../types';
import { ymAuth } from '../../../services/yuvalokham-api';

export const YMProfile: React.FC = () => {
  const { addToast } = useToast();
  const { data: profile, isLoading, isError } = useYMProfile();
  const updateProfile = useYMUpdateProfile();

  const [form, setForm] = useState<YMProfileUpdateForm>({
    name: '',
    phone: '',
    address: '',
    pincode: '',
    district_id: undefined,
    unit_id: undefined,
    parish_name: '',
    is_csi_member: false,
  });

  const [districts, setDistricts] = useState<Array<{ id: number; name: string }>>([]);
  const [units, setUnits] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        pincode: profile.pincode || '',
        district_id: profile.district_id ?? undefined,
        unit_id: profile.unit_id ?? undefined,
        parish_name: profile.parish_name || '',
        is_csi_member: profile.is_csi_member ?? false,
      });
    }
  }, [profile]);

  useEffect(() => {
    setLoadingDistricts(true);
    ymAuth.getDistricts()
      .then((data) => setDistricts(data || []))
      .catch(() => {})
      .finally(() => setLoadingDistricts(false));
  }, []);

  useEffect(() => {
    if (!form.district_id) {
      setUnits([]);
      return;
    }
    setLoadingUnits(true);
    ymAuth.getUnits(form.district_id)
      .then((data) => setUnits(data || []))
      .catch(() => {})
      .finally(() => setLoadingUnits(false));
  }, [form.district_id]);

  const handleChange = (field: keyof YMProfileUpdateForm, value: string | number | boolean | undefined) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDistrictChange = (districtId: number | undefined) => {
    setForm((prev) => ({ ...prev, district_id: districtId, unit_id: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      addToast('Name is required', 'error');
      return;
    }
    if (!form.phone?.trim()) {
      addToast('Phone number is required', 'error');
      return;
    }

    updateProfile.mutate(form, {
      onSuccess: () => addToast('Profile updated successfully'),
      onError: (err: any) => {
        const msg = err?.message || 'Failed to update profile';
        addToast(typeof msg === 'string' ? msg : 'Failed to update profile', 'error');
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Card>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-textDark font-medium">Failed to load profile</p>
          <p className="text-textMuted text-sm mt-1">Please try refreshing the page.</p>
        </div>
      </Card>
    );
  }

  const selectClass = 'block w-full px-3 py-2.5 bg-white border border-borderColor rounded-md shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all appearance-none';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-textDark">My Profile</h1>
        <p className="text-textMuted mt-1">Manage your personal information.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-1">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-borderColor">
            <div className="p-2.5 bg-primary/10 rounded-full">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-textDark">{profile?.name}</p>
              <p className="text-sm text-textMuted">{profile?.email}</p>
              {(profile?.district_name || profile?.unit_name) && (
                <p className="text-xs text-textMuted mt-0.5">
                  {[profile?.district_name, profile?.unit_name].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Input
              label="Full Name"
              required
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter your full name"
            />

            <Input
              label="Email"
              value={profile?.email || ''}
              readOnly
              disabled
              className="opacity-60"
            />

            <Input
              label="Phone"
              required
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="Enter phone number"
            />

            <Input
              label="Pincode"
              value={form.pincode}
              onChange={(e) => handleChange('pincode', e.target.value)}
              placeholder="Enter pincode"
              maxLength={10}
            />

            <div className="md:col-span-2">
              <Input
                label="Address"
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Enter your full address"
              />
            </div>

            {/* District dropdown */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-textDark mb-1.5">District</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  value={form.district_id ?? ''}
                  onChange={(e) => handleDistrictChange(e.target.value ? Number(e.target.value) : undefined)}
                  className={`${selectClass} pl-9`}
                  disabled={loadingDistricts}
                >
                  <option value="">{loadingDistricts ? 'Loading...' : 'Select district'}</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Unit dropdown */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-textDark mb-1.5">Unit</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  value={form.unit_id ?? ''}
                  onChange={(e) => handleChange('unit_id', e.target.value ? Number(e.target.value) : undefined)}
                  className={`${selectClass} pl-9`}
                  disabled={!form.district_id || loadingUnits}
                >
                  <option value="">
                    {loadingUnits ? 'Loading...' : !form.district_id ? 'Select district first' : 'Select unit'}
                  </option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              label="Parish Name"
              value={form.parish_name}
              onChange={(e) => handleChange('parish_name', e.target.value)}
              placeholder="Enter parish name"
            />

            <div className="mb-4">
              <label className="block text-sm font-medium text-textDark mb-1.5">CSI Member</label>
              <label className="relative inline-flex items-center cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={form.is_csi_member}
                  onChange={(e) => handleChange('is_csi_member', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                <span className="ms-2.5 text-sm text-textDark">
                  {form.is_csi_member ? 'Yes' : 'No'}
                </span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-borderColor flex justify-end">
            <Button type="submit" isLoading={updateProfile.isPending}>
              <Save className="w-4 h-4 mr-1.5" />
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
