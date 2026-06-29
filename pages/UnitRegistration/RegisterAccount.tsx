import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Phone, MapPin, Building, AlertCircle, ArrowLeft, User, Copy, Check } from 'lucide-react';
import { Button } from '../../components/ui';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { setAuthTokens, setAuthUser, isAuthenticated, isUnitUser } from '../../services/auth';
import { resetRemovedMembersAlertDismiss } from '../../utils/removedMembersAlert';
import { resolvePostLoginPath } from '../../services/authRouting';
import { ClergyDistrict, UnitName } from '../../types';
import { useSiteSettings } from '../../hooks/queries';
import { PhoneField } from '../../components/PhoneField';
import { getPhoneValidationError, normalizePhone } from '../../utils/phoneNumber';

interface RegisterForm {
  phone_number: string;
  password: string;
  clergy_district_id: number | undefined;
  unit_name_id: number | undefined;
}

export const RegisterAccount: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<RegisterForm>({
    phone_number: '',
    password: '',
    clergy_district_id: undefined,
    unit_name_id: undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [districts, setDistricts] = useState<ClergyDistrict[]>([]);
  const [units, setUnits] = useState<UnitName[]>([]);
  const [usernamePreview, setUsernamePreview] = useState('');
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loadingUsername, setLoadingUsername] = useState(false);
  const [usernameCopied, setUsernameCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const navigate = useNavigate();
  const { data: siteSettings, isLoading: settingsLoading } = useSiteSettings();

  const registrationEnabled = siteSettings?.registration_enabled ?? false;
  const registrationClosedMessage = siteSettings?.registration_closed_message || 'Unit Registration (Closed)';

  useEffect(() => {
    if (isAuthenticated() && isUnitUser()) {
      resolvePostLoginPath('2').then((path) => navigate(path, { replace: true }));
    }
  }, [navigate]);

  useEffect(() => {
    if (!registrationEnabled) return;
    setLoadingDistricts(true);
    api.getDistricts()
      .then((data) => setDistricts(data || []))
      .catch(() => setFormError('Failed to load districts. Please refresh the page.'))
      .finally(() => setLoadingDistricts(false));
  }, [registrationEnabled]);

  useEffect(() => {
    if (!form.clergy_district_id) {
      setUnits([]);
      setUsernamePreview('');
      return;
    }
    setLoadingUnits(true);
    setForm((prev) => ({ ...prev, unit_name_id: undefined }));
    setUsernamePreview('');
    api.getUnitNames(form.clergy_district_id)
      .then((data) => setUnits(data || []))
      .catch(() => setFormError('Failed to load units. Please try again.'))
      .finally(() => setLoadingUnits(false));
  }, [form.clergy_district_id]);

  useEffect(() => {
    if (!form.clergy_district_id || !form.unit_name_id) {
      setUsernamePreview('');
      return;
    }
    setLoadingUsername(true);
    api.previewRegistrationUsername(form.clergy_district_id)
      .then((data) => setUsernamePreview(data.username_preview))
      .catch(() => setUsernamePreview(''))
      .finally(() => setLoadingUsername(false));
  }, [form.clergy_district_id, form.unit_name_id]);

  const copyUsername = async () => {
    if (!usernamePreview || loadingUsername) return;
    try {
      await navigator.clipboard.writeText(usernamePreview);
      setUsernameCopied(true);
      window.setTimeout(() => setUsernameCopied(false), 2000);
    } catch {
      setFormError('Unable to copy registration number. Please copy it manually.');
    }
  };

  const updateField = (field: keyof RegisterForm, value: string | number | undefined) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    setFormError('');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.phone_number.trim()) newErrors.phone_number = 'Phone number is required';
    else {
      const phoneError = getPhoneValidationError(form.phone_number);
      if (phoneError) newErrors.phone_number = phoneError;
    }
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!form.clergy_district_id) newErrors.clergy_district_id = 'District is required';
    if (!form.unit_name_id) newErrors.unit_name_id = 'Unit is required';
    if (!usernamePreview) newErrors.username = 'Select a unit to generate your registration number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setFormError('');

    try {
      const user = await api.registerUnit({
        phone_number: normalizePhone(form.phone_number.trim()) ?? form.phone_number.trim(),
        unit_name_id: form.unit_name_id!,
        clergy_district_id: form.clergy_district_id!,
        password: form.password,
      });

      const tokens = await api.login({ username: user.username, password: form.password });
      setAuthTokens(tokens.access_token, tokens.refresh_token || '');
      if (tokens.user_type) localStorage.setItem('user_type', tokens.user_type);

      const me = await api.me(tokens.access_token);
      setAuthUser(me);
      resetRemovedMembersAlertDismiss(me.id);
      if (me.user_type) localStorage.setItem('user_type', me.user_type);

      navigate('/register/wizard');
    } catch (err: any) {
      setFormError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-bgLight flex items-center justify-center">
        <p className="text-textMuted">Loading...</p>
      </div>
    );
  }

  if (!registrationEnabled) {
    return (
      <div className="min-h-screen bg-bgLight flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="h-16 w-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
            <Building size={32} className="text-textMuted" />
          </div>
          <h2 className="text-2xl font-bold text-textDark">{registrationClosedMessage}</h2>
          <p className="mt-2 text-sm text-textMuted">Unit registration is not currently open.</p>
          <Link to="/" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const inputWithIcon = (field: string) =>
    `block w-full pl-10 pr-3 py-2.5 bg-white border rounded-md shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm ${
      errors[field] ? 'border-danger' : 'border-borderColor'
    }`;

  const selectClass = (field: string) =>
    `block w-full pl-10 pr-3 py-2.5 bg-white border rounded-md shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm appearance-none ${
      errors[field] ? 'border-danger' : 'border-borderColor'
    }`;

  return (
    <div className="min-h-screen bg-bgLight flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center">
        <div className="h-12 w-12 bg-primary rounded-lg mx-auto flex items-center justify-center text-white mb-4">
          <Building size={28} />
        </div>
        <h2 className="text-3xl font-extrabold text-textDark tracking-tight">Unit Registration</h2>
        <p className="mt-2 text-sm text-textMuted">Step 1 of 6 — Create your unit account</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-lg sm:px-10 border border-borderColor">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <label htmlFor="district" className="block text-sm font-medium text-textDark">Clergy District <span className="text-danger">*</span></label>
                <div className="mt-1 relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select id="district" value={form.clergy_district_id ?? ''} onChange={(e) => updateField('clergy_district_id', e.target.value ? Number(e.target.value) : undefined)} className={selectClass('clergy_district_id')} disabled={loadingDistricts}>
                    <option value="">{loadingDistricts ? 'Loading...' : districts.length === 0 ? 'No districts available' : 'Select district'}</option>
                    {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                {errors.clergy_district_id && <p className="mt-1 text-sm text-danger">{errors.clergy_district_id}</p>}
              </div>
              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-textDark">Unit Name <span className="text-danger">*</span></label>
                <div className="mt-1 relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select id="unit" value={form.unit_name_id ?? ''} onChange={(e) => updateField('unit_name_id', e.target.value ? Number(e.target.value) : undefined)} className={selectClass('unit_name_id')} disabled={!form.clergy_district_id || loadingUnits}>
                    <option value="">{!form.clergy_district_id ? 'Select district first' : loadingUnits ? 'Loading...' : units.length === 0 ? 'No units available' : 'Select unit'}</option>
                    {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                {errors.unit_name_id && <p className="mt-1 text-sm text-danger">{errors.unit_name_id}</p>}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="username" className="block text-sm font-medium text-textDark">Registration Number (Username) <span className="text-danger">*</span></label>
                <div className="mt-1 relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="username"
                    type="text"
                    readOnly
                    value={loadingUsername ? 'Generating...' : usernamePreview}
                    className={`${inputWithIcon('username')} pr-10 bg-gray-50 text-textMuted cursor-not-allowed`}
                    placeholder="Select a unit to generate your registration number"
                  />
                  <button
                    type="button"
                    onClick={copyUsername}
                    disabled={!usernamePreview || loadingUsername}
                    title={usernameCopied ? 'Copied!' : 'Copy registration number'}
                    aria-label={usernameCopied ? 'Copied registration number' : 'Copy registration number'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {usernameCopied ? <Check className="h-5 w-5 text-success" /> : <Copy className="h-5 w-5" />}
                  </button>
                </div>
                {errors.username && <p className="mt-1 text-sm text-danger">{errors.username}</p>}
                {usernamePreview && !loadingUsername && (
                  <p className="mt-1 text-xs text-textMuted">Use this number to sign in after registration. Final number is assigned when your account is created.</p>
                )}
              </div>
              <PhoneField
                id="reg-phone"
                label={<>Phone <span className="text-danger">*</span></>}
                value={form.phone_number}
                onChange={(value) => updateField('phone_number', value)}
                error={errors.phone_number}
                showIcon
                required
              />
              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-textDark">Password <span className="text-danger">*</span></label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input id="reg-password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => updateField('password', e.target.value)} className={`${inputWithIcon('password')} pr-10`} placeholder="Minimum 8 characters" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-danger">{errors.password}</p>}
              </div>
            </div>
            <Button type="submit" className="w-full" isLoading={submitting}>
              {submitting ? 'Creating account...' : 'Create Account & Continue'}
            </Button>
            {formError && (
              <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-md p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-textMuted">
              Already registered? <Link to="/login" className="font-medium text-primary hover:text-primary-hover">Sign in with your registration number</Link>
            </p>
          </div>
        </div>
        <div className="mt-6 text-center">
          <Link to="/" className="text-sm font-medium text-primary inline-flex items-center gap-1">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};
