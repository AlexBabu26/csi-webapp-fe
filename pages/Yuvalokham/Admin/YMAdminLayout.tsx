import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Tag,
  FileText,
  CreditCard,
  BookOpen,
  MessageSquare,
  QrCode,
  UserPlus,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { clearYMAuth } from '../../../services/yuvalokham-auth';
import { useYMProfile } from '../../../hooks/queries';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/yuvalokham/admin/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Users', path: '/yuvalokham/admin/users', icon: <Users size={18} /> },
  { label: 'Plans', path: '/yuvalokham/admin/plans', icon: <Tag size={18} /> },
  { label: 'Subscriptions', path: '/yuvalokham/admin/subscriptions', icon: <FileText size={18} /> },
  { label: 'Payments', path: '/yuvalokham/admin/payments', icon: <CreditCard size={18} /> },
  { label: 'Magazines', path: '/yuvalokham/admin/magazines', icon: <BookOpen size={18} /> },
  { label: 'Complaints', path: '/yuvalokham/admin/complaints', icon: <MessageSquare size={18} /> },
  { label: 'QR Settings', path: '/yuvalokham/admin/qr-settings', icon: <QrCode size={18} /> },
  { label: 'Create Admin', path: '/yuvalokham/admin/admins/new', icon: <UserPlus size={18} /> },
];

export const YMAdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: profile } = useYMProfile();

  const handleLogout = () => {
    clearYMAuth();
    navigate('/yuvalokham/login');
  };

  return (
    <div className="min-h-screen bg-bgLight flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white border-r border-borderColor
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Branding */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-borderColor">
          <div>
            <h1 className="text-lg font-bold text-primary">Yuvalokham</h1>
            <p className="text-xs text-textMuted -mt-0.5">Admin Panel</p>
          </div>
          <button
            className="lg:hidden p-1.5 rounded-md text-textMuted hover:bg-bgLight"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all
                ${isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-textMuted hover:bg-bgLight hover:text-textDark'}
              `}
            >
              {({ isActive }) => (
                <>
                  <span className={isActive ? 'text-primary' : 'text-textMuted group-hover:text-textDark'}>
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight size={14} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="p-3 border-t border-borderColor">
          {profile && (
            <div className="px-3 py-2.5 bg-bgLight rounded-md mb-2">
              <p className="text-sm font-medium text-textDark truncate">{profile.name}</p>
              <p className="text-xs text-textMuted truncate">{profile.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md text-textMuted hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="h-16 bg-white border-b border-borderColor sticky top-0 z-30 flex items-center px-4 lg:px-6">
          <button
            className="lg:hidden p-2 -ml-2 rounded-md hover:bg-bgLight text-textMuted"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>
          <h2 className="ml-2 lg:ml-0 text-lg font-semibold text-textDark">Yuvalokham Admin</h2>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
