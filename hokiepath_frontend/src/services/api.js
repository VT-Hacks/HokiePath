import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout for AI processing (30 seconds)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const user = JSON.parse(localStorage.getItem('hokiepath_user') || '{}');
    if (user.id) {
      config.headers.Authorization = `Bearer ${user.id}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('hokiepath_user');
      window.location.href = '/signup';
    }
    
    // Log API errors for debugging
    if (error.response?.status === 404) {
      console.log('API endpoint not found (backend may not be running):', error.config?.url);
    }
    
    return Promise.reject(error);
  }
);

export const courseAPI = {
  // Get all courses with filters
  getCourses: (params = {}) => {
    console.log('Backend API call with params:', params);
    return api.get('/courses', { params });
  },

  // Get course details by code
  getCourseDetails: (code) => {
    return api.get(`/courses/${code}`);
  },

  // Get courses by subject
  getCoursesBySubject: (subject) => {
    return api.get(`/courses/${subject}/subject`);
  },

  // Get course reviews
  getCourseReviews: (courseId) => {
    return api.get(`/courses/${courseId}/reviews`);
  },

  // Submit course review
  submitReview: (courseId, reviewData) => {
    return api.post(`/courses/${courseId}/reviews`, reviewData);
  },

  // Get course recommendations
  getCourseRecommendations: (courseId, params = {}) => {
    return api.get(`/courses/${courseId}/recommendations`, { params });
  },

  // Get course AI summary (streaming)
  getCourseSummary: (subject, code, title) => {
    return api.get('/stream-course-summary', {
      params: { subject, code, title },
      responseType: 'stream'
    });
  },

  // Get course tags
  getCourseTags: (courseId) => {
    return api.get(`/courses/${courseId}/tags`);
  },

  // Add course tag
  addCourseTag: (courseId, tag) => {
    return api.post(`/courses/${courseId}/tags`, { tag });
  },

  // Get course statistics
  getCourseStatistics: (courseId) => {
    return api.get(`/courses/${courseId}/statistics`);
  }
};

export const aiAPI = {
  // AI chat functionality - Updated to use correct endpoint
  sendMessage: (message, userId) => {
    console.log('📡 Sending chat request to backend:', {
      endpoint: '/chat',
      payload: { user_id: userId, message },
      baseURL: api.defaults.baseURL
    });
    
    return api.post('/chat', { 
      user_id: userId,
      message: message
    });
  },
  
  // Course AI summary (streaming)
  getCourseSummary: (subject, code, title) => {
    return api.get('/stream-course-summary', {
      params: { subject, code, title },
      responseType: 'stream'
    });
  },
  
  // Get course suggestions using AI embeddings
  getCourseSuggestions: (courseId, params = {}) => {
    return api.get(`/courses/${courseId}/suggestions`, { params });
  }
};

// Term Course API
export const termCourseAPI = {
  // Add course to term
  addCourseToTerm: async (data) => {
    try {
      console.log('Adding course to term with data:', data);
      const response = await api.post('/careers/term-course', data);
      console.log('API response:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error adding course to term:', error);
      console.error('Error response:', error.response?.data);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to add course to term' 
      };
    }
  },

  // Get term courses for user
  getTermCourses: async (userId) => {
    try {
      const response = await api.get(`/careers/term-courses/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching term courses:', error);
      throw error;
    }
  },

  // Remove course from term
  removeCourseFromTerm: async (termCourseId) => {
    try {
      const response = await api.delete(`/careers/term-course/${termCourseId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error removing course from term:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to remove course from term' 
      };
    }
  }
};

// Career Plan API
export const careerPlanAPI = {
  // Generate career plans
  generateCareerPlans: async (userId) => {
    try {
      console.log('Generating career plans for user:', userId);
      const response = await api.post('/careers/generate', { user_id: userId }, {
        timeout: 120000 // 2 minutes timeout for career plan generation
      });
      console.log('Career plans generated successfully:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error generating career plans:', error);
      if (error.code === 'ECONNABORTED') {
        return { 
          success: false, 
          message: 'Career plan generation is taking longer than expected. Please try again.' 
        };
      }
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to generate career plans' 
      };
    }
  },

  // Get career plan flowchart
  getCareerPlanFlowchart: async (planId) => {
    try {
      const response = await api.get(`/careers/${planId}/flowchart`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching career plan flowchart:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to fetch career plan flowchart' 
      };
    }
  }
};

export default api;

