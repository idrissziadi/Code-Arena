import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip"; 
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AdminRoute } from "@/components/layout/AdminRoute";
import { Navbar } from "@/components/layout/Navbar";
import { AuthPage } from "@/components/auth/AuthPage";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Problems from "./pages/Problems";
import ProblemDetail from "./pages/ProblemDetail";
import Profile from "./pages/Profile";
import Contests from "./pages/Contests";
import Leaderboard from "./pages/Leaderboard";
import Solutions from "./pages/Solutions";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Favorites from "./pages/Favorites";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="codearena-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/problems"
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <Problems />
                  </ProtectedRoute>
                }
              />
              <Route path="/problems/:id" element={
                <ProtectedRoute>
                  <Navbar />
                  <ProblemDetail />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Navbar />
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/contests" element={
                <ProtectedRoute>
                  <Navbar />
                  <Contests />
                </ProtectedRoute>
              } />
              <Route path="/leaderboard" element={
                <ProtectedRoute>
                  <Navbar />
                  <Leaderboard />
                </ProtectedRoute>
              } />
              <Route path="/solutions" element={
                <ProtectedRoute>
                  <Navbar />
                  <Solutions />
                </ProtectedRoute>
              } />
              <Route path="/favorites" element={
                <ProtectedRoute>
                  <Navbar />
                  <Favorites />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Navbar />
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <AdminRoute>
                  <Navbar />
                  <Admin />
                </AdminRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
