import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import gsap from 'gsap';
import './SignupPage.css';

const SignupPage = () => {
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const waveRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    // Mouse movement effect for waves
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      
      mouseX.set(x);
      mouseY.set(y);

      // Update wave distortion based on mouse position
      if (waveRef.current) {
        gsap.to(waveRef.current, {
          '--mouse-x': x,
          '--mouse-y': y,
          duration: 1,
          ease: "power2.out"
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      console.log('SignupPage: User authenticated, redirecting to courses');
      navigate('/courses');
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      console.log('SignupPage: Starting Google sign-in...');
      setLoading(true);
      const result = await signInWithGoogle();
      
      console.log('SignupPage: Sign-in result:', result);
      
      // If we get a user object back (mock or real), redirect immediately
      if (result && result.id) {
        console.log('SignupPage: Authentication successful, redirecting to courses');
        navigate('/courses');
      }
      // Note: For real OAuth, user will be redirected to Google, then back to /courses automatically
    } catch (error) {
      console.error('SignupPage: Google Sign-In Error:', error);
      toast.error('Failed to sign in with Google. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="signup-page-clean">
      {/* Navigation */}
      <motion.nav 
        className="nav-bar"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="nav-logo">
          <img src="/VtLogo.png" alt="VT Logo" className="vt-logo" />
          <span>HokiePath</span>
        </div>
      </motion.nav>

      {/* Main Layout */}
      <div className="main-layout">
        {/* Full Screen Wavy Background */}
        <motion.div 
          className="left-side"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {/* Animated Wavy Gradient */}
          <div ref={waveRef} className="wavy-background">
            <div className="wave-layer wave-1"></div>
            <div className="wave-layer wave-2"></div>
            <div className="wave-layer wave-3"></div>
            <div className="wave-layer wave-4"></div>
          </div>
        </motion.div>

        {/* Content Container */}
        <div className="content-container">
          {/* Left Content */}
          <div className="left-content">
            <motion.h1 
              className="main-title"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              Discover Your
              <br />
              <span className="highlight">Perfect Path</span>
            </motion.h1>
            
            <motion.p 
              className="main-subtitle"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              AI-powered course discovery designed specifically for Virginia Tech students. 
              Find courses that align with your passions and career goals.
            </motion.p>
          </div>

          {/* Right Side - Signup Form */}
          <motion.div 
            className="right-side"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <div className="signup-form">
              <motion.h2 
                className="form-title"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                Join HokiePath
              </motion.h2>
              
              <motion.p 
                className="form-subtitle"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 1 }}
              >
                Start your journey to academic success
              </motion.p>

              <motion.button
                className="google-btn"
                onClick={handleGoogleSignIn}
                disabled={loading}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.2 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <div className="spinner" />
                ) : (
                  <>
                    <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </>
                )}
              </motion.button>

              <motion.div 
                className="form-footer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.4 }}
              >
                <p>By continuing, you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a></p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;