import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, User, CreditCard, BookOpen, MessageSquare,
  FileText, LogOut, Menu, X,
} from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useYMProfile, useYMLogout } from '../../hooks/queries';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/yuvalokham/user/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'My Profile', path: '/yuvalokham/user/profile', icon: <User size={18} /> },
  { label: 'Plans', path: '/yuvalokham/user/plans', icon: <FileText size={18} /> },
  { label: 'Subscriptions', path: '/yuvalokham/user/subscriptions', icon: <CreditCard size={18} /> },
  { label: 'Payments', path: '/yuvalokham/user/payments', icon: <CreditCard size={18} /> },
  { label: 'Magazines', path: '/yuvalokham/user/magazines', icon: <BookOpen size={18} /> },
  { label: 'Complaints', path: '/yuvalokham/user/complaints', icon: <MessageSquare size={18} /> },
];

export const YMUserLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { data: profile } = useYMProfile();
  const ymLogout = useYMLogout();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

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

  const handleLogout = () => {
    ymLogout();
    navigate('/yuvalokham/login');
  };

  const displayName = profile?.name || 'User';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-bgLight flex flex-col">
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
                <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center text-white mr-2">
                  <BookOpen size={18} />
                </div>
                <span className="font-bold text-lg text-textDark hidden sm:block">Yuvalokham</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                  {initials}
                </div>
                <span className="text-sm font-medium text-textDark hidden md:block">{displayName}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-md text-textMuted hover:text-danger hover:bg-red-50 transition-colors focus:outline-none"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
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
              <p className="px-3 py-2 text-xs font-semibold text-textMuted uppercase tracking-wider">
                Menu
              </p>
              <div className="space-y-0.5 mt-1">
                {NAV_ITEMS.map((item) => (
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
                    <span
                      className={`mr-3 ${
                        location.pathname === item.path
                          ? 'text-primary'
                          : 'text-textMuted group-hover:text-textDark'
                      }`}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </nav>

            <div className="px-4 mt-auto border-t border-borderColor pt-4">
              <button
                onClick={handleLogout}
                className="group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-md text-danger hover:bg-red-50 transition-colors"
              >
                <LogOut size={18} className="mr-3 text-danger" />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-10 bg-black/35 backdrop-blur lg:hidden transition-opacity"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-bgLight focus:outline-none" tabIndex={-1}>
          <div className="max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
