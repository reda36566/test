import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { AuditProvider } from "@/contexts/AuditContext";
import { AdminPlatformSettingsProvider } from "@/contexts/AdminPlatformSettingsContext";
import { AvatarProvider } from "@/contexts/AvatarContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// ✅ IMPORT DU CHATBOT
import Chatbot from "./Chatbot";

// Auth pages
import LoginPage from "@/pages/auth/LoginPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ChangePasswordPage from "@/pages/auth/ChangePasswordPage";

// Student pages
import StudentDashboard from "@/pages/student/StudentDashboard";
import StudentReportsPage from "@/pages/student/StudentReportsPage";
import StudentReportDetailPage from "@/pages/student/StudentReportDetailPage";
import StudentReportCreatePage from "@/pages/student/StudentReportCreatePage";
import StudentProfilePage from "@/pages/student/StudentProfilePage";
import StudentReportUploadPage from "@/pages/student/StudentReportUploadPage";

// Supervisor pages
import SupervisorDashboard from "@/pages/supervisor/SupervisorDashboard";
import SupervisorReportsPage from "@/pages/supervisor/SupervisorReportsPage";
import SupervisorReportDetailPage from "@/pages/supervisor/SupervisorReportDetailPage";
import SupervisorHistoryPage from "@/pages/supervisor/SupervisorHistoryPage";
import SupervisorProfilePage from "@/pages/supervisor/SupervisorProfilePage";
import SupervisorEvaluationPage from '@/pages/supervisor/SupervisorEvaluationPage';

// Admin pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsersPage from "@/pages/admin/users/AdminUsersPage";
import AdminUserCreatePage from "@/pages/admin/users/AdminUserCreatePage";
import AdminUserDetailPage from "@/pages/admin/users/AdminUserDetailPage";
import AdminUserEditPage from "@/pages/admin/users/AdminUserEditPage";
import AdminAcademicPage from "@/pages/admin/AdminAcademicPage";
import AdminReportsPage from "@/pages/admin/AdminReportsPage";
import AdminReportDetailPage from "@/pages/admin/AdminReportDetailPage";
import AdminPlagiarismPage from "@/pages/admin/AdminPlagiarismPage";
import AdminNotificationsPage from "@/pages/admin/AdminNotificationsPage";
import AdminAuditPage from "@/pages/admin/AdminAuditPage";
import AdminProfilePage from "@/pages/admin/AdminProfilePage";

// Error pages
import { NotFoundPage } from "@/pages/errors/NotFoundPage";

// Common pages
import NotificationsPage from "@/pages/common/NotificationsPage";
import SettingsPage from "@/pages/common/SettingsPage";
import HelpPage from "@/pages/common/HelpPage";

const queryClient = new QueryClient();

// 👇 NOUVEAU COMPOSANT POUR GÉRER L'AFFICHAGE DU CHATBOT
function AuthenticatedChatbot() {
  const { isAuthenticated } = useAuth();
  // Si connecté -> Affiche le Chatbot
  // Si pas connecté (Login) -> N'affiche rien
  return isAuthenticated ? <Chatbot /> : null;
}

