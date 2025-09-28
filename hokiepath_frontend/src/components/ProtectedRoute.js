import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading, debugAuth } = useAuth();

  // Debug auth state
  React.useEffect(() => {
    debugAuth();
  }, [user, loading, debugAuth]);

  console.log('ProtectedRoute: Checking authentication...', { 
    hasUser: !!user, 
    loading, 
    userId: user?.id 
  });

  if (loading) {
    console.log('ProtectedRoute: Still loading, showing loading screen');
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div className="loading"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute: No user found, redirecting to signup');
    return <Navigate to="/signup" replace />;
  }

  console.log('ProtectedRoute: User authenticated, rendering protected content');
  return children;
};

export default ProtectedRoute;