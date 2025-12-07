import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_NAME, APP_SUBTITLE, MOCK_NOTICES } from '../constants';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { User, Lock, Eye, EyeOff, Award, Users } from 'lucide-react';
import { UserRole } from '../types';
import { Footer } from '../components/Footer';

interface PublicHomeProps {
  onLogin: (role: UserRole) => void;
}

// SVG Logo Components
const ChurchLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="30" fill="#007faf" fillOpacity="0.1"/>
    <path d="M32 8v12M26 14h12" stroke="#007faf" strokeWidth="3" strokeLinecap="round"/>
    <path d="M20 56V32l12-8 12 8v24" stroke="#007faf" strokeWidth="2.5" fill="none"/>
    <path d="M28 56V44h8v12" stroke="#007faf" strokeWidth="2" fill="#007faf" fillOpacity="0.2"/>
    <path d="M24 38h4v4h-4zM36 38h4v4h-4z" fill="#007faf" fillOpacity="0.4"/>
  </svg>
);

const YouthLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="30" fill="#007faf"/>
    <circle cx="32" cy="20" r="8" fill="white"/>
    <path d="M20 52c0-8 5.4-14 12-14s12 6 12 14" stroke="white" strokeWidth="3" fill="none"/>
    <circle cx="18" cy="26" r="5" fill="white" fillOpacity="0.7"/>
    <path d="M10 46c0-5 3.2-9 8-9" stroke="white" strokeWidth="2" strokeOpacity="0.7" fill="none"/>
    <circle cx="46" cy="26" r="5" fill="white" fillOpacity="0.7"/>
    <path d="M54 46c0-5-3.2-9-8-9" stroke="white" strokeWidth="2" strokeOpacity="0.7" fill="none"/>
  </svg>
);

const CSLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="30" fill="#18aefa" fillOpacity="0.15"/>
    <text x="32" y="28" textAnchor="middle" fill="#007faf" fontSize="14" fontWeight="bold" fontFamily="Poppins, sans-serif">CS</text>
    <text x="32" y="44" textAnchor="middle" fill="#007faf" fontSize="10" fontWeight="500" fontFamily="Poppins, sans-serif">MKD</text>
    <circle cx="32" cy="32" r="26" stroke="#007faf" strokeWidth="2" fill="none" strokeDasharray="4 2"/>
  </svg>
);

export const PublicHome: React.FC<PublicHomeProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      // Mock login logic
      if (username === 'admin') {
        onLogin(UserRole.ADMIN);
        navigate('/admin/dashboard');
      } else {
        alert('Invalid credentials. Try "admin" / "password"');
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-bgLight flex flex-col">
      {/* Marquee Notice Bar */}
      <div className="bg-primary text-white py-2 overflow-hidden shadow-md relative z-10">
        <div className="animate-marquee whitespace-nowrap inline-block">
          {MOCK_NOTICES.map((notice, idx) => (
            <span key={notice.id} className="mx-8 font-medium">
              {notice.priority === 'high' && <span className="bg-warning text-black text-xs px-2 py-0.5 rounded mr-2 font-bold">URGENT</span>}
              {notice.text} {idx < MOCK_NOTICES.length - 1 && " • "}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-grow flex items-center justify-center p-4">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          
          {/* Left Side: Branding & About */}
          <div className="flex flex-col justify-center space-y-6 text-center md:text-left">
             <div className="flex justify-center md:justify-start items-end space-x-2 mb-4">
                {/* SVG Logo Icons */}
                <div className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center p-1">
                    <ChurchLogo className="w-full h-full" />
                </div>
                <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center p-1 z-10 -mb-1">
                     <YouthLogo className="w-full h-full" />
                </div>
                <div className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center p-1">
                     <CSLogo className="w-full h-full" />
                </div>
             </div>
             
             <div>
                <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight">{APP_NAME}</h1>
                <h2 className="text-lg md:text-xl text-textMuted font-medium mt-1">{APP_SUBTITLE}</h2>
             </div>
             
             <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-primary text-sm text-textDark leading-relaxed">
               <h3 className="font-bold text-base mb-2">About Us</h3>
               <p>
                 Founded in 1916, the CSI Madhya Kerala Diocese Youth Movement has been a beacon of faith and fellowship for over a century. 
                 We aim to empower youth through spiritual growth, social service, and cultural engagement.
               </p>
             </div>
          </div>

          {/* Right Side: Action Cards */}
          <div className="flex flex-col justify-center space-y-4">
             {/* Main Login Card */}
             <Card className="transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
               <div className="text-center mb-6">
                 <h3 className="text-2xl font-bold text-textDark">Unit Portal</h3>
                 <p className="text-textMuted text-sm">Access your unit dashboard</p>
               </div>
               
               <div className="space-y-4">
                 <Button 
                   variant="outline" 
                   size="block" 
                   disabled
                   className="opacity-50 cursor-not-allowed"
                 >
                   Unit Registration (Closed)
                 </Button>
                 
                 <Button 
                   variant="primary" 
                   size="block"
                   onClick={() => setShowLoginModal(true)}
                 >
                   Unit Login
                 </Button>
               </div>
             </Card>

             {/* Quick Links */}
             <div className="grid grid-cols-2 gap-4">
               <button 
                 onClick={() => navigate('/kalamela')}
                 className="bg-white p-4 rounded-lg shadow-sm border border-borderColor hover:border-primary hover:shadow-md cursor-pointer transition-all duration-300 text-center group hover:scale-105"
                 aria-label="Go to Kalamela"
               >
                 <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                   <Award size={20} />
                 </div>
                 <span className="font-semibold text-sm">Kalamela</span>
               </button>
               <button 
                 onClick={() => navigate('/conference')}
                 className="bg-white p-4 rounded-lg shadow-sm border border-borderColor hover:border-primary hover:shadow-md cursor-pointer transition-all duration-300 text-center group hover:scale-105"
                 aria-label="Go to Conference"
               >
                 <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                   <Users size={20} />
                 </div>
                 <span className="font-semibold text-sm">Conference</span>
               </button>
             </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="bg-primary px-6 py-4 flex justify-between items-center">
              <h3 className="text-white font-semibold text-lg">Unit Login</h3>
              <button 
                onClick={() => setShowLoginModal(false)} 
                className="text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary rounded"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-textDark mb-1">Username / Unit ID</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      required
                      className="block w-full pl-10 pr-3 py-2.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-shadow"
                      placeholder="Enter Unit ID"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-textDark mb-1">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      className="block w-full pl-10 pr-10 py-2.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-shadow"
                      placeholder="Enter Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <div 
                      className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                   <a href="#" className="text-primary hover:text-primary-hover font-medium">Forgot Password?</a>
                </div>
                <Button type="submit" variant="primary" size="block" isLoading={loading}>
                  Login to Dashboard
                </Button>
                <div className="text-center text-xs text-textMuted mt-4 bg-yellow-50 p-3 rounded-md border border-yellow-200">
                  <span className="font-bold">Demo:</span> Use <strong>admin</strong> / <strong>password</strong>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
