import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMyTerm } from '../contexts/MyTermContext';
import { courseAPI } from '../services/api';
import { supabaseCourseAPI } from '../services/supabaseAPI';
import { Search, Filter, User, LogOut, BookOpen, Star, Users, Clock, Plus } from 'lucide-react';
import CourseCard from '../components/CourseCard';
import CourseModal from '../components/CourseModal';
import toast from 'react-hot-toast';
import './CoursesPage.css';

const CoursesPage = () => {
  const { user, signOut } = useAuth();
  const { termCourses, addCourseToTerm, removeCourseFromTerm, isCourseInTerm, getAvailableTerms, getTotalCoursesCount } = useMyTerm();

  const [showTermModal, setShowTermModal] = useState(false);
  const [selectedCourseForTerm, setSelectedCourseForTerm] = useState(null);

  const handleAddToTerm = (course) => {
    setSelectedCourseForTerm(course);
    setShowTermModal(true);
  };

  const handleTermSelection = async (term) => {
    if (!selectedCourseForTerm) return;

    const result = await addCourseToTerm(selectedCourseForTerm, term);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    setShowTermModal(false);
    setSelectedCourseForTerm(null);
  };

  const handleRemoveFromTerm = async (course) => {
    // Find the term course entry to remove
    for (const termData of termCourses) {
      const termCourse = termData.courses.find(c => c.course_id === course.id);
      if (termCourse) {
        const result = await removeCourseFromTerm(termCourse.id);
        if (result.success) {
          toast.success(`${course.code} removed from ${termData.term}`);
        } else {
          toast.error(result.message);
        }
        break;
      }
    }
  };
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalReviews: 0,
    averageRating: 0
  });

  // Function to refresh stats after review submission
  const refreshStats = async () => {
    try {
      console.log('Refreshing stats after review submission...');
      // For now, just increment the total reviews count locally
      setStats(prevStats => ({
        ...prevStats,
        totalReviews: prevStats.totalReviews + 1
      }));
    } catch (error) {
      console.error('Error refreshing stats:', error);
    }
  };
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [coursesPerPage] = useState(70); // Show 70 courses per page (2 more rows)
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    console.log('Component mounted, calling fetchCourses...');
    fetchCourses();
  }, []);

  // Refetch courses when page changes (for real API calls)
  useEffect(() => {
    if (currentPage > 1) {
      fetchCourses();
    }
  }, [currentPage]);

  useEffect(() => {
    if (courses.length > 0) {
      fetchSubjects();
    }
  }, [courses]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserDropdown && !event.target.closest('.user-menu')) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Reset to page 1 when search or filter changes and fetch from API
      setCurrentPage(1);
      // Always fetch from API when search/filter changes
      fetchCourses();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedSubject]);

  // Remove client-side filtering - use API filtering only

  const fetchCourses = async () => {
    setLoading(true);
    
    // Prepare search and filter parameters
    const apiParams = {
      limit: coursesPerPage,
      offset: (currentPage - 1) * coursesPerPage
    };
    
    // Add search parameter if user is searching
    if (searchTerm) {
      apiParams.search = searchTerm;
    }
    
    // Add subject filter if user has selected a subject
    if (selectedSubject) {
      apiParams.subject = selectedSubject;
    }
    
    // First try Supabase to get real data
    try {
      console.log('Trying to fetch courses from Supabase...', apiParams);
      const response = await supabaseCourseAPI.getCourses(apiParams);
      const coursesData = response.data.courses || [];
      
      if (coursesData.length > 0) {
        console.log('Supabase courses loaded:', coursesData.length);
        setCourses(coursesData);
        setFilteredCourses(coursesData); // Set filtered courses directly for API results
        const totalCourses = response.data.total || coursesData.length;
        const calculatedPages = Math.ceil(totalCourses / coursesPerPage);
        setTotalPages(calculatedPages);
        console.log('Supabase pagination set:', { totalCourses, calculatedPages, coursesPerPage, currentPage });
        setStats({
          totalCourses: totalCourses,
          totalReviews: response.data.totalReviews || 0,
          averageRating: response.data.averageRating || 0
        });
        setLoading(false);
        return;
      }
    } catch (supabaseError) {
      console.log('Supabase not available, trying backend...');
    }
    
    // If Supabase fails, try backend
    try {
      const response = await courseAPI.getCourses(apiParams);
      const coursesData = response.data.courses || response.data.data || response.data || [];
      setCourses(coursesData);
      setFilteredCourses(coursesData); // Set filtered courses directly for API results
      const totalCourses = response.data.total || coursesData.length;
      const calculatedPages = Math.ceil(totalCourses / coursesPerPage);
      setTotalPages(calculatedPages);
      console.log('Backend pagination set:', { totalCourses, calculatedPages, coursesPerPage, currentPage });
      setStats({
        totalCourses: totalCourses,
        totalReviews: response.data.totalReviews || 0,
        averageRating: response.data.averageRating || 0
      });
      setLoading(false);
      return;
    } catch (backendError) {
      console.log('Backend not available, using mock data instead');
    }
    
    // Fallback to mock data if both APIs fail
    console.log('Using mock data as fallback...');
    const mockCourses = [
        {
          id: '203d1088-a17b-4bfe-9363-7ed3bc0c9040',
          code: 'CS 2114',
          title: 'Software Design and Data Structures',
          subject_code: 'CS',
          description: 'A programming-intensive exploration of software design concepts and implementation techniques.',
          credits: 3,
          prerequisites: 'CS 1114 or CS 1044',
        },
        {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          code: 'ECE 2074',
          title: 'Electric Circuit Analysis',
          subject_code: 'ECE',
          description: 'Basic electric circuit analysis techniques including Kirchhoffs laws.',
          credits: 3,
          prerequisites: 'MATH 1226, PHYS 2305',
        },
        {
          id: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
          code: 'MATH 1226',
          title: 'Calculus of a Single Variable',
          subject_code: 'MATH',
          description: 'Limits, continuity, derivatives, and integrals of functions of one variable.',
          credits: 4,
          prerequisites: 'MATH 1225 or equivalent',
        },
        {
          id: '4',
          code: 'PHYS 2305',
          title: 'Foundations of Physics',
          subject_code: 'PHYS',
          description: 'Mechanics, waves, and thermodynamics with calculus.',
          credits: 4,
          prerequisites: 'MATH 1226',
        },
        {
          id: '5',
          code: 'ENGL 1105',
          title: 'First-Year Writing',
          subject_code: 'ENGL',
          description: 'Introduction to academic writing and research methods.',
          credits: 3,
          prerequisites: 'None',
        },
        {
          id: '6',
          code: 'CS 1114',
          title: 'Introduction to Software Design',
          subject_code: 'CS',
          description: 'Introduction to programming concepts and software development.',
          credits: 3,
          prerequisites: 'None',
        },
        {
          id: '7',
          code: 'ECE 2004',
          title: 'Electrical Engineering Fundamentals',
          subject_code: 'ECE',
          description: 'Basic concepts in electrical engineering and circuit analysis.',
          credits: 3,
          prerequisites: 'MATH 1226, PHYS 2305',
        },
        {
          id: '8',
          code: 'MATH 1225',
          title: 'Calculus of a Single Variable',
          subject_code: 'MATH',
          description: 'Pre-calculus and introduction to calculus concepts.',
          credits: 4,
          prerequisites: 'MATH 1014 or equivalent',
        },
        {
          id: '9',
          code: 'CHEM 1035',
          title: 'General Chemistry',
          subject_code: 'CHEM',
          description: 'Fundamental principles of chemistry including atomic structure and bonding.',
          credits: 3,
          prerequisites: 'MATH 1014',
        },
        {
          id: '10',
          code: 'BIOL 1105',
          title: 'Principles of Biology',
          subject_code: 'BIOL',
          description: 'Introduction to biological concepts and scientific methodology.',
          credits: 3,
          prerequisites: 'None',
        },
        {
          id: '11',
          code: 'HIST 1014',
          title: 'World History',
          subject_code: 'HIST',
          description: 'Survey of world history from ancient times to present.',
          credits: 3,
          prerequisites: 'None',
        },
        {
          id: '12',
          code: 'PSYC 2004',
          title: 'Introduction to Psychology',
          subject_code: 'PSYC',
          description: 'Survey of psychological principles and research methods.',
          credits: 3,
          prerequisites: 'None',
        },
        {
          id: '13',
          code: 'ECON 2005',
          title: 'Principles of Economics',
          subject_code: 'ECON',
          description: 'Introduction to microeconomic and macroeconomic principles.',
          credits: 3,
          prerequisites: 'MATH 1014',
        },
        {
          id: '14',
          code: 'BUS 2004',
          title: 'Introduction to Business',
          subject_code: 'BUS',
          description: 'Overview of business concepts and practices.',
          credits: 3,
          prerequisites: 'None',
        },
        {
          id: '15',
          code: 'ARCH 1015',
          title: 'Introduction to Architecture',
          subject_code: 'ARCH',
          description: 'Fundamental concepts in architectural design and history.',
          credits: 3,
          prerequisites: 'None',
        },
        {
          id: '16',
          code: 'ART 1016',
          title: 'Introduction to Art',
          subject_code: 'ART',
          description: 'Survey of art history and visual arts principles.',
          credits: 3,
          prerequisites: 'None',
        },
        {
          id: '17',
          code: 'MUS 1017',
          title: 'Music Appreciation',
          subject_code: 'MUS',
          description: 'Introduction to music theory and history.',
          credits: 3,
          prerequisites: 'None',
        },
        {
          id: '18',
          code: 'THEA 1018',
          title: 'Introduction to Theatre',
          subject_code: 'THEA',
          description: 'Fundamentals of theatrical performance and production.',
          credits: 3,
          prerequisites: 'None',
        },
        {
          id: '19',
          code: 'CS 3214',
          title: 'Computer Systems',
          subject_code: 'CS',
          description: 'Computer organization, assembly language, and systems programming.',
          credits: 3,
          prerequisites: 'CS 2114',
        },
        {
          id: '20',
          code: 'ECE 2574',
          title: 'Data Structures and Algorithms',
          subject_code: 'ECE',
          description: 'Advanced data structures and algorithm analysis.',
          credits: 3,
          prerequisites: 'ECE 2004',
        },
        {
          id: '21',
          code: 'MATH 2225',
          title: 'Multivariable Calculus',
          subject_code: 'MATH',
          description: 'Calculus of functions of several variables.',
          credits: 4,
          prerequisites: 'MATH 1226',
        },
        {
          id: '22',
          code: 'PHYS 2306',
          title: 'Foundations of Physics II',
          subject_code: 'PHYS',
          description: 'Electricity, magnetism, and optics.',
          credits: 4,
          prerequisites: 'PHYS 2305',
        },
        {
          id: '23',
          code: 'ENGL 1106',
          title: 'First-Year Writing II',
          subject_code: 'ENGL',
          description: 'Advanced academic writing and research.',
          credits: 3,
          prerequisites: 'ENGL 1105',
        },
        {
          id: '24',
          code: 'CHEM 1036',
          title: 'General Chemistry II',
          subject_code: 'CHEM',
          description: 'Advanced chemistry principles and laboratory work.',
          credits: 3,
          prerequisites: 'CHEM 1035',
        },
        {
          id: '25',
          code: 'BIOL 1106',
          title: 'Principles of Biology II',
          subject_code: 'BIOL',
          description: 'Advanced biological concepts and evolution.',
          credits: 3,
          prerequisites: 'BIOL 1105',
        },
        {
          id: '26',
          code: 'HIST 1015',
          title: 'American History',
          subject_code: 'HIST',
          description: 'Survey of American history from colonial times to present.',
          credits: 3,
          prerequisites: 'None',
        },
        {
          id: '27',
          code: 'PSYC 2005',
          title: 'Developmental Psychology',
          subject_code: 'PSYC',
          description: 'Human development across the lifespan.',
          credits: 3,
          prerequisites: 'PSYC 2004',
        },
        {
          id: '28',
          code: 'ECON 2006',
          title: 'Microeconomics',
          subject_code: 'ECON',
          description: 'Individual and firm behavior in markets.',
          credits: 3,
          prerequisites: 'ECON 2005',
        },
        {
          id: '29',
          code: 'BUS 2005',
          title: 'Marketing Principles',
          subject_code: 'BUS',
          description: 'Fundamentals of marketing strategy and consumer behavior.',
          credits: 3,
          prerequisites: 'BUS 2004',
        },
        {
          id: '30',
          code: 'ARCH 1016',
          title: 'Architectural Design Studio',
          subject_code: 'ARCH',
          description: 'Hands-on architectural design and drawing.',
          credits: 4,
          prerequisites: 'ARCH 1015',
        },
        {
          id: '31',
          code: 'CS 2505',
          title: 'Introduction to Computer Organization',
          subject_code: 'CS',
          description: 'Computer organization and assembly language programming.',
          credits: 3,
          prerequisites: 'CS 1114',
        },
        {
          id: '32',
          code: 'ECE 2504',
          title: 'Digital Design',
          subject_code: 'ECE',
          description: 'Digital logic design and computer architecture.',
          credits: 3,
          prerequisites: 'ECE 2004',
        },
        {
          id: '33',
          code: 'MATH 2405',
          title: 'Linear Algebra',
          subject_code: 'MATH',
          description: 'Vector spaces, linear transformations, and eigenvalues.',
          credits: 3,
          prerequisites: 'MATH 1226',
        },
        {
          id: '34',
          code: 'PHYS 2405',
          title: 'Modern Physics',
          subject_code: 'PHYS',
          description: 'Introduction to quantum mechanics and relativity.',
          credits: 3,
          prerequisites: 'PHYS 2306',
        },
        {
          id: '35',
          code: 'ENGL 2505',
          title: 'Technical Writing',
          subject_code: 'ENGL',
          description: 'Professional and technical communication.',
          credits: 3,
          prerequisites: 'ENGL 1106',
        },
        {
          id: '36',
          code: 'CHEM 2505',
          title: 'Organic Chemistry',
          subject_code: 'CHEM',
          description: 'Structure and reactions of organic compounds.',
          credits: 3,
          prerequisites: 'CHEM 1036',
        },
        {
          id: '37',
          code: 'BIOL 2505',
          title: 'Cell Biology',
          subject_code: 'BIOL',
          description: 'Structure and function of cells.',
          credits: 3,
          prerequisites: 'BIOL 1106',
        },
        {
          id: '38',
          code: 'HIST 2505',
          title: 'European History',
          subject_code: 'HIST',
          description: 'Survey of European history from medieval to modern times.',
          credits: 3,
          prerequisites: 'HIST 1015',
        },
        {
          id: '39',
          code: 'PSYC 2505',
          title: 'Social Psychology',
          subject_code: 'PSYC',
          description: 'Social influences on behavior and cognition.',
          credits: 3,
          prerequisites: 'PSYC 2005',
        },
        {
          id: '40',
          code: 'ECON 2505',
          title: 'Macroeconomics',
          subject_code: 'ECON',
          description: 'National income, inflation, and economic growth.',
          credits: 3,
          prerequisites: 'ECON 2006',
        },
        {
          id: '41',
          code: 'BUS 2505',
          title: 'Financial Accounting',
          subject_code: 'BUS',
          description: 'Principles of financial accounting and reporting.',
          credits: 3,
          prerequisites: 'BUS 2005',
        },
        {
          id: '42',
          code: 'ARCH 2505',
          title: 'Architectural History',
          subject_code: 'ARCH',
          description: 'History of architecture from ancient to modern times.',
          credits: 3,
          prerequisites: 'ARCH 1016',
        },
        {
          id: '43',
          code: 'ART 2505',
          title: 'Digital Art',
          subject_code: 'ART',
          description: 'Introduction to digital art and design.',
          credits: 3,
          prerequisites: 'ART 1016',
        },
        {
          id: '44',
          code: 'MUS 2505',
          title: 'Music Theory',
          subject_code: 'MUS',
          description: 'Fundamentals of music theory and composition.',
          credits: 3,
          prerequisites: 'MUS 1017',
        },
        {
          id: '45',
          code: 'THEA 2505',
          title: 'Acting Techniques',
          subject_code: 'THEA',
          description: 'Fundamental acting methods and techniques.',
          credits: 3,
          prerequisites: 'THEA 1018',
        }
      ];
    
    console.log('Mock data array created with', mockCourses.length, 'courses');
    
    // Process the mock data
    const startIndex = (currentPage - 1) * coursesPerPage;
    const endIndex = startIndex + coursesPerPage;
    const paginatedCourses = mockCourses.slice(startIndex, endIndex);
    
    setCourses(mockCourses); // Store all courses
    setFilteredCourses(paginatedCourses); // Show only current page
    const calculatedTotalPages = Math.ceil(mockCourses.length / coursesPerPage);
    setTotalPages(calculatedTotalPages); // Calculate total pages
    console.log('Mock data loaded:', { mockCoursesLength: mockCourses.length, coursesPerPage, calculatedTotalPages, currentPage, startIndex, endIndex });
    setStats({
      totalCourses: mockCourses.length,
      totalReviews: 200,
      averageRating: 4.2
    });
    
    setLoading(false);
  };

  const checkBackendHealth = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/health', {
        method: 'GET',
        timeout: 2000
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const fetchSubjects = async () => {
    try {
      // Always use common VT subjects for now
      const commonSubjects = [
        'CS', 'ECE', 'MATH', 'PHYS', 'CHEM', 'BIOL', 'ENGL', 'HIST', 
        'PSYC', 'ECON', 'BUS', 'ARCH', 'ART', 'MUS', 'THEA', 'AOE'
      ];
      setSubjects(commonSubjects);
    } catch (error) {
      console.error('Error processing subjects:', error);
      setSubjects(['CS', 'ECE', 'MATH', 'PHYS', 'ENGL']);
    }
  };

  // Removed filterCourses function - using API filtering only

  const handleCourseClick = async (course) => {
    try {
      // Try Supabase first, then backend, then fallback to basic data
      let detailsResponse = { data: course };
      let reviewsResponse = { data: { reviews: [], stats: {} } };

      try {
        // Try Supabase first
        detailsResponse = await supabaseCourseAPI.getCourseDetails(course.code);
      } catch (supabaseError) {
        try {
          // Try backend
          detailsResponse = await courseAPI.getCourseDetails(course.code);
        } catch (backendError) {
          console.log('Using basic course data');
        }
      }

      try {
        // Try Supabase for reviews
        reviewsResponse = await supabaseCourseAPI.getCourseReviews(course.id);
      } catch (supabaseError) {
        try {
          // Try backend for reviews
          reviewsResponse = await courseAPI.getCourseReviews(course.id);
        } catch (backendError) {
          console.log('Using empty reviews');
        }
      }

      setSelectedCourse({
        ...course,
        details: detailsResponse.data,
        reviews: reviewsResponse.data.reviews || [],
        stats: reviewsResponse.data.stats || {}
      });
    } catch (error) {
      console.error('Error fetching course details:', error);
      toast.error('Failed to load course details');
      
      // Fallback to basic course data
      setSelectedCourse({
        ...course,
        reviews: [],
        stats: { rating: 0, difficulty: 0, interest: 0, count: 0 }
      });
    }
  };

  const handleSignOut = async () => {
    console.log('CoursesPage: handleSignOut called');
    try {
      await signOut();
      console.log('CoursesPage: signOut completed');
      setShowUserDropdown(false);
    } catch (error) {
      console.error('CoursesPage: signOut error:', error);
      setShowUserDropdown(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading"></div>
        <p>Loading courses...</p>
      </div>
    );
  }

  return (
    <div className="courses-page">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-content">
          <div className="nav-logo">
            <img src="/VtLogo.png" alt="VT Logo" className="vt-logo" />
            <span>HokiePath</span>
          </div>
          
          <div className="navbar-right">
            <a href="/ai-chat" className="nav-link">
              <Star size={16} />
              AI Chat
            </a>
            <div className="user-menu">
              <div className="user-info" onClick={() => setShowUserDropdown(!showUserDropdown)}>
                <span className="user-name">{user.name}</span>
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="user-avatar"
                />
              </div>
              {showUserDropdown && (
                <div className="user-dropdown">
                  <button 
                    className="dropdown-item"
                    onClick={(e) => {
                      console.log('Sign Out button clicked');
                      e.preventDefault();
                      e.stopPropagation();
                      handleSignOut();
                    }}
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Search and Filter Bar */}
      <div className="search-filter-bar">
        <div className="search-input">
          <Search size={20} color="var(--vt-hokieStone)" />
          <input
            type="text"
            placeholder="Search courses by title or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
            autoComplete="off"
          />
        </div>
        
        <div className="filter-select">
          <Filter size={20} color="var(--vt-hokieStone)" />
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="input"
          >
            <option value="">All Subjects</option>
            {subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>
        
        {(searchTerm || selectedSubject) && (
          <button 
            className="clear-filters-btn"
            onClick={() => {
              setSearchTerm('');
              setSelectedSubject('');
              setCurrentPage(1);
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <BookOpen size={24} color="var(--vt-maroon)" />
          <div>
            <h3>{stats.totalCourses}</h3>
            <p>Total Courses</p>
          </div>
        </div>
        <div className="stat-card">
          <Users size={24} color="var(--vt-burntOrange)" />
          <div>
            <h3>{stats.totalReviews}</h3>
            <p>Reviews</p>
          </div>
        </div>
        <div className="stat-card">
          <Star size={24} color="var(--vt-hokieStone)" />
          <div>
            <h3>{stats.averageRating}</h3>
            <p>Avg Rating</p>
          </div>
        </div>
        <div className="stat-card">
          <Plus size={24} color="var(--vt-maroon)" />
          <div>
                <h3>{getTotalCoursesCount()}</h3>
                <p>My Terms</p>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="courses-grid">
        {console.log('Rendering courses:', { filteredCoursesLength: filteredCourses.length, coursesLength: courses.length })}
        {filteredCourses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              onClick={() => handleCourseClick(course)}
              onAddToCatalog={handleAddToTerm}
              isInCatalog={termCourses.some(termData => 
                termData.courses.some(c => c.course_id === (course.course_id || course.id))
              )}
            />
        ))}
      </div>

      {/* Pagination Controls */}
      {console.log('Pagination Debug:', { totalPages, currentPage, coursesPerPage, filteredCoursesLength: filteredCourses.length, allCoursesLength: courses.length })}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            className="pagination-btn"
            onClick={() => {
              setCurrentPage(prev => Math.max(1, prev - 1));
            }}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          <div className="pagination-info">
            Page {currentPage} of {totalPages}
          </div>
          
          <button 
            className="pagination-btn"
            onClick={() => {
              setCurrentPage(prev => Math.min(totalPages, prev + 1));
            }}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* No Results */}
      {filteredCourses.length === 0 && !loading && (
        <div className="no-results">
          <BookOpen size={48} color="var(--vt-hokieStone)" />
          <h3>No courses found</h3>
          <p>
            {searchTerm || selectedSubject 
              ? `No courses match your search "${searchTerm || selectedSubject}". Try different keywords or clear your filters.`
              : 'No courses available. Please try again later.'
            }
          </p>
          {(searchTerm || selectedSubject) && (
            <button 
              className="clear-filters-btn"
              onClick={() => {
                setSearchTerm('');
                setSelectedSubject('');
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Course Modal */}
      {selectedCourse && (
        <CourseModal
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
          onCourseUpdate={async () => {
            // Refresh the selected course data when a review is submitted
            if (selectedCourse) {
              console.log('Refreshing course data after review submission...');
              try {
                // Refresh stats first
                await refreshStats();
                
                // Get the original course from the courses list
                const originalCourse = courses.find(c => c.id === selectedCourse.id) || 
                                     filteredCourses.find(c => c.id === selectedCourse.id);
                
                if (originalCourse) {
                  await handleCourseClick(originalCourse);
                } else {
                  // Fallback: refresh the current selected course
                  await handleCourseClick(selectedCourse);
                }
              } catch (error) {
                console.error('Error refreshing course data:', error);
              }
            }
          }}
        />
      )}

      {/* Term Selection Modal */}
      {showTermModal && selectedCourseForTerm && (
        <div className="modal-overlay">
          <div className="modal-content term-selection-modal">
            <div className="modal-header">
              <h3>Select Term for {selectedCourseForTerm.code}</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowTermModal(false);
                  setSelectedCourseForTerm(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Choose which term you want to take this course:</p>
              <div className="term-options">
                {getAvailableTerms().map(term => (
                  <button
                    key={term}
                    className="term-option"
                    onClick={() => handleTermSelection(term)}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
