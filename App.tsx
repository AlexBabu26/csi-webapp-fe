
import React, { Suspense, lazy, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, AuthLayout } from './components/Layout';
import { ToastProvider } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Skeleton } from './components/ui';
import { UserRole } from './types';

// Lazy Load Pages
const PublicHome = lazy(() => import('./pages/PublicHome').then(module => ({ default: module.PublicHome })));
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const KalamelaPublic = lazy(() => import('./pages/KalamelaPublic').then(module => ({ default: module.KalamelaPublic })));
const Conference = lazy(() => import('./pages/Conference').then(module => ({ default: module.Conference })));
const ScoreEntry = lazy(() => import('./pages/ScoreEntry').then(module => ({ default: module.ScoreEntry })));

// Loading Fallback
const PageLoader = () => (
  <div className="p-8 space-y-4">
    <Skeleton className="h-12 w-1/3" />
    <Skeleton className="h-64 w-full" />
    <div className="grid grid-cols-3 gap-4">
       <Skeleton className="h-32" />
       <Skeleton className="h-32" />
       <Skeleton className="h-32" />
    </div>
  </div>
);

// Wrapper for Admin Routes that applies the Dashboard Layout
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <Layout>{children}</Layout>;
};

// Wrapper for Auth Routes that applies the Auth Layout
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <AuthLayout>{children}</AuthLayout>;
};

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
  };

  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Homepage with Login */}
              <Route path="/" element={<PublicHome onLogin={handleLogin} />} />
              
              {/* Kalamela Public Portal */}
              <Route path="/kalamela" element={<KalamelaPublic />} />
              
              {/* Conference Public Portal */}
              <Route path="/conference" element={<Conference />} />
              
              {/* Auth Routes */}
              <Route path="/login" element={
                <AuthRoute>
                  <Login />
                </AuthRoute>
              } />
              
              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />

              <Route path="/admin/registrations" element={
                  <AdminRoute>
                      <div className="text-center py-20 text-gray-500">
                          <h2 className="text-xl">Registration Module Placeholder</h2>
                          <p>Refer to AdminDashboard for table styles.</p>
                      </div>
                  </AdminRoute>
              } />

              <Route path="/admin/events" element={
                <AdminRoute>
                  <ScoreEntry />
                </AdminRoute>
              } />

              {/* Default Redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
