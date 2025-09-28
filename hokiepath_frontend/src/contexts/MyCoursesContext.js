import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabaseAPI } from '../services/supabaseAPI';

const MyCoursesContext = createContext();

export const useMyCourses = () => {
  const context = useContext(MyCoursesContext);
  if (!context) {
    throw new Error('useMyCourses must be used within a MyCoursesProvider');
  }
  return context;
};

export const MyCoursesProvider = ({ children }) => {
  const { user } = useAuth();
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadMyCourses = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const courses = await supabaseAPI.getMyCourses(user.id);
      setMyCourses(courses || []);
    } catch (error) {
      console.error('Error loading my courses:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load courses from database on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      loadMyCourses();
    } else {
      setMyCourses([]);
    }
  }, [user?.id, loadMyCourses]);

  const addCourse = async (course) => {
    if (!user?.id) {
      console.log('No user ID found');
      return { success: false, message: 'User not logged in.' };
    }

    console.log('Adding course:', course);
    console.log('Current user ID:', user.id);

    // Check if course is already added
    const isAlreadyAdded = myCourses.some(c => c.course_code === course.code);
    if (isAlreadyAdded) {
      console.log('Course already added:', course.code);
      return { success: false, message: `${course.code} is already in your courses!` };
    }

    try {
      const newCourse = {
        id: `${course.code}-${Date.now()}`,
        user_id: user.id,
        course_code: course.code,
        course_title: course.title,
        course_subject: course.subject || null,
        course_credits: typeof course.credits === 'object' ? course.credits?.credits || course.credits?.value || null : course.credits,
        course_description: course.description || null,
        similarity_score: course.similarity || null,
        added_at: new Date().toISOString()
      };

      console.log('Course object to save:', newCourse);

      // Save to database
      const savedCourse = await supabaseAPI.addMyCourse(newCourse);
      console.log('Course saved to database:', savedCourse);
      
      // Update local state
      setMyCourses(prev => [...prev, savedCourse]);
      
      return { success: true, message: `${course.code} added to My Courses!` };
    } catch (error) {
      console.error('Error adding course:', error);
      return { success: false, message: `Failed to add course: ${error.message}` };
    }
  };

  const removeCourse = async (courseId) => {
    if (!user?.id) return false;

    try {
      // Remove from database
      await supabaseAPI.removeMyCourse(courseId);
      
      // Update local state
      setMyCourses(prev => prev.filter(course => course.id !== courseId));
      
      return { success: true, message: 'Course removed from My Courses!' };
    } catch (error) {
      console.error('Error removing course:', error);
      return { success: false, message: 'Failed to remove course. Please try again.' };
    }
  };

  const isCourseAdded = (courseCode) => {
    return myCourses.some(course => course.course_code === courseCode);
  };

  const getCourseById = (courseId) => {
    return myCourses.find(course => course.id === courseId);
  };

  const value = {
    myCourses,
    loading,
    addCourse,
    removeCourse,
    isCourseAdded,
    getCourseById,
    loadMyCourses
  };

  return (
    <MyCoursesContext.Provider value={value}>
      {children}
    </MyCoursesContext.Provider>
  );
};
