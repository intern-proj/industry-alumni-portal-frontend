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
import VerifySpeaker from './pages/public/VerifySpeaker';
import JobPostDetailPage from './pages/common/JobPostDetailPage';

// Auth Pages
import Login from './pages/auth/Login';
import AdminLogin from './pages/auth/AdminLogin';
import StaffRegistrationCompletion from './pages/auth/StaffRegistrationCompletion';
import PartnerRegistrationCompletion from './pages/auth/PartnerRegistrationCompletion';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import MyEvents from './pages/student/MyEvents';
import MyCertificates from './pages/student/MyCertificates';
import VacancyPortal from './pages/student/VacancyPortal';
import MyApplications from './pages/student/MyApplications';
import StudentProfile from './pages/student/StudentProfile';
import StudentResume from './pages/student/StudentResume';
import StudentCompanies from './pages/student/StudentCompanies';
import StudentCompanyDetailPage from './pages/student/StudentCompanyDetailPage';
import JobApplicationSubmissionPage from './pages/student/JobApplicationSubmissionPage';
import JobApplicationDetailsPage from './pages/student/JobApplicationDetailsPage';

// Partner Pages
import PartnerDashboard from './pages/partner/PartnerDashboard';
import ManagePostedVacancies from './pages/partner/ManagePostedVacancies';
import ViewCandidatesApplications from './pages/partner/ViewCandidatesApplications';
import PartnerApplicationDetailPage from './pages/partner/PartnerApplicationDetailPage';
import CompanyProfileManagement from './pages/partner/CompanyProfileManagement';
import PartnerVerification from './pages/partner/PartnerVerification';
import NotificationSettings from './pages/partner/NotificationSettings';
import PartnerAITalentSearch from './pages/partner/PartnerAITalentSearch';
import PartnerCandidateDetailPage from './pages/partner/PartnerCandidateDetailPage';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard';
import EventsManagement from './pages/staff/EventsManagement';
import EventDetailManagement from './pages/staff/EventDetailManagement';
import CreateEvent from './pages/staff/CreateEvent';
import EditEvent from './pages/staff/EditEvent';
import VenuesManagement from './pages/staff/VenuesManagement';
import SpeakersManagement from './pages/staff/SpeakersManagement';
import CreateGuestSpeaker from './pages/staff/CreateGuestSpeaker';
import GuestSpeakerProfile from './pages/staff/GuestSpeakerProfile';
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
import SmtpConfigurationManager from './pages/admin/SmtpConfigurationManager';
import AiModelConfigurationManager from './pages/admin/AiModelConfigurationManager';

// Guest Speaker Pages
import GuestSpeakerDashboard from './pages/guest/GuestSpeakerDashboard';

// Utility Pages
import NotFound from './pages/utility/NotFound';
import Forbidden from './pages/utility/Forbidden';
import MaintenanceMode from './pages/utility/MaintenanceMode';

import GlobalUIManager from './components/ui/GlobalUIManager';
import { useAuth } from './contexts/AuthContext';

function StaffDefaultRedirect() {
  const { hasAnyRole } = useAuth();
  if (hasAnyRole('EVENT_COORDINATOR') && !hasAnyRole('FACULTY_MANAGEMENT', 'FACULTY_COORDINATOR', 'INTERNSHIP_COORDINATOR', 'ADMINISTRATIVE_STAFF', 'SYSTEM_ADMIN')) {
    return <Navigate to="/staff/events" replace />;
  }
  return <Navigate to="/staff/dashboard" replace />;
}

function App() {
  return (
    <AuthProvider>
      <GlobalUIManager />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/events" element={<EventsDirectory />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/collaborators" element={<CollaboratorsDirectory />} />
            <Route path="/vacancies" element={<PublicVacancyDirectory />} />
            <Route path="/vacancies/:id" element={<JobPostDetailPage />} />
            <Route path="/partner-register" element={<PartnerRegistrationApplication />} />
            <Route path="/partner/register" element={<PartnerRegistrationApplication />} />
            <Route path="/verify/:qrHash" element={<CertificateVerification />} />
            <Route path="/verify-speaker" element={<VerifySpeaker />} />
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
            <Route path="certificates" element={<MyCertificates />} />
            <Route path="vacancies" element={<VacancyPortal />} />
            <Route path="vacancies/:id" element={<JobPostDetailPage />} />
            <Route path="companies" element={<StudentCompanies />} />
            <Route path="companies/:id" element={<StudentCompanyDetailPage />} />
            <Route path="vacancies/:id/apply" element={<JobApplicationSubmissionPage />} />
            <Route path="applications" element={<MyApplications />} />
            <Route path="applications/:id" element={<JobApplicationDetailsPage />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="resume" element={<StudentResume />} />
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
            <Route path="vacancies/:id" element={<JobPostDetailPage />} />
            <Route path="applications" element={<ViewCandidatesApplications />} />
            <Route path="applications/:id" element={<PartnerApplicationDetailPage />} />
            <Route path="profile" element={<CompanyProfileManagement />} />
            <Route path="verification" element={<PartnerVerification />} />
            <Route path="settings" element={<NotificationSettings />} />
            <Route path="talent-search" element={<PartnerAITalentSearch />} />
            <Route path="talent/:id" element={<PartnerCandidateDetailPage />} />
            <Route path="candidates/:id" element={<PartnerCandidateDetailPage />} />
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
            <Route index element={<StaffDefaultRedirect />} />
            <Route path="dashboard" element={<StaffDashboard />} />
            <Route path="events" element={<EventsManagement />} />
            <Route path="events/:id" element={<EventDetailManagement />} />
            <Route path="events/create" element={<CreateEvent />} />
            <Route path="events/:id/edit" element={<EditEvent />} />
            <Route path="venues" element={<VenuesManagement />} />
            <Route path="speakers" element={<SpeakersManagement />} />
            <Route path="speakers/create" element={<CreateGuestSpeaker />} />
            <Route path="speakers/:id" element={<GuestSpeakerProfile />} />
            <Route path="partners" element={<PartnerManagement />} />
            <Route path="vacancy-approvals" element={<VacancyApprovalsQueue />} />
            <Route path="vacancy-approvals/:id" element={<JobPostDetailPage />} />
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
            <Route path="smtp-config" element={<SmtpConfigurationManager />} />
            <Route path="ai-models" element={<AiModelConfigurationManager />} />
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
