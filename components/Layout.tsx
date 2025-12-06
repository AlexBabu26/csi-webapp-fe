import React, { useState } from 'react';
import { Menu, X, Bell, User, LayoutDashboard, Users, Award, FileText, Settings, LogOut } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
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

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change on mobile
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-bg-alt flex flex-col no-print">
      {/* Navbar */}
      <nav className="bg-white border-b border-border-color sticky top-0 z-30 h-16">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            <div className="flex items-center">
              <button
                type="button"
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu size={24} />
              </button>
              <div className="flex-shrink-0 flex items-center ml-4 lg:ml-0">
                <div className="h-8 w-8 bg-primary rounded flex items-center justify-center text-white font-bold mr-2">
                  K
                </div>
                <span className="font-bold text-xl text-dark hidden sm:block">{APP_NAME}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-full text-gray-400 hover:text-primary hover:bg-gray-100 relative">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-danger ring-2 ring-white" />
              </button>
              <div className="relative flex items-center">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                  JD
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700 hidden md:block">John Doe</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-20 w-64 bg-white border-r border-border-color transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="h-full flex flex-col justify-between py-6">
            <div className="px-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `
                      group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                      ${isActive 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                    `}
                  >
                    <span className={`mr-3 ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500'}`}>
                      {item.icon}
                    </span>
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
            
            <div className="px-4 mt-auto border-t border-gray-100 pt-4">
               <NavLink
                  to="/"
                  className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-danger hover:bg-red-50 transition-colors"
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
            className="fixed inset-0 z-10 bg-gray-600 bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-bg-alt focus:outline-none">
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
    <div className="min-h-screen bg-bg-alt flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
         <div className="h-12 w-12 bg-primary rounded mx-auto flex items-center justify-center text-white font-bold text-2xl mb-4">
            K
         </div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{APP_NAME}</h2>
        <p className="mt-2 text-sm text-gray-600">
          Official Event Management Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-card sm:rounded-lg sm:px-10 border border-border-color">
          {children}
        </div>
      </div>
    </div>
  );
};