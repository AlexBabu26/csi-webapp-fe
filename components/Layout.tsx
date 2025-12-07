import React, { useState, useRef, useEffect } from 'react';
import { Menu, X, Bell, LayoutDashboard, Users, Award, FileText, Settings, LogOut, ChevronDown, User } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { APP_NAME } from '../constants';
import { NavItem } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Registrations', path: '/admin/registrations', icon: <Users size={18} /> },
  { label: 'Events & Scores', path: '/admin/events', icon: <Award size={18} /> },
  { label: 'Reports', path: '/admin/reports', icon: <FileText size={18} /> },
  { label: 'Settings', path: '/admin/settings', icon: <Settings size={18} /> },
];

// User Dropdown Component
const UserDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    navigate('/');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-bgLight transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
      >
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
          JD
        </div>
        <span className="text-sm font-medium text-textDark hidden md:block">John Doe</span>
        <ChevronDown className={`w-4 h-4 text-textMuted transition-transform hidden md:block ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-borderColor py-1 z-50 animate-fade-in">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-borderColor">
            <p className="text-sm font-medium text-textDark">John Doe</p>
            <p className="text-xs text-textMuted">admin@csimkd.org</p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={() => { navigate('/admin/settings'); setIsOpen(false); }}
              className="w-full flex items-center px-4 py-2 text-sm text-textMuted hover:bg-bgLight hover:text-textDark transition-colors"
            >
              <User className="w-4 h-4 mr-3" />
              My Profile
            </button>
            <button
              onClick={() => { navigate('/admin/settings'); setIsOpen(false); }}
              className="w-full flex items-center px-4 py-2 text-sm text-textMuted hover:bg-bgLight hover:text-textDark transition-colors"
            >
              <Settings className="w-4 h-4 mr-3" />
              Settings
            </button>
          </div>

          {/* Logout */}
          <div className="border-t border-borderColor py-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-sm text-danger hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-bgLight flex flex-col no-print">
      {/* Navbar */}
      <nav className="bg-white border-b border-borderColor sticky top-0 z-30 h-16">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            <div className="flex items-center">
              <button
                type="button"
                className="lg:hidden p-2 rounded-md text-textMuted hover:text-textDark hover:bg-bgLight focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={sidebarOpen}
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div className="flex-shrink-0 flex items-center ml-4 lg:ml-0">
                <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center text-white font-bold mr-2">
                  K
                </div>
                <span className="font-bold text-lg text-textDark hidden sm:block">{APP_NAME}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Notifications */}
              <button 
                className="p-2 rounded-full text-textMuted hover:text-primary hover:bg-bgLight relative transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label="Notifications"
              >
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-danger ring-2 ring-white" />
              </button>

              {/* User Dropdown */}
              <UserDropdown />
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-20 w-64 bg-white border-r border-borderColor transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
          aria-label="Sidebar navigation"
        >
          <div className="h-full flex flex-col justify-between pt-16 lg:pt-6 pb-6">
            <nav className="px-4 space-y-1" role="navigation">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `
                    group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all
                    ${isActive 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-textMuted hover:bg-bgLight hover:text-textDark'}
                  `}
                  aria-current={location.pathname.startsWith(item.path) ? 'page' : undefined}
                >
                  <span className={`mr-3 ${location.pathname.startsWith(item.path) ? 'text-primary' : 'text-textMuted group-hover:text-textDark'}`}>
                    {item.icon}
                  </span>
                  {item.label}
                </NavLink>
              ))}
            </nav>
            
            <div className="px-4 mt-auto border-t border-borderColor pt-4">
               <NavLink
                  to="/"
                  className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-danger hover:bg-red-50 transition-colors"
                >
                  <LogOut size={18} className="mr-3 text-danger" />
                  Sign Out
                </NavLink>
            </div>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-10 bg-textDark/50 backdrop-blur-sm lg:hidden transition-opacity"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-bgLight focus:outline-none" tabIndex={-1}>
          <div className="max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-bgLight flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
         <div className="h-12 w-12 bg-primary rounded-md mx-auto flex items-center justify-center text-white font-bold text-2xl mb-4">
            K
         </div>
        <h2 className="text-3xl font-extrabold text-textDark tracking-tight">{APP_NAME}</h2>
        <p className="mt-2 text-sm text-textMuted">
          Official Event Management Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-lg sm:px-10 border border-borderColor">
          {children}
        </div>
      </div>
    </div>
  );
};
