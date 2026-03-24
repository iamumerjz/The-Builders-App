import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index.tsx";
import BrowsePage from "./pages/BrowsePage.tsx";
import ProProfilePage from "./pages/ProProfilePage.tsx";
import BookingPage from "./pages/BookingPage.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import SignUpPage from "./pages/SignUpPage.tsx";
import SignInPage from "./pages/SignInPage.tsx";
import ProPanelPage from "./pages/ProPanelPage.tsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.tsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.tsx";
import CheckoutPage from "./pages/CheckoutPage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import ProProfilePage2 from "./pages/ProProfilePage2.tsx";
import NotFound from "./pages/NotFound.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/browse" element={<BrowsePage />} />
            <Route path="/pro/:id" element={<ProProfilePage />} />
            <Route path="/book/:id" element={<ProtectedRoute role="client"><BookingPage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute role="client"><DashboardPage /></ProtectedRoute>} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/pro-panel" element={<ProtectedRoute role="pro"><ProPanelPage /></ProtectedRoute>} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/checkout" element={<ProtectedRoute role="client"><CheckoutPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute role="client"><ProfilePage /></ProtectedRoute>} />
            <Route path="/pro-profile" element={<ProtectedRoute role="pro"><ProProfilePage2 /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;