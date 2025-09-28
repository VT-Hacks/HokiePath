import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Initialize Supabase client with hosted instance - SINGLETON PATTERN
let supabaseInstance = null;

const getSupabaseClient = () => {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'http://127.0.0.1:54321';
    const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
    
    console.log('Supabase Configuration:', {
      url: supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      anonKeyLength: supabaseAnonKey?.length
    });
    
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
  }
  return supabaseInstance;
};

const supabase = getSupabaseClient();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: Initializing authentication...');
    
    // Check if we're in development mode (no Google OAuth configured)
    const isDevelopmentMode = !process.env.REACT_APP_GOOGLE_CLIENT_ID || 
                              process.env.REACT_APP_GOOGLE_CLIENT_ID === 'your_google_oauth_client_id_here';
    
    console.log('AuthProvider: Environment check:', {
      hasGoogleClientId: !!process.env.REACT_APP_GOOGLE_CLIENT_ID,
      googleClientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      isDevelopmentMode,
      allEnvVars: Object.keys(process.env).filter(key => key.startsWith('REACT_APP_')),
      supabaseUrl: process.env.REACT_APP_SUPABASE_URL,
      supabaseKey: process.env.REACT_APP_SUPABASE_ANON_KEY ? 'SET' : 'NOT_SET'
    });
    
    // Use development mode if no Google OAuth is configured
    if (isDevelopmentMode) {
      console.log('AuthProvider: Development mode - checking for existing user');
      
      // Check if there's already a user in localStorage
      const existingUser = localStorage.getItem('hokiepath_user');
      
      if (existingUser) {
        console.log('AuthProvider: Found existing user in localStorage');
        try {
          const userData = JSON.parse(existingUser);
          setUser(userData);
          setLoading(false);
          return;
        } catch (error) {
          console.error('AuthProvider: Error parsing user data:', error);
          localStorage.removeItem('hokiepath_user');
        }
      }
      
      // No existing user, set loading to false and let user sign in
      console.log('AuthProvider: No existing user, user needs to sign in');
      setUser(null);
      setLoading(false);
      return;
    }
    
    // Real Supabase authentication - only use development mode if no OAuth configured
    
    // Real Supabase authentication
    console.log('AuthProvider: Setting up real Supabase authentication');
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('AuthProvider: Session error:', error);
        } else if (session?.user) {
          console.log('AuthProvider: Found existing session for user:', session.user.email);
          // Extract Google OAuth data from existing session
          const userProfile = {
            id: session.user.id,
            name: session.user.user_metadata.full_name || session.user.email,
            email: session.user.email,
            avatar: session.user.user_metadata.avatar_url || session.user.user_metadata.picture,
            firstName: session.user.user_metadata.given_name, // Google first name
            lastName: session.user.user_metadata.family_name  // Google last name
          };
          console.log('AuthProvider: Existing Google OAuth session:', userProfile.firstName, userProfile.lastName);
          setUser(userProfile);
        }
      } catch (error) {
        console.error('AuthProvider: Initial session error:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthProvider: Auth state change:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Extract Google OAuth data
        const userProfile = {
          id: session.user.id,
          name: session.user.user_metadata.full_name || session.user.email,
          email: session.user.email,
          avatar: session.user.user_metadata.avatar_url || session.user.user_metadata.picture,
          firstName: session.user.user_metadata.given_name, // Google first name
          lastName: session.user.user_metadata.family_name  // Google last name
        };
        console.log('AuthProvider: Google OAuth user signed in:', userProfile.firstName, userProfile.lastName);
        setUser(userProfile);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED') {
        // Keep the user logged in
        setLoading(false);
      }
    });

    return () => {
      console.log('AuthProvider: Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      console.log('AuthProvider: Starting Google sign-in...');
      setLoading(true);
      
      // Check if we're in development mode
      const isDevelopmentMode = !process.env.REACT_APP_GOOGLE_CLIENT_ID || 
                                process.env.REACT_APP_GOOGLE_CLIENT_ID === 'your_google_oauth_client_id_here';
      
      console.log('AuthProvider: Environment check:', {
        hasGoogleClientId: !!process.env.REACT_APP_GOOGLE_CLIENT_ID,
        googleClientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        isDevelopmentMode,
        allEnvVars: Object.keys(process.env).filter(key => key.startsWith('REACT_APP_'))
      });
      
      // Use development mode if no Google OAuth is configured
      if (isDevelopmentMode) {
        console.log('AuthProvider: Development mode - using mock authentication');
        // For development, use mock authentication directly
        const mockUser = {
          id: '550e8400-e29b-41d4-a716-446655440000', // Fixed UUID for development
          name: 'John Smith',
          email: 'john.smith@vt.edu',
          avatar: 'https://ui-avatars.com/api/?name=John+Smith&background=861F41&color=fff&size=128',
          firstName: 'John',
          lastName: 'Smith'
        };
        
        // Simulate a brief loading time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setUser(mockUser);
        localStorage.setItem('hokiepath_user', JSON.stringify(mockUser));
        toast.success(`Welcome to HokiePath, ${mockUser.firstName}!`);
        return mockUser;
      }
      
      // If we reach here, OAuth is not properly configured
      console.error('AuthProvider: Google OAuth not properly configured');
      throw new Error('Google OAuth is not properly configured. Please set REACT_APP_GOOGLE_CLIENT_ID environment variable.');
      
      // Real Supabase OAuth
      console.log('AuthProvider: Initiating real Google OAuth...');
      
      try {
        // Check if we're on the OAuth callback page
        if (window.location.pathname === '/auth/callback') {
          console.log('AuthProvider: OAuth callback detected, checking for session...');
          
          // First try to get existing session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('AuthProvider: Session error:', sessionError);
            throw sessionError;
          }
          
          if (session?.user) {
            console.log('AuthProvider: OAuth session found:', session.user);
            const userData = {
              id: session.user.id,
              name: session.user.user_metadata?.full_name || session.user.email,
              email: session.user.email,
              avatar: session.user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.user_metadata?.full_name || session.user.email)}&background=861F41&color=fff&size=128`,
              firstName: session.user.user_metadata?.given_name || session.user.user_metadata?.full_name?.split(' ')[0] || 'User',
              lastName: session.user.user_metadata?.family_name || session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || ''
            };
            
            setUser(userData);
            localStorage.setItem('hokiepath_user', JSON.stringify(userData));
            toast.success(`Welcome to HokiePath, ${userData.firstName}!`);
            return userData;
          }
          
          // If no session, try to exchange code
          console.log('AuthProvider: No session found, trying to exchange code...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          
          if (error) {
            console.error('AuthProvider: Code exchange error:', error);
            throw error;
          }
          
          if (data?.session?.user) {
            console.log('AuthProvider: OAuth session created:', data.session.user);
            const userData = {
              id: data.session.user.id,
              name: data.session.user.user_metadata?.full_name || data.session.user.email,
              email: data.session.user.email,
              avatar: data.session.user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.session.user.user_metadata?.full_name || data.session.user.email)}&background=861F41&color=fff&size=128`,
              firstName: data.session.user.user_metadata?.given_name || data.session.user.user_metadata?.full_name?.split(' ')[0] || 'User',
              lastName: data.session.user.user_metadata?.family_name || data.session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || ''
            };
            
            setUser(userData);
            localStorage.setItem('hokiepath_user', JSON.stringify(userData));
            toast.success(`Welcome to HokiePath, ${userData.firstName}!`);
            return userData;
          }
        }
        
        // Check if we already have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('AuthProvider: Session error:', sessionError);
          throw sessionError;
        }
        
        if (session?.user) {
          console.log('AuthProvider: Existing session found:', session.user);
          const userData = {
            id: session.user.id,
            name: session.user.user_metadata?.full_name || session.user.email,
            email: session.user.email,
            avatar: session.user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.user_metadata?.full_name || session.user.email)}&background=861F41&color=fff&size=128`,
            firstName: session.user.user_metadata?.given_name || session.user.user_metadata?.full_name?.split(' ')[0] || 'User',
            lastName: session.user.user_metadata?.family_name || session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || ''
          };
          
          setUser(userData);
          localStorage.setItem('hokiepath_user', JSON.stringify(userData));
          toast.success(`Welcome to HokiePath, ${userData.firstName}!`);
          return userData;
        }
        
        // No session found, initiate OAuth
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            }
          }
        });

        if (error) {
          console.error('AuthProvider: OAuth error:', error);
          throw error;
        }

        console.log('AuthProvider: OAuth initiated successfully');
        return data;
      } catch (oauthError) {
        console.error('AuthProvider: OAuth error:', oauthError);
        throw oauthError;
      }
    } catch (error) {
      console.error('AuthProvider: Authentication error:', error);
      toast.error('Failed to sign in. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('AuthProvider: Signing out...');
      
      // Clear user state first
      console.log('AuthProvider: Clearing user state...');
      setUser(null);
      localStorage.removeItem('hokiepath_user');
      
      // Verify the user state is cleared
      console.log('AuthProvider: User state cleared, current user:', user);
      console.log('AuthProvider: localStorage cleared, remaining:', localStorage.getItem('hokiepath_user'));
      
      // Check if we're in development mode
      const isDevelopmentMode = !process.env.REACT_APP_GOOGLE_CLIENT_ID || 
                                process.env.REACT_APP_GOOGLE_CLIENT_ID === 'your_google_oauth_client_id_here';
      
      console.log('AuthProvider: Development mode check:', { isDevelopmentMode });
      
      if (isDevelopmentMode) {
        console.log('AuthProvider: Development mode - signed out successfully');
        toast.success('Signed out successfully');
        
        // Use a single, reliable redirect method
        console.log('AuthProvider: Redirecting to signup page...');
        setTimeout(() => {
          window.location.href = '/signup';
        }, 100);
        
        return;
      }
      
      // Real Supabase signOut
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('AuthProvider: Supabase signOut error:', error);
        // Even if Supabase signOut fails, we've already cleared local state
        toast.success('Signed out successfully');
      } else {
        toast.success('Signed out successfully');
      }
      
      // Redirect after successful signout
      console.log('AuthProvider: Redirecting to signup page...');
      setTimeout(() => {
        window.location.href = '/signup';
      }, 100);
      
    } catch (error) {
      console.error('AuthProvider: Sign out error:', error);
      // Even if there's an error, we've cleared the local state
      toast.success('Signed out successfully');
      console.log('AuthProvider: Redirecting to signup page after error...');
      setTimeout(() => {
        window.location.href = '/signup';
      }, 100);
    }
  };

  // Debug function to check auth state
  const debugAuth = () => {
    console.log('AuthProvider: Debug info:', {
      user: user,
      loading: loading,
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      isDevelopmentMode: !process.env.REACT_APP_GOOGLE_CLIENT_ID || 
                        process.env.REACT_APP_GOOGLE_CLIENT_ID === 'your_google_oauth_client_id_here'
    });
  };

  const value = {
    user,
    signInWithGoogle,
    signOut,
    loading,
    supabase,
    debugAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};