function RoleBasedRedirect() {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  switch (user?.role) {
    case 'ADMIN':
      return <Navigate to="/admin/dashboard" replace />;
    case 'ENCADRANT':
      return <Navigate to="/supervisor/dashboard" replace />;
    case 'ETUDIANT':
      return <Navigate to="/student/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
      {/* Role-based redirect */}
      <Route path="/" element={<RoleBasedRedirect />} />

      {/* Student routes */}
      <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['ETUDIANT']}><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/reports" element={<ProtectedRoute allowedRoles={['ETUDIANT']}><StudentReportsPage /></ProtectedRoute>} />
      <Route path="/student/report/create" element={<ProtectedRoute allowedRoles={['ETUDIANT']}><StudentReportCreatePage /></ProtectedRoute>} />
      <Route path="/student/report/:id" element={<ProtectedRoute allowedRoles={['ETUDIANT']}><StudentReportDetailPage /></ProtectedRoute>} />
      <Route path="/student/report/:id/upload-version" element={<ProtectedRoute allowedRoles={['ETUDIANT']}><StudentReportUploadPage /></ProtectedRoute>} />
      <Route path="/student/report/:id/versions" element={<ProtectedRoute allowedRoles={['ETUDIANT']}><StudentReportDetailPage /></ProtectedRoute>} />
      <Route path="/student/report/:id/comments" element={<ProtectedRoute allowedRoles={['ETUDIANT']}><StudentReportDetailPage /></ProtectedRoute>} />
      <Route path="/student/report/:id/grade" element={<ProtectedRoute allowedRoles={['ETUDIANT']}><StudentReportDetailPage /></ProtectedRoute>} />
      <Route path="/student/notifications" element={<ProtectedRoute allowedRoles={['ETUDIANT']}><NotificationsPage /></ProtectedRoute>} />
      <Route path="/student/profile" element={<ProtectedRoute allowedRoles={['ETUDIANT']}><StudentProfilePage /></ProtectedRoute>} />

      {/* Supervisor routes */}
      <Route path="/supervisor/dashboard" element={<ProtectedRoute allowedRoles={['ENCADRANT']}><SupervisorDashboard /></ProtectedRoute>} />
      <Route path="/supervisor/reports" element={<ProtectedRoute allowedRoles={['ENCADRANT']}><SupervisorReportsPage /></ProtectedRoute>} />
      <Route path="/supervisor/report/:id" element={<ProtectedRoute allowedRoles={['ENCADRANT']}><SupervisorReportDetailPage /></ProtectedRoute>} />
      <Route path="/supervisor/notifications" element={<ProtectedRoute allowedRoles={['ENCADRANT']}><NotificationsPage /></ProtectedRoute>} />
      <Route path="/supervisor/history" element={<ProtectedRoute allowedRoles={['ENCADRANT']}><SupervisorHistoryPage /></ProtectedRoute>} />
      <Route path="/supervisor/profile" element={<ProtectedRoute allowedRoles={['ENCADRANT']}><SupervisorProfilePage /></ProtectedRoute>} />
      <Route path="/supervisor/evaluation/:id" element={<ProtectedRoute allowedRoles={['ENCADRANT']}><SupervisorEvaluationPage /></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminUsersPage /></ProtectedRoute>} />
      <Route path="/admin/users/create" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminUserCreatePage /></ProtectedRoute>} />
      <Route path="/admin/users/:id" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminUserDetailPage /></ProtectedRoute>} />
      <Route path="/admin/users/:id/edit" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminUserEditPage /></ProtectedRoute>} />
      <Route path="/admin/academic" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminAcademicPage /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminReportsPage /></ProtectedRoute>} />
      <Route path="/admin/report/:id" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminReportDetailPage /></ProtectedRoute>} />
      <Route path="/admin/plagiarism" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminPlagiarismPage /></ProtectedRoute>} />
      <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminNotificationsPage /></ProtectedRoute>} />
      <Route path="/admin/audit" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminAuditPage /></ProtectedRoute>} />
      <Route path="/admin/profile" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminProfilePage /></ProtectedRoute>} />

      {/* Common routes */}
      <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/help" element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <NotificationsProvider>
          <AuditProvider>
            <AdminPlatformSettingsProvider>
              <AvatarProvider>
                <Toaster />
                <Sonner />
                
                <BrowserRouter>
                  {/* ✅ CHATBOT DÉPLACÉ ICI : Il a maintenant accès au contexte Auth */}
                  <AuthenticatedChatbot />
                  
                  <AppRoutes />
                </BrowserRouter>

              </AvatarProvider>
            </AdminPlatformSettingsProvider>
          </AuditProvider>
        </NotificationsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
