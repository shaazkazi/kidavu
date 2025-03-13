import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GrowthTracker from './pages/GrowthTracker';
import MilestoneTracker from './pages/MilestoneTracker';
import VaccinationSchedule from './pages/VaccinationSchedule';
import Journal from './pages/Journal';
import Settings from './pages/Settings';
import Layout from './components/Layout';

// ProtectedRoute component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
                            <Route index element={<Dashboard />} />
              <Route path="growth" element={<GrowthTracker />} />
              <Route path="milestones" element={<MilestoneTracker />} />
              <Route path="vaccinations" element={<VaccinationSchedule />} />
              <Route path="journal" element={<Journal />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

