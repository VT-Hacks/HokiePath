import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { MyTermProvider } from './contexts/MyTermContext';
import { CareerPlanProvider } from './contexts/CareerPlanContext';
import SignupPage from './pages/SignupPage';
import CoursesPage from './pages/CoursesPage';
import AIChatPage from './pages/AIChatPage';
import ProtectedRoute from './components/ProtectedRoute';
import AuthCallback from './components/AuthCallback';
import './App.css';

function App() {
  return (
    <AuthProvider>
            <MyTermProvider>
              <CareerPlanProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<Navigate to="/signup" replace />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route 
                path="/courses" 
                element={
                  <ProtectedRoute>
                    <CoursesPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/ai-chat" 
                element={
                  <ProtectedRoute>
                    <AIChatPage />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<Navigate to="/signup" replace />} />
            </Routes>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--vt-white)',
                  color: 'var(--vt-hokieStone-dark)',
                  border: '1px solid var(--vt-hokieStone)',
                },
              }}
            />
          </div>
        </Router>
              </CareerPlanProvider>
            </MyTermProvider>
    </AuthProvider>
  );
}

export default App;

