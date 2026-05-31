import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Mail, Phone, User, MapPin, Building, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { setAuthTokens, setAuthUser, isAuthenticated, isUnitUser } from '../../services/auth';
import { resolvePostLoginPath } from '../../services/authRouting';
import { ClergyDistrict, UnitName } from '../../types';
import { useSiteSettings } from '../../hooks/queries';

interface RegisterForm {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  password: string;
  clergy_district_id: number | undefined;
  unit_name_id: number | undefined;
}

export const RegisterAccount: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<RegisterForm>({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    password: '',
    clergy_district_id: undefined,
    unit_name_id: undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [districts, setDistricts] = useState<ClergyDistrict[]>([]);
  const [units, setUnits] = useState<UnitName[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
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
      return;
    }
    setLoadingUnits(true);
    setForm((prev) => ({ ...prev, unit_name_id: undefined }));
    api.getUnitNames(form.clergy_district_id)
      .then((data) => setUnits(data || []))
      .catch(() => setFormError('Failed to load units. Please try again.'))
      .finally(() => setLoadingUnits(false));
  }, [form.clergy_district_id]);

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
    if (!form.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Please enter a valid email';
    if (!form.phone_number.trim()) newErrors.phone_number = 'Phone number is required';
    else if (!/^\d{10}$/.test(form.phone_number)) newErrors.phone_number = 'Phone must be 10 digits';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!form.clergy_district_id) newErrors.clergy_district_id = 'District is required';
    if (!form.unit_name_id) newErrors.unit_name_id = 'Unit is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setFormError('');

    try {
      await api.registerUnit({
        email: form.email.trim(),
        phone_number: form.phone_number.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim() || undefined,
        unit_name_id: form.unit_name_id!,
        clergy_district_id: form.clergy_district_id!,
        password: form.password,
      });

      const tokens = await api.login({ username: form.email.trim(), password: form.password });
      setAuthTokens(tokens.access_token, tokens.refresh_token || '');
      if (tokens.user_type) localStorage.setItem('user_type', tokens.user_type);

      const me = await api.me(tokens.access_token);
      setAuthUser(me);
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
                <label htmlFor="first-name" className="block text-sm font-medium text-textDark">First Name <span className="text-danger">*</span></label>
                <div className="mt-1 relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input id="first-name" type="text" value={form.first_name} onChange={(e) => updateField('first_name', e.target.value)} className={inputWithIcon('first_name')} placeholder="First name" />
                </div>
                {errors.first_name && <p className="mt-1 text-sm text-danger">{errors.first_name}</p>}
              </div>
              <div>
                <label htmlFor="last-name" className="block text-sm font-medium text-textDark">Last Name</label>
                <div className="mt-1 relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input id="last-name" type="text" value={form.last_name} onChange={(e) => updateField('last_name', e.target.value)} className={inputWithIcon('last_name')} placeholder="Last name (optional)" />
                </div>
              </div>
              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-textDark">Email <span className="text-danger">*</span></label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input id="reg-email" type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} className={inputWithIcon('email')} placeholder="you@example.com" />
                </div>
                {errors.email && <p className="mt-1 text-sm text-danger">{errors.email}</p>}
              </div>
              <div>
                <label htmlFor="reg-phone" className="block text-sm font-medium text-textDark">Phone <span className="text-danger">*</span></label>
                <div className="mt-1 relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input id="reg-phone" type="tel" value={form.phone_number} onChange={(e) => updateField('phone_number', e.target.value.replace(/\D/g, '').slice(0, 10))} className={inputWithIcon('phone_number')} placeholder="10-digit number" />
                </div>
                {errors.phone_number && <p className="mt-1 text-sm text-danger">{errors.phone_number}</p>}
              </div>
              <div>
                <label htmlFor="district" className="block text-sm font-medium text-textDark">Clergy District <span className="text-danger">*</span></label>
                <div className="mt-1 relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select id="district" value={form.clergy_district_id ?? ''} onChange={(e) => updateField('clergy_district_id', e.target.value ? Number(e.target.value) : undefined)} className={selectClass('clergy_district_id')} disabled={loadingDistricts}>
                    <option value="">{loadingDistricts ? 'Loading...' : 'Select district'}</option>
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
                    <option value="">{!form.clergy_district_id ? 'Select district first' : loadingUnits ? 'Loading...' : 'Select unit'}</option>
                    {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                {errors.unit_name_id && <p className="mt-1 text-sm text-danger">{errors.unit_name_id}</p>}
              </div>
              <div className="sm:col-span-2">
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
              Already registered? <Link to="/login" className="font-medium text-primary hover:text-primary-hover">Sign in</Link>
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
