import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    console.log('AuthCallback: Component mounted, current user:', user);
    console.log('AuthCallback: Current URL:', window.location.href);
    console.log('AuthCallback: URL hash:', window.location.hash);
    console.log('AuthCallback: URL search:', window.location.search);
    
    const handleCallback = async () => {
      try {
        console.log('AuthCallback: Processing OAuth callback...');
        
        // Try to process the OAuth callback
        try {
          await signInWithGoogle();
        } catch (error) {
          console.error('AuthCallback: OAuth processing error:', error);
        }
        
        // Wait for the auth state to be processed
        const timer = setTimeout(() => {
          console.log('AuthCallback: Timeout reached, checking user state...');
          if (user) {
            console.log('AuthCallback: User authenticated, redirecting to courses');
            navigate('/courses');
          } else {
            console.log('AuthCallback: No user found, redirecting to signup');
            navigate('/signup');
          }
          setIsProcessing(false);
        }, 2000);

        return () => clearTimeout(timer);
      } catch (error) {
        console.error('AuthCallback: Error processing callback:', error);
        navigate('/signup');
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [user, navigate, signInWithGoogle]);

  // If user is authenticated, redirect immediately
  useEffect(() => {
    if (user) {
      console.log('AuthCallback: User found, redirecting to courses');
      navigate('/courses');
    }
  }, [user, navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '18px',
      color: 'var(--vt-hokieStone-dark)',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div>Processing authentication...</div>
      {isProcessing && <div style={{ fontSize: '14px', color: 'var(--vt-hokieStone)' }}>
        Please wait while we complete your sign-in...
      </div>}
    </div>
  );
};

export default AuthCallback;
