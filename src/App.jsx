import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import StudentLayout from './layouts/StudentLayout';
import PartnerLayout from './layouts/PartnerLayout';
import StaffLayout from './layouts/StaffLayout';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import StudentDashboard from './pages/student/StudentDashboard';
import PartnerDashboard from './pages/partner/PartnerDashboard';
import StaffDashboard from './pages/staff/StaffDashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Student Portal Routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/student/dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            {/* Additional student routes will go here */}
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
            <Route index element={<Navigate to="/partner/dashboard" replace />} />
            <Route path="dashboard" element={<PartnerDashboard />} />
            {/* Additional partner routes will go here */}
          </Route>

          {/* Staff Portal Routes */}
          <Route
            path="/staff"
            element={
              <ProtectedRoute allowedRoles={['FACULTY_MANAGEMENT', 'FACULTY_COORDINATOR', 'INTERNSHIP_COORDINATOR', 'EVENT_COORDINATOR', 'ADMINISTRATIVE_STAFF', 'STAFF']}>
                <StaffLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/staff/dashboard" replace />} />
            <Route path="dashboard" element={<StaffDashboard />} />
            {/* Additional staff routes will go here */}
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
