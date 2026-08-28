import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import StudentLayout from './layouts/StudentLayout';
import StaffLayout from './layouts/StaffLayout';
import AdminLayout from './layouts/AdminLayout';
import PartnerLayout from './layouts/PartnerLayout';
import GuestSpeakerLayout from './layouts/GuestSpeakerLayout';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import EventsDirectory from './pages/public/EventsDirectory';
import EventDetail from './pages/public/EventDetail';
import CollaboratorsDirectory from './pages/public/CollaboratorsDirectory';
import PublicVacancyDirectory from './pages/public/PublicVacancyDirectory';
import PartnerRegistrationApplication from './pages/public/PartnerRegistrationApplication';
import CertificateVerification from './pages/public/CertificateVerification';

// Auth Pages
import Login from './pages/auth/Login';
import AdminLogin from './pages/auth/AdminLogin';
import StaffRegistrationCompletion from './pages/auth/StaffRegistrationCompletion';
import PartnerRegistrationCompletion from './pages/auth/PartnerRegistrationCompletion';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import MyEvents from './pages/student/MyEvents';
import EventCheckIn from './pages/student/EventCheckIn';
import MyCertificates from './pages/student/MyCertificates';
import VacancyPortal from './pages/student/VacancyPortal';
import MyApplications from './pages/student/MyApplications';
import StudentProfile from './pages/student/StudentProfile';
import StudentResume from './pages/student/StudentResume';
import AICareerAssistant from './pages/student/AICareerAssistant';

// Partner Pages
import PartnerDashboard from './pages/partner/PartnerDashboard';
import ManagePostedVacancies from './pages/partner/ManagePostedVacancies';
import ViewCandidatesApplications from './pages/partner/ViewCandidatesApplications';
import CompanyProfileManagement from './pages/partner/CompanyProfileManagement';
import PartnerVerification from './pages/partner/PartnerVerification';
import NotificationSettings from './pages/partner/NotificationSettings';
import PartnerAITalentSearch from './pages/partner/PartnerAITalentSearch';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard';
import EventsVenuesManagement from './pages/staff/EventsVenuesManagement';
import PartnerManagement from './pages/staff/PartnerManagement';
import VacancyApprovalsQueue from './pages/staff/VacancyApprovalsQueue';
import ReportsAnalytics from './pages/staff/ReportsAnalytics';
import SystemAuditLogs from './pages/staff/SystemAuditLogs';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import SystemAlertsBanners from './pages/admin/SystemAlertsBanners';
import NotificationTemplatesManager from './pages/admin/NotificationTemplatesManager';
import StaffInvitationControl from './pages/admin/StaffInvitationControl';

// Guest Speaker Pages
import GuestSpeakerDashboard from './pages/guest/GuestSpeakerDashboard';

// Utility Pages
import NotFound from './pages/utility/NotFound';
import Forbidden from './pages/utility/Forbidden';
import MaintenanceMode from './pages/utility/MaintenanceMode';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/events" element={<EventsDirectory />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/collaborators" element={<CollaboratorsDirectory />} />
            <Route path="/vacancies" element={<PublicVacancyDirectory />} />
            <Route path="/partner-register" element={<PartnerRegistrationApplication />} />
            <Route path="/partner/register" element={<PartnerRegistrationApplication />} />
            <Route path="/verify/:qrHash" element={<CertificateVerification />} />
          </Route>

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/staff/complete-registration" element={<StaffRegistrationCompletion />} />
          <Route path="/partner/complete-registration" element={<PartnerRegistrationCompletion />} />

          {/* Student Portal Routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="events" element={<MyEvents />} />
            <Route path="check-in" element={<EventCheckIn />} />
            <Route path="certificates" element={<MyCertificates />} />
            <Route path="vacancies" element={<VacancyPortal />} />
            <Route path="applications" element={<MyApplications />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="resume" element={<StudentResume />} />
            <Route path="ai-assistant" element={<AICareerAssistant />} />
          </Route>

          {/* Partner Portal Routes */}
          <Route
            path="/partner"
            element={
              <ProtectedRoute allowedRoles={['INDUSTRY_PARTNER']}>
                <PartnerLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<PartnerDashboard />} />
            <Route path="vacancies" element={<ManagePostedVacancies />} />
            <Route path="applications" element={<ViewCandidatesApplications />} />
            <Route path="profile" element={<CompanyProfileManagement />} />
            <Route path="verification" element={<PartnerVerification />} />
            <Route path="settings" element={<NotificationSettings />} />
            <Route path="talent-search" element={<PartnerAITalentSearch />} />
          </Route>

          {/* Staff & Management Portal Routes (Excludes ADMIN) */}
          <Route
            path="/staff"
            element={
              <ProtectedRoute allowedRoles={['FACULTY_MANAGEMENT', 'FACULTY_COORDINATOR', 'INTERNSHIP_COORDINATOR', 'EVENT_COORDINATOR', 'ADMINISTRATIVE_STAFF']}>
                <StaffLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/staff/dashboard" replace />} />
            <Route path="dashboard" element={<StaffDashboard />} />
            <Route path="events" element={<EventsVenuesManagement />} />
            <Route path="partners" element={<PartnerManagement />} />
            <Route path="vacancy-approvals" element={<VacancyApprovalsQueue />} />
            <Route path="reports" element={<ReportsAnalytics />} />
            <Route path="invite-staff" element={<StaffInvitationControl />} />
          </Route>

          {/* Guest Speaker Portal Routes */}
          <Route
            path="/guest-speaker"
            element={
              <ProtectedRoute allowedRoles={['GUEST_SPEAKER']}>
                <GuestSpeakerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/guest-speaker/dashboard" replace />} />
            <Route path="dashboard" element={<GuestSpeakerDashboard />} />
          </Route>

          {/* Dedicated System Administrator Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="invite-staff" element={<StaffInvitationControl />} />
            <Route path="audit-logs" element={<SystemAuditLogs />} />
            <Route path="banners" element={<SystemAlertsBanners />} />
            <Route path="templates" element={<NotificationTemplatesManager />} />
          </Route>

          {/* Utility / System Routes */}
          <Route path="/forbidden" element={<Forbidden />} />
          <Route path="/maintenance" element={<MaintenanceMode />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
