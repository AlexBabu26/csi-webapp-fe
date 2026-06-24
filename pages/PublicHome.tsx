import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_NAME, APP_SUBTITLE } from '../constants';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { User, Lock, Eye, EyeOff, Award, Users, BookOpen, Droplets, AlertCircle } from 'lucide-react';
import { UserRole, SiteSettings, Notice } from '../types';
import { Footer } from '../components/Footer';
import { api } from '../services/api';
import { setAuthUser, setAuthTokens, getAuthToken, isTokenExpired, isUnitUser, isAuthenticated } from '../services/auth';
import { resetRemovedMembersAlertDismiss } from '../utils/removedMembersAlert';
import { resolvePostLoginPath } from '../services/authRouting';
import { useSiteSettings, useNotices } from '../hooks/queries';
import { ChurchLogo, CSLogo, LogoImage, YouthLogo } from '../components/SiteLogos';

interface PublicHomeProps {
  onLogin: (role: UserRole) => void;
}

export const PublicHome: React.FC<PublicHomeProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [redirectAfterLogin, setRedirectAfterLogin] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [showFullAbout, setShowFullAbout] = useState(false);

  // Helper: open login modal with an optional post-login redirect
  const openLoginModal = (redirectTo?: string) => {
    setRedirectAfterLogin(redirectTo ?? null);
    setUsername('');
    setPassword('');
    setFormError('');
    setShowLoginModal(true);
  };

  // Helper: navigate to a protected page (open login modal if not authenticated)
  const navigateProtected = (path: string) => {
    const token = getAuthToken();
    if (token && !isTokenExpired(token)) {
      navigate(path);
    } else {
      openLoginModal(path);
    }
  };
  
  // Use TanStack Query for site settings
  const { data: siteSettings, isLoading: settingsLoading } = useSiteSettings();
  const { data: noticesData } = useNotices();
  const notices = noticesData ?? [];

  // Use API data or fallback to constants
  const appName = siteSettings?.app_name || APP_NAME;
  const appSubtitle = siteSettings?.app_subtitle || APP_SUBTITLE;
  const aboutText = siteSettings?.about_text || 'Founded in 1916, the CSI Madhya Kerala Diocese Youth Movement has been a beacon of faith and fellowship for over a century. We aim to empower youth through spiritual growth, social service, and cultural engagement.';
  const registrationEnabled = siteSettings?.registration_enabled ?? false;
  const registrationClosedMessage = siteSettings?.registration_closed_message || 'Unit Registration (Closed)';

  const handleRegistrationClick = async () => {
    const token = getAuthToken();
    if (token && !isTokenExpired(token) && isUnitUser()) {
      const path = await resolvePostLoginPath('2');
      navigate(path);
      return;
    }
    navigate('/register');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError('');

    try {
      console.log('[PublicHome] Attempting login for user:', username);
      
      // Real API call to backend
      const tokens = await api.login({ username, password });
      console.log('[PublicHome] Login successful, storing tokens');
      
      // Store both access and refresh tokens
      setAuthTokens(tokens.access_token, tokens.refresh_token || '');
      
      // Fetch user profile to determine role
      const me = await api.me(tokens.access_token);
      console.log('[PublicHome] User profile fetched, user_type:', me.user_type);
      
      // Store user profile for use throughout the app
      setAuthUser(me);
      resetRemovedMembersAlertDismiss(me.id);
      
      // Store user_type for role-based navigation
      localStorage.setItem('user_type', me.user_type);
      
      // Determine role based on user_type
      const role = me.user_type === '1' ? UserRole.ADMIN : 
                   me.user_type === '4' ? UserRole.OFFICIAL :
                   me.user_type === '2' || me.user_type === '3' ? UserRole.OFFICIAL : 
                   UserRole.PUBLIC;
      
      onLogin(role);

      // Close the modal first
      setShowLoginModal(false);

      // If there's a pending redirect (e.g. from Blood Donor Search link), go there
      if (redirectAfterLogin) {
        console.log('[PublicHome] Redirecting to:', redirectAfterLogin);
        navigate(redirectAfterLogin);
        setRedirectAfterLogin(null);
        return;
      }

      // Default role-based navigation
      const path = await resolvePostLoginPath(me.user_type);
      navigate(path);
    } catch (error: any) {
      console.error('[PublicHome] Login failed:', error);
      setFormError(error?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-bgLight flex flex-col">
      {/* Marquee Notice Bar */}
      {notices.length > 0 && (
        <div className="bg-primary text-white py-2 overflow-hidden shadow-md relative z-10">
          <div className="animate-marquee whitespace-nowrap inline-block">
            {notices.map((notice, idx) => (
              <span key={notice.id} className="mx-8 font-medium">
                {notice.priority === 'high' && <span className="bg-warning text-black text-xs px-2 py-0.5 rounded mr-2 font-bold">URGENT</span>}
                {notice.text} {idx < notices.length - 1 && " • "}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex-grow flex items-center justify-center p-4 md:p-8 bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          
          {/* Left Side: Branding & About */}
          {settingsLoading ? (
            // Loading Skeleton
            <div className="flex flex-col justify-center space-y-6 text-center md:text-left animate-pulse">
              <div className="flex justify-center md:justify-start items-end space-x-3 mb-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
                <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
              </div>
              <div className="space-y-3">
                <div className="h-10 bg-gray-200 rounded w-3/4 mx-auto md:mx-0"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto md:mx-0"></div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-center space-y-6">
              {/* Logo Section with Enhanced Styling - Fully Centered */}
              <div className="flex flex-col items-center space-y-4">
                {/* Logos - Centered and Bigger */}
                <div className="flex justify-center items-end space-x-4">
                  {/* Primary Logo */}
                  <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center p-2 overflow-hidden ring-2 ring-white hover:ring-primary/30 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                    <LogoImage 
                      src={siteSettings?.logo_primary_url} 
                      fallback={<ChurchLogo className="w-full h-full" />}
                      imageClassName="w-full h-full object-contain rounded-full"
                    />
                  </div>
                  {/* Secondary Logo (largest, center) */}
                  <div className="w-28 h-28 bg-white rounded-full shadow-2xl flex items-center justify-center p-2.5 z-10 overflow-hidden ring-4 ring-white hover:ring-primary/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                    <LogoImage 
                      src={siteSettings?.logo_secondary_url} 
                      fallback={<YouthLogo className="w-full h-full" />}
                      imageClassName="w-full h-full object-contain rounded-full"
                    />
                  </div>
                  {/* Tertiary Logo */}
                  <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center p-2 overflow-hidden ring-2 ring-white hover:ring-primary/30 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                    <LogoImage 
                      src={siteSettings?.logo_tertiary_url} 
                      fallback={<CSLogo className="w-full h-full" />}
                      imageClassName="w-full h-full object-contain rounded-full"
                    />
                  </div>
                </div>
                
                {/* Title Section - Centered */}
                <div className="text-center space-y-1">
                  <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight drop-shadow-sm">
                    {appName}
                  </h1>
                  <h2 className="text-lg md:text-xl text-textMuted font-medium tracking-wide">
                    {appSubtitle}
                  </h2>
                </div>
              </div>
              
              {/* About Us Card with Read More */}
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-primary text-sm text-textDark leading-relaxed hover:shadow-md transition-shadow duration-300">
                <h3 className="font-bold text-base mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                  About Us
                </h3>
                <p className={`text-gray-600 ${!showFullAbout ? 'line-clamp-4' : ''}`}>
                  {aboutText}
                </p>
                {aboutText && aboutText.length > 200 && (
                  <button 
                    onClick={() => setShowFullAbout(!showFullAbout)}
                    className="text-primary font-medium text-sm mt-3 hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-1"
                  >
                    {showFullAbout ? '← Show Less' : 'Read More →'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Right Side: Action Cards */}
          <div className="flex flex-col justify-center space-y-5">
             {/* Main Login Card */}
             <Card className="transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white/80 backdrop-blur-sm border border-white/50">
               <div className="text-center mb-6">
                 <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-hover rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/25">
                   <User className="w-7 h-7 text-white" />
                 </div>
                 <h3 className="text-2xl font-bold text-textDark">Unit Portal</h3>
                 <p className="text-textMuted text-sm mt-1">Access your unit dashboard</p>
               </div>
               
               <div className="space-y-3">
                 {registrationEnabled ? (
                   <Button 
                     variant="outline" 
                     size="block"
                     onClick={handleRegistrationClick}
                     className="hover:bg-primary/5"
                   >
                     Unit Registration
                   </Button>
                 ) : (
                   <Button 
                     variant="outline" 
                     size="block" 
                     disabled
                     className="opacity-60 cursor-not-allowed bg-gray-50"
                   >
                     {registrationClosedMessage}
                   </Button>
                 )}
                 
                 <Button 
                   variant="primary" 
                   size="block"
                   onClick={() => openLoginModal()}
                   className="shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
                 >
                   Unit Login
                 </Button>
               </div>
             </Card>

             {/* Quick Links */}
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
               <button 
                 onClick={() => navigate('/kalamela')}
                 className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-white/50 hover:border-purple-300 hover:shadow-lg cursor-pointer transition-all duration-300 text-center group hover:scale-[1.02] hover:-translate-y-0.5"
                 aria-label="Go to Kalamela"
               >
                 <div className="w-11 h-11 bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600 rounded-xl flex items-center justify-center mx-auto mb-2.5 group-hover:from-purple-500 group-hover:to-purple-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-lg group-hover:shadow-purple-500/25">
                   <Award size={20} />
                 </div>
                 <span className="font-semibold text-sm text-gray-700 group-hover:text-purple-600 transition-colors">Kalamela</span>
               </button>
               <button 
                 onClick={() => navigate('/conference')}
                 className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-white/50 hover:border-orange-300 hover:shadow-lg cursor-pointer transition-all duration-300 text-center group hover:scale-[1.02] hover:-translate-y-0.5"
                 aria-label="Go to Conference"
               >
                 <div className="w-11 h-11 bg-gradient-to-br from-orange-100 to-orange-200 text-orange-600 rounded-xl flex items-center justify-center mx-auto mb-2.5 group-hover:from-orange-500 group-hover:to-orange-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-lg group-hover:shadow-orange-500/25">
                   <Users size={20} />
                 </div>
                 <span className="font-semibold text-sm text-gray-700 group-hover:text-orange-600 transition-colors">Conference</span>
               </button>
               <button 
                 onClick={() => navigate('/yuvalokham')}
                 className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-white/50 hover:border-emerald-300 hover:shadow-lg cursor-pointer transition-all duration-300 text-center group hover:scale-[1.02] hover:-translate-y-0.5"
                 aria-label="Go to Yuvalokham"
               >
                 <div className="w-11 h-11 bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-2.5 group-hover:from-emerald-500 group-hover:to-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-lg group-hover:shadow-emerald-500/25">
                   <BookOpen size={20} />
                 </div>
                 <span className="font-semibold text-sm text-gray-700 group-hover:text-emerald-600 transition-colors">Yuvalokham</span>
               </button>
               <button 
                 onClick={() => navigateProtected('/admin/blood-donor-search')}
                 className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-white/50 hover:border-red-300 hover:shadow-lg cursor-pointer transition-all duration-300 text-center group hover:scale-[1.02] hover:-translate-y-0.5"
                 aria-label="Blood Bank"
               >
                 <div className="w-11 h-11 bg-gradient-to-br from-red-100 to-red-200 text-red-600 rounded-xl flex items-center justify-center mx-auto mb-2.5 group-hover:from-red-500 group-hover:to-red-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-lg group-hover:shadow-red-500/25">
                   <Droplets size={20} />
                 </div>
                 <span className="font-semibold text-sm text-gray-700 group-hover:text-red-600 transition-colors">Blood Bank</span>
               </button>
             </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer siteSettings={siteSettings} />

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="bg-primary px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-white font-semibold text-lg">Unit Login</h3>
                {redirectAfterLogin && (
                  <p className="text-white/75 text-xs mt-0.5">
                    Login to continue to {redirectAfterLogin === '/admin/blood-donor-search' ? 'Blood Bank' : redirectAfterLogin}
                  </p>
                )}
              </div>
              <button 
                onClick={() => { setShowLoginModal(false); setRedirectAfterLogin(null); setFormError(''); }} 
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
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (formError) setFormError('');
                      }}
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
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (formError) setFormError('');
                      }}
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
                {formError && (
                  <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-md p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
