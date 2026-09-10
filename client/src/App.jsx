import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import SkillProfile from "./pages/SkillProfile";
import Assessment from "./pages/Assessment";
import Opportunities from "./pages/Opportunities";
import Applications from "./pages/Applications";
import IndustryDashboard from "./pages/IndustryDashboard";
import MentorDashboard from "./pages/MentorDashboard";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-layout">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/opportunities" element={<Opportunities />} />

              {/* Student Protected Routes */}
              <Route
                path="/student"
                element={
                  <ProtectedRoute allowedRole="student">
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/skills"
                element={
                  <ProtectedRoute allowedRole="student">
                    <SkillProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assessment"
                element={
                  <ProtectedRoute allowedRole="student">
                    <Assessment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/applications"
                element={
                  <ProtectedRoute allowedRoles={['student', 'recruiter', 'admin']}>
                    <Applications />
                  </ProtectedRoute>
                }
              />

              {/* Recruiter Protected Routes (with legacy /industry redirect) */}
              <Route
                path="/recruiter"
                element={
                  <ProtectedRoute allowedRole="recruiter">
                    <IndustryDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/industry" element={<Navigate to="/recruiter" replace />} />

              {/* Mentor Protected Routes */}
              <Route
                path="/mentor"
                element={
                  <ProtectedRoute allowedRole="mentor">
                    <MentorDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Admin Protected Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;