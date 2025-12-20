
import React, { Suspense, lazy, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, AuthLayout } from './components/Layout';
import { ToastProvider } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Skeleton } from './components/ui';
import { UserRole } from './types';
import { QueryProvider } from './providers/QueryProvider';

// Lazy Load Pages
const PublicHome = lazy(() => import('./pages/PublicHome').then(module => ({ default: module.PublicHome })));
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const KalamelaPublic = lazy(() => import('./pages/KalamelaPublic').then(module => ({ default: module.KalamelaPublic })));
const KalamelaOfficial = lazy(() => import('./pages/KalamelaOfficial').then(module => ({ default: module.KalamelaOfficial })));
const Conference = lazy(() => import('./pages/Conference').then(module => ({ default: module.Conference })));

// Conference Official Pages
const ConferenceOfficialLayout = lazy(() => import('./pages/Conference/ConferenceOfficialLayout').then(module => ({ default: module.ConferenceOfficialLayout })));
const ConferenceOfficialHome = lazy(() => import('./pages/Conference/ConferenceOfficialHome').then(module => ({ default: module.ConferenceOfficialHome })));
const ConferenceDelegates = lazy(() => import('./pages/Conference/ConferenceDelegates').then(module => ({ default: module.ConferenceDelegates })));
const ConferencePayment = lazy(() => import('./pages/Conference/ConferencePayment').then(module => ({ default: module.ConferencePayment })));
const ConferenceExport = lazy(() => import('./pages/Conference/ConferenceExport').then(module => ({ default: module.ConferenceExport })));

// Conference Admin Pages
const ConferenceAdminHome = lazy(() => import('./pages/Conference/ConferenceAdminHome').then(module => ({ default: module.ConferenceAdminHome })));
const ConferenceAdminOfficials = lazy(() => import('./pages/Conference/ConferenceAdminOfficials').then(module => ({ default: module.ConferenceAdminOfficials })));
const ConferenceAdminInfo = lazy(() => import('./pages/Conference/ConferenceAdminInfo').then(module => ({ default: module.ConferenceAdminInfo })));
const ConferenceAdminPayments = lazy(() => import('./pages/Conference/ConferenceAdminPayments').then(module => ({ default: module.ConferenceAdminPayments })));
const ScoreEntry = lazy(() => import('./pages/ScoreEntry').then(module => ({ default: module.ScoreEntry })));

// Unit Admin Pages
const ViewAllUnits = lazy(() => import('./pages/UnitAdmin/ViewAllUnits').then(module => ({ default: module.ViewAllUnits })));
const ViewAllOfficials = lazy(() => import('./pages/UnitAdmin/ViewAllOfficials').then(module => ({ default: module.ViewAllOfficials })));
const ViewAllCouncilors = lazy(() => import('./pages/UnitAdmin/ViewAllCouncilors').then(module => ({ default: module.ViewAllCouncilors })));
const ViewAllMembers = lazy(() => import('./pages/UnitAdmin/ViewAllMembers').then(module => ({ default: module.ViewAllMembers })));
const ViewIndividualUnit = lazy(() => import('./pages/UnitAdmin/ViewIndividualUnit').then(module => ({ default: module.ViewIndividualUnit })));
const ArchivedMembers = lazy(() => import('./pages/UnitAdmin/ArchivedMembers').then(module => ({ default: module.ArchivedMembers })));
const UnitTransferRequests = lazy(() => import('./pages/UnitAdmin/UnitTransferRequests').then(module => ({ default: module.UnitTransferRequests })));
const MemberInfoChangeRequests = lazy(() => import('./pages/UnitAdmin/MemberInfoChangeRequests').then(module => ({ default: module.MemberInfoChangeRequests })));
const OfficialsChangeRequests = lazy(() => import('./pages/UnitAdmin/OfficialsChangeRequests').then(module => ({ default: module.OfficialsChangeRequests })));
const CouncilorChangeRequests = lazy(() => import('./pages/UnitAdmin/CouncilorChangeRequests').then(module => ({ default: module.CouncilorChangeRequests })));
const MemberAddRequests = lazy(() => import('./pages/UnitAdmin/MemberAddRequests').then(module => ({ default: module.MemberAddRequests })));
const ExportData = lazy(() => import('./pages/UnitAdmin/ExportData').then(module => ({ default: module.ExportData })));
const PrintForm = lazy(() => import('./pages/UnitAdmin/PrintForm').then(module => ({ default: module.PrintForm })));
const SiteSettings = lazy(() => import('./pages/UnitAdmin/SiteSettings').then(module => ({ default: module.SiteSettings })));

