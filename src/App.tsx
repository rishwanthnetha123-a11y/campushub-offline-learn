import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AppLayout } from "./components/AppLayout";
import HomePage from "./pages/HomePage";
import VideosPage from "./pages/VideosPage";
import VideoDetailPage from "./pages/VideoDetailPage";
import ResourcesPage from "./pages/ResourcesPage";
import ResourceDetailPage from "./pages/ResourceDetailPage";
import ProgressPage from "./pages/ProgressPage";
import DownloadsPage from "./pages/DownloadsPage";
import AuthPage from "./pages/AuthPage";
import AdminPage from "./pages/AdminPage";
import DoubtSolverPage from "./pages/DoubtSolverPage";
import SupportPage from "./pages/SupportPage";
import StudyPlannerPage from "./pages/StudyPlannerPage";
import ShareResourcesPage from "./pages/ShareResourcesPage";
import FacultyDashboardPage from "./pages/FacultyDashboardPage";
import FacultyClassWorkspacePage from "./pages/FacultyClassWorkspacePage";
import HodDashboardPage from "./pages/HodDashboardPage";
import HodSubjectsPage from "./pages/HodSubjectsPage";
import HodAssignFacultyPage from "./pages/HodAssignFacultyPage";
import HodSchedulePage from "./pages/HodSchedulePage";
import HodAnalyticsPage from "./pages/HodAnalyticsPage";
import HodStudentsPage from "./pages/HodStudentsPage";
import AcceptInvitePage from "./pages/AcceptInvitePage";
import StudentDashboardPage from "./pages/StudentDashboardPage";
import StudentProfilePage from "./pages/StudentProfilePage";
import HodVideosPage from "./pages/HodVideosPage";
import FacultyVideosPage from "./pages/FacultyVideosPage";
import FacultyAnalyticsPage from "./pages/FacultyAnalyticsPage";
import NoticesPage from "./pages/NoticesPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import StudentExamPage from "./pages/StudentExamPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/accept-invite" element={<AcceptInvitePage />} />
              {/* HOD routes */}
              <Route path="/hod" element={<HodDashboardPage />} />
              <Route path="/hod/subjects" element={<HodSubjectsPage />} />
              <Route path="/hod/assign-faculty" element={<HodAssignFacultyPage />} />
              <Route path="/hod/schedule" element={<HodSchedulePage />} />
              <Route path="/hod/students" element={<HodStudentsPage />} />
              <Route path="/hod/analytics" element={<HodAnalyticsPage />} />
              <Route path="/hod/videos" element={<HodVideosPage />} />
              {/* Faculty routes */}
              <Route path="/faculty" element={<FacultyDashboardPage />} />
              <Route path="/faculty/class/:classId" element={<FacultyClassWorkspacePage />} />
              <Route path="/faculty/videos" element={<FacultyVideosPage />} />
              <Route path="/faculty/analytics" element={<FacultyAnalyticsPage />} />
              <Route path="/*" element={
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/videos" element={<VideosPage />} />
                    <Route path="/video/:id" element={<VideoDetailPage />} />
                    <Route path="/resources" element={<ResourcesPage />} />
                    <Route path="/resource/:id" element={<ResourceDetailPage />} />
                    <Route path="/progress" element={<ProgressPage />} />
                    <Route path="/downloads" element={<DownloadsPage />} />
                    <Route path="/ask" element={<DoubtSolverPage />} />
                    <Route path="/study-plan" element={<StudyPlannerPage />} />
                    <Route path="/share" element={<ShareResourcesPage />} />
                    <Route path="/support" element={<SupportPage />} />
                    <Route path="/my-academics" element={<StudentDashboardPage />} />
                    <Route path="/profile" element={<StudentProfilePage />} />
                    <Route path="/notices" element={<NoticesPage />} />
                    <Route path="/exams" element={<StudentExamPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AppLayout>
              } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </ThemeProvider>
  </QueryClientProvider>
);

export default App;
