import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute, dashboardPath } from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { AdminLayout } from '../layouts/AdminLayout';
import { ContributorLayout } from '../layouts/ContributorLayout';
import { AddContributorPage } from '../pages/admin/AddContributorPage';
import { AddJobPage } from '../pages/admin/AddJobPage';
import { ActivityPage } from '../pages/admin/ActivityPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { ContributorProfilePage } from '../pages/admin/ContributorProfilePage';
import { ContributorsPage } from '../pages/admin/ContributorsPage';
import { EditContributorPage } from '../pages/admin/EditContributorPage';
import { EditJobPage } from '../pages/admin/EditJobPage';
import { JobDetailsPage } from '../pages/admin/JobDetailsPage';
import { JobsPage } from '../pages/admin/JobsPage';
import { ContentReadyPage } from '../pages/admin/ContentReadyPage';
import { SubmissionDetailsPage } from '../pages/admin/SubmissionDetailsPage';
import { SubmissionsPage } from '../pages/admin/SubmissionsPage';
import { TemplateDetailsPage } from '../pages/admin/TemplateDetailsPage';
import { TemplatesPage } from '../pages/admin/TemplatesPage';
import { AddTemplatePage } from '../pages/admin/AddTemplatePage';
import { EditTemplatePage } from '../pages/admin/EditTemplatePage';
import { LoginPage } from '../pages/auth/LoginPage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { ContributorDashboardPage } from '../pages/contributor/ContributorDashboardPage';
import { ContributorJobDetailsPage } from '../pages/contributor/ContributorJobDetailsPage';
import { ContributorSubmissionsPage } from '../pages/contributor/ContributorSubmissionsPage';
import { MyJobsPage } from '../pages/contributor/MyJobsPage';
import { SubmissionPage } from '../pages/contributor/SubmissionPage';
import { TopicResourceSubmissionPage } from '../pages/contributor/TopicResourceSubmissionPage';

function NotificationsRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-600">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user.role === 'ADMIN' ? '/admin/notifications' : '/contributor/notifications'} replace />;
}

function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-600">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={dashboardPath(user.role)} replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/notifications" element={<NotificationsRedirect />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="contributors" element={<ContributorsPage />} />
        <Route path="contributors/new" element={<AddContributorPage />} />
        <Route path="contributors/:id" element={<ContributorProfilePage />} />
        <Route path="contributors/:id/edit" element={<EditContributorPage />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="jobs/new" element={<AddJobPage />} />
        <Route path="jobs/:id" element={<JobDetailsPage />} />
        <Route path="jobs/:id/edit" element={<EditJobPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="templates/new" element={<AddTemplatePage />} />
        <Route path="templates/:id" element={<TemplateDetailsPage />} />
        <Route path="templates/:id/edit" element={<EditTemplatePage />} />
        <Route path="submissions" element={<SubmissionsPage />} />
        <Route path="submissions/:id" element={<SubmissionDetailsPage />} />
        <Route path="content" element={<ContentReadyPage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>
      <Route
        path="/contributor"
        element={
          <ProtectedRoute allowedRole="CONTRIBUTOR">
            <ContributorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ContributorDashboardPage />} />
        <Route path="jobs" element={<MyJobsPage />} />
        <Route path="jobs/:jobId/submission" element={<SubmissionPage />} />
        <Route path="jobs/:id" element={<ContributorJobDetailsPage />} />
        <Route path="submissions" element={<ContributorSubmissionsPage />} />
        <Route path="submit-resource" element={<TopicResourceSubmissionPage />} />
        <Route path="resources/:submissionId" element={<TopicResourceSubmissionPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