// Unit User Pages (for unit officials)
const ViewMyRequests = lazy(() => import('./pages/UnitUser/ViewMyRequests').then(module => ({ default: module.ViewMyRequests })));
const SubmitTransferRequest = lazy(() => import('./pages/UnitUser/SubmitTransferRequest').then(module => ({ default: module.SubmitTransferRequest })));
const SubmitMemberInfoChange = lazy(() => import('./pages/UnitUser/SubmitMemberInfoChange').then(module => ({ default: module.SubmitMemberInfoChange })));
const SubmitOfficialsChange = lazy(() => import('./pages/UnitUser/SubmitOfficialsChange').then(module => ({ default: module.SubmitOfficialsChange })));
const SubmitCouncilorChange = lazy(() => import('./pages/UnitUser/SubmitCouncilorChange').then(module => ({ default: module.SubmitCouncilorChange })));
const SubmitMemberAdd = lazy(() => import('./pages/UnitUser/SubmitMemberAdd').then(module => ({ default: module.SubmitMemberAdd })));

// Kalamela Pages
const EventsManagement = lazy(() => import('./pages/Kalamela/EventsManagement').then(module => ({ default: module.EventsManagement })));
const KalamelaOfficialHome = lazy(() => import('./pages/Kalamela/OfficialHome').then(module => ({ default: module.KalamelaOfficialHome })));
const SelectIndividualParticipants = lazy(() => import('./pages/Kalamela/SelectIndividualParticipants').then(module => ({ default: module.SelectIndividualParticipants })));
const SelectGroupParticipants = lazy(() => import('./pages/Kalamela/SelectGroupParticipants').then(module => ({ default: module.SelectGroupParticipants })));
const ViewParticipants = lazy(() => import('./pages/Kalamela/ViewParticipants').then(module => ({ default: module.ViewParticipants })));
const PaymentPreview = lazy(() => import('./pages/Kalamela/PaymentPreview').then(module => ({ default: module.PaymentPreview })));
const PrintView = lazy(() => import('./pages/Kalamela/PrintView').then(module => ({ default: module.PrintView })));
const PublicResults = lazy(() => import('./pages/Kalamela/PublicResults').then(module => ({ default: module.PublicResults })));
const TopPerformers = lazy(() => import('./pages/Kalamela/TopPerformers').then(module => ({ default: module.TopPerformers })));

