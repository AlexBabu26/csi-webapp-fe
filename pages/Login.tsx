import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{email?: string; password?: string}>({});
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    const newErrors: {email?: string; password?: string} = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email) && email !== 'admin') {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    // Simulate login delay
    setTimeout(() => {
      setLoading(false);
      if (email === 'admin' || email === 'admin@csimkd.org') {
        navigate('/admin/dashboard');
      } else {
        setErrors({ email: 'Invalid credentials. Try admin / password' });
      }
    }, 1000);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-textDark">
          Email address
        </label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="email"
            name="email"
            type="text"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
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
        <label htmlFor="password" className="block text-sm font-medium text-textDark">
          Password
        </label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
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
              className="text-gray-400 hover:text-textMuted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
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

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 text-primary focus:ring-primary border-borderColor rounded"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-textDark">
            Remember me
          </label>
        </div>

        <div className="text-sm">
          <a href="#" className="font-medium text-primary hover:text-primary-hover transition-colors">
            Forgot password?
          </a>
        </div>
      </div>

      <div>
        <Button type="submit" className="w-full" disabled={loading} isLoading={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </div>

      {/* Demo Credentials Hint */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-center">
        <p className="text-xs text-yellow-800">
          <span className="font-bold">Demo Credentials:</span> Use <strong>admin</strong> / <strong>password</strong>
        </p>
      </div>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-borderColor" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-textMuted">Or access</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/kalamela')}>
                Public Results Portal
            </Button>
        </div>
      </div>
    </form>
  );
};
