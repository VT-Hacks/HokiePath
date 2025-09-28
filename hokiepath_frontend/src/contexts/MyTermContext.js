import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { termCourseAPI } from '../services/api';

const MyTermContext = createContext();

export const useMyTerm = () => {
  const context = useContext(MyTermContext);
  if (!context) {
    throw new Error('useMyTerm must be used within a MyTermProvider');
  }
  return context;
};

export const MyTermProvider = ({ children }) => {
  const { user } = useAuth();
  const [termCourses, setTermCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadTermCourses = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const data = await termCourseAPI.getTermCourses(user.id);
      setTermCourses(data || []);
    } catch (error) {
      console.error('Error loading term courses:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadTermCourses();
    } else {
      setTermCourses([]);
    }
  }, [user?.id, loadTermCourses]);

  const addCourseToTerm = async (course, term) => {
    if (!user?.id) return { success: false, message: 'User not logged in.' };

    console.log('MyTermContext: Adding course to term:', { course, term, userId: user.id });

    try {
      const payload = {
        user_id: user.id,
        course_id: course.course_id || course.id,
        term: term
      };
      
      console.log('MyTermContext: Sending payload:', payload);
      
      const result = await termCourseAPI.addCourseToTerm(payload);
      
      console.log('MyTermContext: API result:', result);

      if (result.success) {
        // Reload term courses to get updated data
        await loadTermCourses();
        return { success: true, message: `${course.code} added to ${term}!` };
      } else {
        return { success: false, message: result.message || 'Failed to add course to term.' };
      }
    } catch (error) {
      console.error('Error adding course to term:', error);
      return { success: false, message: `Failed to add ${course.code} to ${term}.` };
    }
  };

  const removeCourseFromTerm = async (termCourseId) => {
    if (!user?.id) return { success: false, message: 'User not logged in.' };

    try {
      const result = await termCourseAPI.removeCourseFromTerm(termCourseId);
      
      if (result.success) {
        // Reload term courses to get updated data
        await loadTermCourses();
        return { success: true, message: 'Course removed from term!' };
      } else {
        return { success: false, message: result.message || 'Failed to remove course from term.' };
      }
    } catch (error) {
      console.error('Error removing course from term:', error);
      return { success: false, message: 'Failed to remove course from term.' };
    }
  };

  const isCourseInTerm = (courseId, term) => {
    return termCourses.some(termData => 
      termData.term === term && 
      termData.courses.some(course => course.course_id === courseId)
    );
  };

  const getAvailableTerms = () => {
    return [
      'Fall 2025',
      'Spring 2026', 
      'Summer 2026',
      'Fall 2026',
      'Spring 2027',
      'Summer 2027'
    ];
  };

  const getTotalCoursesCount = () => {
    return termCourses.reduce((total, termData) => total + termData.courses.length, 0);
  };

  const contextValue = {
    termCourses,
    loading,
    addCourseToTerm,
    removeCourseFromTerm,
    isCourseInTerm,
    getAvailableTerms,
    getTotalCoursesCount,
    loadTermCourses
  };

  return (
    <MyTermContext.Provider value={contextValue}>
      {children}
    </MyTermContext.Provider>
  );
};
