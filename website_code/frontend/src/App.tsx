import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import OTPPage from "./pages/OTPPage";
import DashboardLayout from "./components/DashboardLayout";
import AdminLayout from "./components/AdminLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import UploadVideoPage from "./pages/dashboard/UploadVideoPage";
import LiveCameraPage from "./pages/dashboard/LiveCameraPage";
import GaitProfilePage from "./pages/dashboard/GaitProfilePage";
import GalleryDatabasePage from "./pages/dashboard/GalleryDatabasePage";
import ReportsPage from "./pages/dashboard/ReportsPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import AdminPage from "./pages/dashboard/AdminPage";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/otp" element={<OTPPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="upload" element={<UploadVideoPage />} />
            <Route path="live" element={<LiveCameraPage />} />
            <Route path="profiles" element={<GaitProfilePage />} />
            <Route path="gallery" element={<GalleryDatabasePage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Admin routes group */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminPage view="dashboard" />} />
            <Route path="users" element={<AdminPage view="users" />} />
            <Route path="settings" element={<AdminPage view="settings" />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