// Kalamela Admin Pages
const ViewScores = lazy(() => import('./pages/Kalamela/Admin/ViewScores').then(module => ({ default: module.ViewScores })));
const ScoreIndividualEvent = lazy(() => import('./pages/Kalamela/Admin/ScoreIndividualEvent').then(module => ({ default: module.ScoreIndividualEvent })));
const ScoreGroupEvent = lazy(() => import('./pages/Kalamela/Admin/ScoreGroupEvent').then(module => ({ default: module.ScoreGroupEvent })));
const AdminResults = lazy(() => import('./pages/Kalamela/Admin/AdminResults').then(module => ({ default: module.AdminResults })));
const ManagePayments = lazy(() => import('./pages/Kalamela/Admin/ManagePayments').then(module => ({ default: module.ManagePayments })));
const ManageAppeals = lazy(() => import('./pages/Kalamela/Admin/ManageAppeals').then(module => ({ default: module.ManageAppeals })));

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
      <QueryProvider>
        <ToastProvider>
          <Router>
            <Suspense fallback={<PageLoader />}>
              <Routes>
              {/* Homepage with Login */}
              <Route path="/" element={<PublicHome onLogin={handleLogin} />} />
              
              {/* Kalamela Public Portal */}
              <Route path="/kalamela" element={<KalamelaPublic />} />
              
              {/* Kalamela Official Portal (for authenticated district officials) */}
              <Route path="/kalamela/official" element={<KalamelaOfficial />} />
              
              {/* Conference Public Portal */}
              <Route path="/conference" element={<Conference />} />
              
              {/* Conference Official Portal */}
              <Route path="/conference/official" element={<ConferenceOfficialLayout />}>
                <Route path="home" element={<ConferenceOfficialHome />} />
                <Route path="delegates" element={<ConferenceDelegates />} />
                <Route path="payment" element={<ConferencePayment />} />
                <Route path="export" element={<ConferenceExport />} />
                <Route index element={<ConferenceOfficialHome />} />
              </Route>
              
              {/* Auth Routes */}
              <Route path="/login" element={
                <AuthRoute>
                  <Login onLogin={handleLogin} />
                </AuthRoute>
              } />
              
              {/* Admin Routes - Unit Admin Module */}
              <Route path="/admin/dashboard" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />

              {/* Unit Management */}
              <Route path="/admin/units" element={
                <AdminRoute>
                  <ViewAllUnits />
                </AdminRoute>
              } />

              <Route path="/admin/units/:id" element={
                <AdminRoute>
                  <ViewIndividualUnit />
                </AdminRoute>
              } />

              <Route path="/admin/officials" element={
                <AdminRoute>
                  <ViewAllOfficials />
                </AdminRoute>
              } />

              <Route path="/admin/councilors" element={
                <AdminRoute>
                  <ViewAllCouncilors />
                </AdminRoute>
              } />

              <Route path="/admin/members" element={
                <AdminRoute>
                  <ViewAllMembers />
                </AdminRoute>
              } />

              <Route path="/admin/archived-members" element={
                <AdminRoute>
                  <ArchivedMembers />
                </AdminRoute>
              } />

              {/* Change Requests */}
              <Route path="/admin/requests/transfers" element={
                <AdminRoute>
                  <UnitTransferRequests />
                </AdminRoute>
              } />

              <Route path="/admin/requests/member-info" element={
                <AdminRoute>
                  <MemberInfoChangeRequests />
                </AdminRoute>
              } />

              <Route path="/admin/requests/officials" element={
                <AdminRoute>
                  <OfficialsChangeRequests />
                </AdminRoute>
              } />

              <Route path="/admin/requests/councilors" element={
                <AdminRoute>
                  <CouncilorChangeRequests />
                </AdminRoute>
              } />

              <Route path="/admin/requests/member-add" element={
                <AdminRoute>
                  <MemberAddRequests />
                </AdminRoute>
              } />

              {/* Export & Print */}
              <Route path="/admin/export" element={
                <AdminRoute>
                  <ExportData />
                </AdminRoute>
              } />

              {/* Site Settings */}
              <Route path="/admin/site-settings" element={
                <AdminRoute>
                  <SiteSettings />
                </AdminRoute>
              } />

              {/* Conference Admin Routes */}
              <Route path="/admin/conference/home" element={
                <AdminRoute>
                  <ConferenceAdminHome />
                </AdminRoute>
              } />

              <Route path="/admin/conference/officials" element={
                <AdminRoute>
                  <ConferenceAdminOfficials />
                </AdminRoute>
              } />

              <Route path="/admin/conference/info" element={
                <AdminRoute>
                  <ConferenceAdminInfo />
                </AdminRoute>
              } />

              <Route path="/admin/conference/payments" element={
                <AdminRoute>
                  <ConferenceAdminPayments />
                </AdminRoute>
              } />

              <Route path="/admin/print-form/:unitId" element={
                <AdminRoute>
                  <PrintForm />
                </AdminRoute>
              } />

              {/* Unit User Routes (for unit officials) */}
              <Route path="/unit/my-requests" element={
                <AdminRoute>
                  <ViewMyRequests />
                </AdminRoute>
              } />

              <Route path="/unit/submit-transfer" element={
                <AdminRoute>
                  <SubmitTransferRequest />
                </AdminRoute>
              } />

              <Route path="/unit/submit-member-info" element={
                <AdminRoute>
                  <SubmitMemberInfoChange />
                </AdminRoute>
              } />

              <Route path="/unit/submit-officials" element={
                <AdminRoute>
                  <SubmitOfficialsChange />
                </AdminRoute>
              } />

              <Route path="/unit/submit-councilor" element={
                <AdminRoute>
                  <SubmitCouncilorChange />
                </AdminRoute>
              } />

              <Route path="/unit/submit-member-add" element={
                <AdminRoute>
                  <SubmitMemberAdd />
                </AdminRoute>
              } />

              {/* Kalamela Admin Routes */}
              <Route path="/kalamela/admin/events" element={
                <AdminRoute>
                  <EventsManagement />
                </AdminRoute>
              } />

              <Route path="/kalamela/admin/scores" element={
                <AdminRoute>
                  <ViewScores />
                </AdminRoute>
              } />

              <Route path="/kalamela/admin/scores/individual/:eventId/add" element={
                <AdminRoute>
                  <ScoreIndividualEvent />
                </AdminRoute>
              } />

              <Route path="/kalamela/admin/scores/group/:eventId/add" element={
                <AdminRoute>
                  <ScoreGroupEvent />
                </AdminRoute>
              } />

              <Route path="/kalamela/admin/scores/individual/:eventId/edit" element={
                <AdminRoute>
                  <ScoreIndividualEvent />
                </AdminRoute>
              } />

              <Route path="/kalamela/admin/scores/group/:eventId/edit" element={
                <AdminRoute>
                  <ScoreGroupEvent />
                </AdminRoute>
              } />

              <Route path="/kalamela/admin/results" element={
                <AdminRoute>
                  <AdminResults />
                </AdminRoute>
              } />

              <Route path="/kalamela/admin/payments" element={
                <AdminRoute>
                  <ManagePayments />
                </AdminRoute>
              } />

              <Route path="/kalamela/admin/appeals" element={
                <AdminRoute>
                  <ManageAppeals />
                </AdminRoute>
              } />

              {/* Kalamela Official Routes */}
              <Route path="/kalamela/official/home" element={
                <AdminRoute>
                  <KalamelaOfficialHome />
                </AdminRoute>
              } />

              <Route path="/kalamela/official/event/individual/:eventId" element={
                <AdminRoute>
                  <SelectIndividualParticipants />
                </AdminRoute>
              } />

              <Route path="/kalamela/official/event/group/:eventId" element={
                <AdminRoute>
                  <SelectGroupParticipants />
                </AdminRoute>
              } />

              <Route path="/kalamela/official/participants" element={
                <AdminRoute>
                  <ViewParticipants />
                </AdminRoute>
              } />

              <Route path="/kalamela/official/preview" element={
                <AdminRoute>
                  <PaymentPreview />
                </AdminRoute>
              } />

              <Route path="/kalamela/official/print" element={
                <AdminRoute>
                  <PrintView />
                </AdminRoute>
              } />

              {/* Kalamela Public Routes */}
              <Route path="/kalamela/results" element={<PublicResults />} />
              <Route path="/kalamela/top-performers" element={<TopPerformers />} />

              {/* Legacy Routes */}
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
      </QueryProvider>
    </ErrorBoundary>
  );
};

export default App;
