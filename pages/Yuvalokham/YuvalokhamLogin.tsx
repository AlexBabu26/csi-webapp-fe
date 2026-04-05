import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, AlertCircle, BookOpen, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui';
import { useNavigate, Link } from 'react-router-dom';
import { useYMLogin } from '../../hooks/queries';

export const YuvalokhamLogin: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();
  const loginMutation = useYMLogin();

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Please enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 4) newErrors.password = 'Password must be at least 4 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    loginMutation.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          if (data.role === 'admin') {
            navigate('/yuvalokham/admin/dashboard');
          } else {
            navigate('/yuvalokham/user/dashboard');
          }
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-bgLight flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="h-12 w-12 bg-primary rounded-lg mx-auto flex items-center justify-center text-white mb-4">
          <BookOpen size={28} />
        </div>
        <h2 className="text-3xl font-extrabold text-textDark tracking-tight">Yuvalokham</h2>
        <p className="mt-2 text-sm text-textMuted">Sign in to your Yuvalokham account</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-lg sm:px-10 border border-borderColor">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="ym-email" className="block text-sm font-medium text-textDark">
                Email
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="ym-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className={`block w-full pl-10 pr-3 py-2.5 bg-white border rounded-md shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all ${
                    errors.email ? 'border-danger' : 'border-borderColor'
                  }`}
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

            <div>
              <label htmlFor="ym-password" className="block text-sm font-medium text-textDark">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="ym-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  className={`block w-full pl-10 pr-10 py-2.5 bg-white border rounded-md shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all ${
                    errors.password ? 'border-danger' : 'border-borderColor'
                  }`}
                  placeholder="Enter your password"
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
            </div>

            <Button type="submit" className="w-full" isLoading={loginMutation.isPending}>
              {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
            </Button>

            {loginMutation.isError && (
              <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-md p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{(loginMutation.error as Error)?.message || 'Login failed. Please try again.'}</span>
              </div>
            )}
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-borderColor" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-textMuted">New to Yuvalokham?</span>
              </div>
            </div>
            <div className="mt-6">
              <Link to="/yuvalokham/register">
                <Button type="button" variant="outline" className="w-full">
                  Create an account
                </Button>
              </Link>
            </div>
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
