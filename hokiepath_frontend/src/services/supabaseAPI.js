import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client - use local instance
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseCourseAPI = {
  // Get all courses with filters
  getCourses: async (params = {}) => {
    try {
      console.log('Fetching courses from Supabase...', params);
      
      let query = supabase
        .from('courses')
        .select('*', { count: 'exact' })
        .order('code', { ascending: true });

      // Apply search filter
      if (params.search) {
        query = query.or(`title.ilike.%${params.search}%,code.ilike.%${params.search}%`);
      }

      // Apply subject filter
      if (params.subject) {
        query = query.eq('subject_code', params.subject);
      }

      // Apply pagination
      if (params.limit) {
        query = query.limit(params.limit);
      }
      
      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 30) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log(`Found ${data?.length || 0} courses in Supabase (Total: ${count})`);
      
      return {
        data: {
          courses: data || [],
          total: count || data?.length || 0,
          totalReviews: 0,
          averageRating: 0
        }
      };
    } catch (error) {
      console.error('Error fetching courses from Supabase:', error);
      throw error;
    }
  },

  // Get course details by code
  getCourseDetails: async (code) => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('code', code)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      return { data };
    } catch (error) {
      console.error('Error fetching course details:', error);
      throw error;
    }
  },

  // Get courses by subject
  getCoursesBySubject: async (subject) => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('subject_code', subject)
        .order('code', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      return { data: { courses: data || [] } };
    } catch (error) {
      console.error('Error fetching courses by subject:', error);
      throw error;
    }
  },

  // Get course reviews
  getCourseReviews: async (courseId) => {
    try {
      const { data, error } = await supabase
        .from('course_reviews')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      return { data: { reviews: data || [], stats: {} } };
    } catch (error) {
      console.error('Error fetching course reviews:', error);
      throw error;
    }
  },

  // Submit course review
  submitReview: async (courseId, reviewData) => {
    try {
      const { data, error } = await supabase
        .from('course_reviews')
        .insert([{
          course_id: courseId,
          ...reviewData,
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      return { data };
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  },

  // My Courses API functions
  async getMyCourses(userId) {
    try {
      const { data, error } = await supabase
        .from('user_my_courses')
        .select('*')
        .eq('user_id', userId)
        .order('added_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching my courses:', error);
      throw error;
    }
  },

  async addMyCourse(course) {
    try {
      console.log('SupabaseAPI: Adding course to database:', course);
      const { data, error } = await supabase
        .from('user_my_courses')
        .insert([course])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      console.log('SupabaseAPI: Course added successfully:', data);
      return data;
    } catch (error) {
      console.error('Error adding course to my courses:', error);
      throw error;
    }
  },

  async removeMyCourse(courseId) {
    try {
      const { error } = await supabase
        .from('user_my_courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing course from my courses:', error);
      throw error;
    }
  }
};

export default supabaseCourseAPI;
export { supabaseCourseAPI as supabaseAPI };
