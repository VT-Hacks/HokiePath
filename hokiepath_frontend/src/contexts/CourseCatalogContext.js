import React, { createContext, useContext, useState, useEffect } from 'react';

const CourseCatalogContext = createContext();

export const useCourseCatalog = () => {
  const context = useContext(CourseCatalogContext);
  if (!context) {
    throw new Error('useCourseCatalog must be used within a CourseCatalogProvider');
  }
  return context;
};

export const CourseCatalogProvider = ({ children }) => {
  const [catalogCourses, setCatalogCourses] = useState([]);

  // Load catalog from localStorage on mount
  useEffect(() => {
    const savedCatalog = localStorage.getItem('hokiepath_course_catalog');
    if (savedCatalog) {
      try {
        setCatalogCourses(JSON.parse(savedCatalog));
      } catch (error) {
        console.error('Error loading course catalog from localStorage:', error);
        setCatalogCourses([]);
      }
    }
  }, []);

  // Save catalog to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('hokiepath_course_catalog', JSON.stringify(catalogCourses));
  }, [catalogCourses]);

  const addToCatalog = (course) => {
    setCatalogCourses(prev => {
      // Check if course is already in catalog
      const isAlreadyAdded = prev.some(c => c.id === course.id);
      if (isAlreadyAdded) {
        return prev; // Don't add duplicates
      }
      return [...prev, course];
    });
  };

  const removeFromCatalog = (courseId) => {
    setCatalogCourses(prev => prev.filter(course => course.id !== courseId));
  };

  const toggleCourseInCatalog = (course) => {
    const isInCatalog = catalogCourses.some(c => c.id === course.id);
    if (isInCatalog) {
      removeFromCatalog(course.id);
    } else {
      addToCatalog(course);
    }
  };

  const isCourseInCatalog = (courseId) => {
    return catalogCourses.some(course => course.id === courseId);
  };

  const clearCatalog = () => {
    setCatalogCourses([]);
  };

  const getCatalogCount = () => {
    return catalogCourses.length;
  };

  const value = {
    catalogCourses,
    addToCatalog,
    removeFromCatalog,
    toggleCourseInCatalog,
    isCourseInCatalog,
    clearCatalog,
    getCatalogCount
  };

  return (
    <CourseCatalogContext.Provider value={value}>
      {children}
    </CourseCatalogContext.Provider>
  );
};
