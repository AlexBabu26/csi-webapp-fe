import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  X, 
  Bell, 
  LayoutDashboard, 
  Users, 
  UserCheck,
  Building,
  Download,
  FileText, 
  Settings, 
  LogOut, 
  ChevronDown,
  ChevronRight,
  User,
  ArrowRightLeft,
  UserPlus,
  Shield,
  Calendar,
  Trophy,
  Star,
  CreditCard,
  MessageSquare,
  BarChart3
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { APP_NAME } from '../constants';
import { getAuthUser, clearAuthToken, clearAuthUser } from '../services/auth';
import { AuthUser } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItemType {
  label: string;
  path: string;
  icon: React.ReactNode;
}

type UserRoleType = 'admin' | 'official' | 'public';

interface NavGroup {
  label: string;
  items: NavItemType[];
  defaultOpen?: boolean;
  roles?: UserRoleType[]; // Which roles can see this group
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    defaultOpen: true,
    roles: ['admin'],
    items: [
      { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
    ]
  },
  {
    label: 'Units Management',
    defaultOpen: true,
    roles: ['admin'],
    items: [
      { label: 'All Units', path: '/admin/units', icon: <Building size={18} /> },
      { label: 'Officials', path: '/admin/officials', icon: <Shield size={18} /> },
      { label: 'Councilors', path: '/admin/councilors', icon: <UserCheck size={18} /> },
      { label: 'Members', path: '/admin/members', icon: <Users size={18} /> },
      { label: 'Archived Members', path: '/admin/archived-members', icon: <Users size={18} /> },
    ]
  },
  {
    label: 'Change Requests',
    defaultOpen: false,
    roles: ['admin'],
    items: [
      { label: 'Transfer Requests', path: '/admin/requests/transfers', icon: <ArrowRightLeft size={18} /> },
      { label: 'Info Changes', path: '/admin/requests/member-info', icon: <FileText size={18} /> },
      { label: 'Official Changes', path: '/admin/requests/officials', icon: <Shield size={18} /> },
      { label: 'Councilor Changes', path: '/admin/requests/councilors', icon: <UserCheck size={18} /> },
      { label: 'Member Add Requests', path: '/admin/requests/member-add', icon: <UserPlus size={18} /> },
    ]
  },
  {
    label: 'Data & Reports',
    defaultOpen: false,
    roles: ['admin'],
    items: [
      { label: 'Export Data', path: '/admin/export', icon: <Download size={18} /> },
    ]
  },
  {
    label: 'Site Management',
    defaultOpen: false,
    roles: ['admin'],
    items: [
      { label: 'Site Settings', path: '/admin/site-settings', icon: <Settings size={18} /> },
    ]
  },
  {
    label: 'Kalamela Admin',
    defaultOpen: false,
    roles: ['admin'],
    items: [
      { label: 'Events Management', path: '/kalamela/admin/events', icon: <Calendar size={18} /> },
      { label: 'Score Entry', path: '/kalamela/admin/scores', icon: <Star size={18} /> },
      { label: 'Results', path: '/kalamela/admin/results', icon: <Trophy size={18} /> },
      { label: 'Payments', path: '/kalamela/admin/payments', icon: <CreditCard size={18} /> },
      { label: 'Appeals', path: '/kalamela/admin/appeals', icon: <MessageSquare size={18} /> },
    ]
  },
  {
    label: 'Kalamela Public',
    defaultOpen: false,
    roles: ['admin'],
    items: [
      { label: 'Public Results', path: '/kalamela/results', icon: <BarChart3 size={18} /> },
      { label: 'Top Performers', path: '/kalamela/top-performers', icon: <Trophy size={18} /> },
    ]
  },
  {
    label: 'Kalamela Registration',
    defaultOpen: true,
    roles: ['official'], // Only for officials who login through Kalamela
    items: [
      { label: 'Registration', path: '/kalamela/official/home', icon: <Calendar size={18} /> },
      { label: 'View Participants', path: '/kalamela/official/participants', icon: <Users size={18} /> },
      { label: 'Payment', path: '/kalamela/official/preview', icon: <CreditCard size={18} /> },
    ]
  },
];

// Helper function to get user role from localStorage
const getUserRole = (): UserRoleType => {
  const userType = localStorage.getItem('user_type');
  if (userType === '1') return 'admin';
  if (userType === '2' || userType === '3') return 'official';
  return 'public';
};

// Collapsible Nav Group Component
const NavGroupComponent: React.FC<{ group: NavGroup }> = ({ group }) => {
  const [isOpen, setIsOpen] = useState(group.defaultOpen ?? false);
  const location = useLocation();

  // Auto-expand if any item in group is active
  useEffect(() => {
    const hasActiveItem = group.items.some(item => location.pathname.startsWith(item.path));
    if (hasActiveItem) {
      setIsOpen(true);
    }
  }, [location.pathname, group.items]);

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-textMuted uppercase tracking-wider hover:text-textDark transition-colors"
      >
        <span>{group.label}</span>
        <ChevronRight 
          size={14} 
          className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} 
        />
      </button>
      
      {isOpen && (
        <div className="space-y-0.5 mt-1">
          {group.items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all
                ${isActive 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-textMuted hover:bg-bgLight hover:text-textDark'}
              `}
            >
              <span className={`mr-3 ${location.pathname.startsWith(item.path) ? 'text-primary' : 'text-textMuted group-hover:text-textDark'}`}>
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

// User Dropdown Component
const UserDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load user data on mount
  useEffect(() => {
    const authUser = getAuthUser();
    setUser(authUser);
  }, []);

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
    // Clear auth data
    clearAuthToken();
    clearAuthUser();
    localStorage.removeItem('user_type');
    navigate('/');
    setIsOpen(false);
  };

  // Get display name from user data
  const getDisplayName = () => {
    if (!user) return 'User';
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.username || 'User';
  };

  // Get initials for avatar
  const getInitials = () => {
    const name = getDisplayName();
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get user email
  const getUserEmail = () => {
    return user?.email || '';
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
          {getInitials()}
        </div>
        <span className="text-sm font-medium text-textDark hidden md:block">{getDisplayName()}</span>
        <ChevronDown className={`w-4 h-4 text-textMuted transition-transform hidden md:block ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-borderColor py-1 z-50 animate-fade-in">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-borderColor">
            <p className="text-sm font-medium text-textDark">{getDisplayName()}</p>
            <p className="text-xs text-textMuted">{getUserEmail()}</p>
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
  
  // Get current user role and filter navigation groups
  const userRole = getUserRole();
  const filteredNavGroups = NAV_GROUPS.filter(group => 
    !group.roles || group.roles.includes(userRole)
  );

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
            <nav className="px-4 overflow-y-auto flex-1" role="navigation">
              {filteredNavGroups.map((group, index) => (
                <NavGroupComponent key={index} group={group} />
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
