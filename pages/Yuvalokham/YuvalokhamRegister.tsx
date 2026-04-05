import React, { useState, useEffect } from 'react';
import {
  Eye, EyeOff, Lock, Mail, Phone, User, MapPin, Building,
  AlertCircle, BookOpen, ArrowLeft, CheckCircle,
} from 'lucide-react';
import { Button } from '../../components/ui';
import { useNavigate, Link } from 'react-router-dom';
import { useYMRegister } from '../../hooks/queries';
import { ymAuth } from '../../services/yuvalokham-api';
import { YMRegisterForm } from '../../types';

export const YuvalokhamRegister: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<YMRegisterForm>({
    name: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    pincode: '',
    district_id: undefined,
    unit_id: undefined,
    parish_name: '',
    is_csi_member: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [districts, setDistricts] = useState<Array<{ id: number; name: string }>>([]);
  const [units, setUnits] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const registerMutation = useYMRegister();

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
    setForm((prev) => ({ ...prev, unit_id: undefined }));
    ymAuth.getUnits(form.district_id)
      .then((data) => setUnits(data || []))
      .catch(() => {})
      .finally(() => setLoadingUnits(false));
  }, [form.district_id]);

  const updateField = (field: keyof YMRegisterForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Please enter a valid email';
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(form.phone)) newErrors.phone = 'Phone must be 10 digits';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload: YMRegisterForm = { ...form };
    if (!payload.address) delete payload.address;
    if (!payload.pincode) delete payload.pincode;
    if (!payload.district_id) delete payload.district_id;
    if (!payload.unit_id) delete payload.unit_id;
    if (!payload.parish_name) delete payload.parish_name;

    registerMutation.mutate(payload, {
      onSuccess: () => {
        setSuccessMessage('Registration successful! Redirecting to login...');
        setTimeout(() => navigate('/yuvalokham/login'), 2000);
      },
    });
  };

  if (successMessage) {
    return (
      <div className="min-h-screen bg-bgLight flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="h-16 w-16 bg-success/10 rounded-full mx-auto flex items-center justify-center mb-4">
            <CheckCircle size={32} className="text-success" />
          </div>
          <h2 className="text-2xl font-bold text-textDark">{successMessage}</h2>
          <p className="mt-2 text-sm text-textMuted">You can now sign in with your credentials.</p>
        </div>
      </div>
    );
  }

  const inputBase = (field: string) =>
    `block w-full px-3 py-2.5 bg-white border rounded-md shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all ${
      errors[field] ? 'border-danger' : 'border-borderColor'
    }`;

  const inputWithIcon = (field: string) =>
    `block w-full pl-10 pr-3 py-2.5 bg-white border rounded-md shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all ${
      errors[field] ? 'border-danger' : 'border-borderColor'
    }`;

  return (
    <div className="min-h-screen bg-bgLight flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center">
        <div className="h-12 w-12 bg-primary rounded-lg mx-auto flex items-center justify-center text-white mb-4">
          <BookOpen size={28} />
        </div>
        <h2 className="text-3xl font-extrabold text-textDark tracking-tight">Create Account</h2>
        <p className="mt-2 text-sm text-textMuted">Register for a Yuvalokham subscription</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-lg sm:px-10 border border-borderColor">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              {/* Name */}
              <div className="sm:col-span-2">
                <label htmlFor="ym-name" className="block text-sm font-medium text-textDark">
                  Full Name <span className="text-danger">*</span>
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="ym-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className={inputWithIcon('name')}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1.5 text-sm text-danger flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="ym-reg-email" className="block text-sm font-medium text-textDark">
                  Email <span className="text-danger">*</span>
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="ym-reg-email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className={inputWithIcon('email')}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-sm text-danger flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="ym-phone" className="block text-sm font-medium text-textDark">
                  Phone <span className="text-danger">*</span>
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="ym-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className={inputWithIcon('phone')}
                    placeholder="10-digit number"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1.5 text-sm text-danger flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="sm:col-span-2">
                <label htmlFor="ym-reg-password" className="block text-sm font-medium text-textDark">
                  Password <span className="text-danger">*</span>
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="ym-reg-password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    className={`block w-full pl-10 pr-10 py-2.5 bg-white border rounded-md shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all ${
                      errors.password ? 'border-danger' : 'border-borderColor'
                    }`}
                    placeholder="Min 8 characters"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-textMuted focus:outline-none rounded"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-sm text-danger flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.password}
                  </p>
                )}
                {form.password && form.password.length > 0 && form.password.length < 8 && !errors.password && (
                  <p className="mt-1.5 text-xs text-textMuted">
                    {8 - form.password.length} more character{8 - form.password.length !== 1 ? 's' : ''} needed
                  </p>
                )}
              </div>

              {/* Section divider */}
              <div className="sm:col-span-2 border-t border-borderColor pt-2">
                <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">
                  Additional Details
                </p>
              </div>

              {/* Address */}
              <div className="sm:col-span-2">
                <label htmlFor="ym-address" className="block text-sm font-medium text-textDark">
                  Address
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="ym-address"
                    type="text"
                    value={form.address || ''}
                    onChange={(e) => updateField('address', e.target.value)}
                    className={inputWithIcon('address')}
                    placeholder="Your address"
                  />
                </div>
              </div>

              {/* Pincode */}
              <div>
                <label htmlFor="ym-pincode" className="block text-sm font-medium text-textDark">
                  Pincode
                </label>
                <div className="mt-1">
                  <input
                    id="ym-pincode"
                    type="text"
                    value={form.pincode || ''}
                    onChange={(e) => updateField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className={inputBase('pincode')}
                    placeholder="6-digit pincode"
                  />
                </div>
              </div>

              {/* Parish */}
              <div>
                <label htmlFor="ym-parish" className="block text-sm font-medium text-textDark">
                  Parish Name
                </label>
                <div className="mt-1">
                  <input
                    id="ym-parish"
                    type="text"
                    value={form.parish_name || ''}
                    onChange={(e) => updateField('parish_name', e.target.value)}
                    className={inputBase('parish_name')}
                    placeholder="Your parish name"
                  />
                </div>
              </div>

              {/* District */}
              <div>
                <label htmlFor="ym-district" className="block text-sm font-medium text-textDark">
                  District
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="ym-district"
                    value={form.district_id || ''}
                    onChange={(e) => updateField('district_id', e.target.value ? Number(e.target.value) : undefined)}
                    className={`${inputWithIcon('district_id')} appearance-none`}
                    disabled={loadingDistricts}
                  >
                    <option value="">{loadingDistricts ? 'Loading...' : 'Select district'}</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Unit */}
              <div>
                <label htmlFor="ym-unit" className="block text-sm font-medium text-textDark">
                  Unit
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="ym-unit"
                    value={form.unit_id || ''}
                    onChange={(e) => updateField('unit_id', e.target.value ? Number(e.target.value) : undefined)}
                    className={`${inputWithIcon('unit_id')} appearance-none`}
                    disabled={!form.district_id || loadingUnits}
                  >
                    <option value="">
                      {loadingUnits ? 'Loading...' : !form.district_id ? 'Select district first' : 'Select unit'}
                    </option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CSI Member */}
              <div className="sm:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_csi_member || false}
                    onChange={(e) => updateField('is_csi_member', e.target.checked)}
                    className="h-4 w-4 text-primary focus:ring-primary border-borderColor rounded"
                  />
                  <span className="text-sm text-textDark">I am a CSI member</span>
                </label>
              </div>
            </div>

            <Button type="submit" className="w-full" isLoading={registerMutation.isPending}>
              {registerMutation.isPending ? 'Creating account...' : 'Create Account'}
            </Button>

            {registerMutation.isError && (
              <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-md p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  {(registerMutation.error as Error)?.message || 'Registration failed. Please try again.'}
                </span>
              </div>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-textMuted">
              Already have an account?{' '}
              <Link to="/yuvalokham/login" className="font-medium text-primary hover:text-primary-hover transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm font-medium text-primary hover:text-primary-hover transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};
