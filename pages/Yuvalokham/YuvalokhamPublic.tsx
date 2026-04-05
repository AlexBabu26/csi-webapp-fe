import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, LogIn, UserPlus, ArrowLeft, Newspaper, Shield } from 'lucide-react';
import { isYMAuthenticated, getYMUserRole } from '../../services/yuvalokham-auth';

export const YuvalokhamPublic: React.FC = () => {
  const navigate = useNavigate();
  const isLoggedIn = isYMAuthenticated();
  const role = getYMUserRole();

  const handleDashboard = () => {
    if (role === 'admin') navigate('/yuvalokham/admin/dashboard');
    else navigate('/yuvalokham/user/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col">
      <div className="flex-grow flex items-center justify-center p-4 md:p-8">
        <div className="max-w-lg w-full space-y-6">
          {/* Back button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-textMuted hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Home
          </button>

          {/* Branding */}
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-textDark">Yuvalokham</h1>
              <p className="text-textMuted mt-1">CSI MKD Youth Magazine Portal</p>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white/50 text-center">
              <Newspaper className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-textDark">Digital Magazine</p>
              <p className="text-xs text-textMuted mt-0.5">Read anytime, anywhere</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white/50 text-center">
              <Shield className="w-8 h-8 text-teal-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-textDark">Easy Subscription</p>
              <p className="text-xs text-textMuted mt-0.5">Simple & affordable plans</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/50 space-y-3">
            {isLoggedIn ? (
              <button
                onClick={handleDashboard}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                <BookOpen size={18} />
                Go to Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/yuvalokham/login')}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                >
                  <LogIn size={18} />
                  Login
                </button>
                <button
                  onClick={() => navigate('/yuvalokham/register')}
                  className="w-full py-3 px-4 bg-white text-emerald-700 font-semibold rounded-xl border-2 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus size={18} />
                  Create Account
                </button>
              </>
            )}
          </div>

          <p className="text-center text-xs text-textMuted">
            Subscribe to Yuvalokham and access all issues digitally
          </p>
        </div>
      </div>
    </div>
  );
};
