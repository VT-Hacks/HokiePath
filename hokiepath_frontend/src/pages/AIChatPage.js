import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMyTerm } from '../contexts/MyTermContext';
import { useCareerPlan } from '../contexts/CareerPlanContext';
import { Send, Bot, User, BookOpen, LogOut, Star, X } from 'lucide-react';
import { courseAPI, aiAPI } from '../services/api';
import toast from 'react-hot-toast';
import './AIChatPage.css';

const AIChatPage = () => {
  const { user, signOut } = useAuth();
  const { termCourses, addCourseToTerm, removeCourseFromTerm, isCourseInTerm, getAvailableTerms, getTotalCoursesCount } = useMyTerm();
  const { careerPlans, selectedPlan, planFlowchart, loading: careerPlanLoading, generateCareerPlans, selectCareerPlan, clearCareerPlans } = useCareerPlan();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hi! I'm your AI course advisor. I can help you find courses, understand prerequisites, and plan your academic path at Virginia Tech. What would you like to know?",
      timestamp: new Date(),
      recommendedCourses: []
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [showMyCourses, setShowMyCourses] = useState(false);

  const handleMyCoursesClick = () => {
    setShowMyCourses(!showMyCourses);
  };

  const [showTermModal, setShowTermModal] = useState(false);
  const [selectedCourseForTerm, setSelectedCourseForTerm] = useState(null);
  const [showCareerPlanModal, setShowCareerPlanModal] = useState(false);
  const [selectedCourseDescription, setSelectedCourseDescription] = useState(null);

  const handleAddCourse = (course) => {
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

  const handleRemoveCourse = async (termCourseId) => {
    const result = await removeCourseFromTerm(termCourseId);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handleGenerateCareerPlan = async () => {
    const result = await generateCareerPlans();
    if (result.success) {
      setShowCareerPlanModal(true);
      toast.success('Career plans generated successfully!');
    } else {
      toast.error(result.message);
    }
  };

  const handleSelectCareerPlan = async (planId) => {
    const result = await selectCareerPlan(planId);
    if (result.success) {
      setShowCareerPlanModal(false);
      toast.success('Career plan selected successfully!');
    } else {
      toast.error(result.message);
    }
  };

  const handleCourseClick = (course) => {
    setSelectedCourseDescription(course);
  };
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Test backend connection first
    try {
      console.log('🔍 Testing backend connection...');
      const healthResponse = await fetch('http://localhost:8000/api/v1/health');
      console.log('✅ Backend health check:', healthResponse.ok);
    } catch (error) {
      console.error('❌ Backend health check failed:', error);
    }

    try {
      // Get AI response from backend with recommended courses
      const aiResponse = await generateAIResponse(inputMessage);
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponse.message || aiResponse,
        timestamp: new Date(),
        recommendedCourses: aiResponse.recommendedCourses || []
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      toast.error('Failed to get AI response. Please try again.');
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponse = async (userInput) => {
    try {
      console.log('🤖 Attempting to call backend AI API...', {
        userInput,
        userId: user.id,
        apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1'
      });
      
      // Test direct fetch first
      try {
        console.log('🧪 Testing direct fetch to backend...');
        console.log('⏱️ Starting AI request - this may take 10-30 seconds...');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log('⏰ Request timeout after 30 seconds');
          controller.abort();
        }, 30000); // 30 second timeout
        
        const directResponse = await fetch('http://localhost:8000/api/v1/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.id,
            message: userInput
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log('📡 Response received from backend:', directResponse.status);
        
        if (directResponse.ok) {
          const directData = await directResponse.json();
          console.log('✅ Direct fetch successful:', directData);
          return {
            message: directData.chatMessage,
            recommendedCourses: directData.recommendedCourses || []
          };
        } else {
          console.error('❌ Direct fetch failed:', directResponse.status, directResponse.statusText);
          if (directResponse.status === 500) {
            console.log('🔧 Backend error - likely AI processing issue');
          }
        }
      } catch (directError) {
        console.error('❌ Direct fetch error:', directError);
        if (directError.name === 'AbortError') {
          console.log('⏰ Request was aborted due to timeout');
        }
      }
      
      // Fallback to axios API
      const response = await aiAPI.sendMessage(userInput, user.id);
      console.log('✅ Backend AI API Response:', response.data);
      
      if (response.data && response.data.chatMessage) {
        return {
          message: response.data.chatMessage,
          recommendedCourses: response.data.recommendedCourses || []
        };
      }
    } catch (error) {
      console.error('❌ AI API Error:', error);
      console.log('🔄 Falling back to local processing...');
      // Fallback to local processing if backend AI is not available
    }

    // Fallback: Local AI processing with course search integration
    const input = userInput.toLowerCase();

    // Course search functionality
    if (input.includes('course') || input.includes('class') || input.includes('find')) {
      try {
        const searchTerm = extractSearchTerm(userInput);
        const response = await courseAPI.getCourses({ search: searchTerm, limit: 5 });
        const courses = response.data?.courses || response.data || [];
        
        if (courses.length > 0) {
          return {
            message: generateCourseRecommendation(courses, searchTerm),
            recommendedCourses: courses
          };
        } else {
          return {
            message: "I couldn't find any courses matching your search. Could you try different keywords or be more specific about what you're looking for?",
            recommendedCourses: []
          };
        }
      } catch (error) {
        console.error('Course search error:', error);
        return {
          message: "I'm having trouble searching for courses right now. Please try again later.",
          recommendedCourses: []
        };
      }
    }

    // Prerequisites questions
    if (input.includes('prerequisite') || input.includes('requirement') || input.includes('need to take')) {
      return {
        message: "I can help you understand course prerequisites! Could you tell me which specific course you're interested in? For example, you could ask about CS 3214 or any other course code.",
        recommendedCourses: []
      };
    }

    // Academic planning
    if (input.includes('plan') || input.includes('schedule') || input.includes('semester')) {
      return {
        message: "I'd be happy to help you plan your academic schedule! To give you the best advice, could you tell me:\n\n1. Your major or area of interest\n2. What year you are (freshman, sophomore, etc.)\n3. Any specific courses you're considering\n\nThis will help me provide more personalized recommendations.",
        recommendedCourses: []
      };
    }

    // Difficulty questions
    if (input.includes('difficult') || input.includes('hard') || input.includes('easy') || input.includes('workload')) {
      return {
        message: "I can help you understand course difficulty and workload! Course reviews and ratings can give you insights into what to expect. Would you like me to search for specific courses and show you their difficulty ratings and student feedback?",
        recommendedCourses: []
      };
    }

    // General help
    if (input.includes('help') || input.includes('what can you do')) {
      return {
        message: "I can help you with:\n\n🔍 **Course Discovery** - Find courses by subject, title, or keywords\n📚 **Prerequisites** - Understand course requirements and dependencies\n📅 **Academic Planning** - Get advice on course scheduling and sequencing\n⭐ **Course Reviews** - Access student ratings and feedback\n🎯 **Recommendations** - Get personalized course suggestions\n\nWhat would you like to explore?",
        recommendedCourses: []
      };
    }

    // Default response
    return {
      message: "That's an interesting question! I'm here to help with course-related inquiries. You can ask me about:\n\n• Finding specific courses\n• Understanding prerequisites\n• Academic planning\n• Course difficulty and workload\n• Getting course recommendations\n\nCould you be more specific about what you'd like to know?",
      recommendedCourses: []
    };
  };

  const extractSearchTerm = (input) => {
    // Extract potential course codes or keywords
    const courseCodeMatch = input.match(/\b[A-Z]{2,4}\s*\d{4}\b/);
    if (courseCodeMatch) {
      return courseCodeMatch[0].replace(/\s+/g, ' ');
    }
    
    // Extract other keywords
    const keywords = input.split(' ').filter(word => 
      word.length > 3 && 
      !['course', 'class', 'find', 'search', 'looking', 'for'].includes(word.toLowerCase())
    );
    
    return keywords.slice(0, 3).join(' ');
  };

  const generateCourseRecommendation = (courses, searchTerm) => {
    let response = `I found ${courses.length} course(s) related to "${searchTerm}":\n\n`;
    
    courses.forEach((course, index) => {
      response += `${index + 1}. **${course.code} - ${course.title}**\n`;
      if (course.description) {
        response += `   ${course.description.substring(0, 100)}...\n`;
      }
      response += `   Credits: ${course.credits || 'N/A'}\n\n`;
    });
    
    response += "Would you like more details about any of these courses, or would you like me to search for something else?";
    
    return response;
  };

  const handleSignOut = async () => {
    console.log('AIChatPage: handleSignOut called');
    try {
      setShowUserDropdown(false);
      await signOut();
      console.log('AIChatPage: signOut completed');
    } catch (error) {
      console.error('AIChatPage: signOut error:', error);
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="ai-chat-page">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-content">
          <div className="nav-logo">
            <img src="/VtLogo.png" alt="VT Logo" className="vt-logo" />
            <span>HokiePath</span>
          </div>
          
          <div className="navbar-right">
            <a href="/courses" className="nav-link">
              <BookOpen size={16} />
              Courses
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
                    onClick={handleSignOut}
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

      {/* Two Column Layout */}
      <div className="chat-layout">
        {/* Left Side - Chat Interface (60%) */}
        <div className="chat-left">
          <div className="chat-header">
            <div className="chat-title">
              <Bot size={24} color="var(--vt-maroon)" />
              <h2>AI Course Advisor</h2>
            </div>
            <p className="chat-subtitle">
              Ask me about courses, prerequisites, academic planning, and more!
            </p>
          </div>

          <div className="chat-messages">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.type}`}>
                <div className="message-avatar">
                  {message.type === 'user' ? (
                    <User size={20} />
                  ) : (
                    <Bot size={20} />
                  )}
                </div>
                <div className="message-content">
                  <div className="message-text">
                    {message.content.split('\n').map((line, index) => (
                      <p key={index}>{line}</p>
                    ))}
                  </div>
                  
                  {/* Display recommended courses if available */}
        {message.recommendedCourses && message.recommendedCourses.length > 0 && (
          <div className="recommended-courses">
            <h4>Recommended Courses:</h4>
            <div className="course-list">
              {message.recommendedCourses.map((course, index) => (
                <div key={index} className="course-badge">
                  <div className="course-badge-content">
                    <div className="course-badge-code">{course.code}</div>
                    <div className="course-badge-title">{course.title}</div>
                    {course.similarity && (
                      <div className="course-badge-similarity">
                        Match: {(course.similarity * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                  <button 
                    className={`course-badge-add ${termCourses.some(termData => 
                      termData.courses.some(c => c.course_id === (course.course_id || course.id))
                    ) ? 'added' : ''}`}
                    onClick={() => handleAddCourse(course)}
                    title={termCourses.some(termData => 
                      termData.courses.some(c => c.course_id === (course.course_id || course.id))
                    ) ? "Already in My Terms" : "Add to My Terms"}
                    disabled={termCourses.some(termData => 
                      termData.courses.some(c => c.course_id === (course.course_id || course.id))
                    )}
                  >
                    {termCourses.some(termData => 
                      termData.courses.some(c => c.course_id === (course.course_id || course.id))
                    ) ? '✓' : '+'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
                  
                  <div className="message-time">
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="message ai">
                <div className="message-avatar">
                  <Bot size={20} />
                </div>
                <div className="message-content">
                  <div className="message-text">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                      Hokie is thinking... This may take 10-30 seconds for AI processing.
                    </p>
                    <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#888' }}>
                      Generating embeddings → Searching courses → Creating AI response...
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-container">
            <form onSubmit={handleSendMessage} className="chat-input-form">
              <div className="chat-input-wrapper">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask me about courses, prerequisites, or academic planning..."
                  className="chat-input"
                  disabled={isLoading}
                />
              <button 
                type="submit" 
                className="send-button"
                disabled={!inputMessage.trim() || isLoading}
              >
                ↑
              </button>
              </div>
            </form>
            
            <div className="chat-suggestions">
              <p>Try asking:</p>
              <div className="suggestion-chips">
                <button 
                  className="suggestion-chip"
                  onClick={() => setInputMessage("Find computer science courses")}
                >
                  Find CS courses
                </button>
                <button 
                  className="suggestion-chip"
                  onClick={() => setInputMessage("What are the prerequisites for CS 3214?")}
                >
                  CS 3214 prerequisites
                </button>
                <button 
                  className="suggestion-chip"
                  onClick={() => setInputMessage("Help me plan my semester")}
                >
                  Plan my semester
                </button>
              </div>
            </div>

            <div className="career-plan-section">
              <button 
                className="generate-career-plan-btn"
                onClick={handleGenerateCareerPlan}
                disabled={careerPlanLoading}
              >
                {careerPlanLoading ? 'Generating...' : 'Generate Career Plan'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side - Student Catalog (40%) */}
        <div className="chat-right">
          <div className="course-info-panel">
  <div className="catalog-header">
    <h3 className="catalog-title">Student Catalog</h3>
    <button className="my-courses-btn" onClick={handleMyCoursesClick}>
      My Terms ({getTotalCoursesCount()})
    </button>
  </div>
  
        {showMyCourses && (
          <div className={`student-courses ${showMyCourses ? 'slide-in' : ''}`}>
            <div className="student-courses-header">
              <h3 className="student-courses-title">My Terms</h3>
              <button 
                className="close-my-terms-btn"
                onClick={() => setShowMyCourses(false)}
                title="Close My Terms"
              >
                ×
              </button>
            </div>
            
            {termCourses.length > 0 ? (
              termCourses.map((termData) => (
                <div key={termData.term} className="term-section">
                  <h4 className="term-title">{termData.term}</h4>
                  {termData.courses.map((termCourse) => (
                    <div key={termCourse.id} className="course-item">
                      <div className="course-item-content">
                        <span className="course-code">{termCourse.course.code}</span>
                        <span className="course-title">{termCourse.course.title}</span>
                        <div className="course-added">
                          Added {new Date(termCourse.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        className="course-delete-btn"
                        onClick={() => handleRemoveCourse(termCourse.id)}
                        title="Remove from My Terms"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="no-courses">
                <p>No courses added yet.</p>
                <p>Click the + button on recommended courses to add them to a term!</p>
              </div>
            )}
          </div>
        )}

        {/* Career Plan Flowchart */}
        {planFlowchart && (
          <div className="career-plan-flowchart">
            <div className="flowchart-header">
              <h3 className="plan-title">{planFlowchart.name}</h3>
              <p className="plan-description">{planFlowchart.description}</p>
            </div>
            
            <div className="flowchart-content">
              {planFlowchart.terms?.map((term, termIndex) => (
                <div key={term.id} className="term-flow">
                  <div className="term-header">
                    <h4 className="term-name">{term.term_name}</h4>
                  </div>
                  
                  <div className="courses-grid">
                    {term.courses?.map((coursePlan, courseIndex) => (
                      <div 
                        key={coursePlan.id} 
                        className="course-card"
                        onClick={() => handleCourseClick(coursePlan.course)}
                      >
                        <div className="course-code">{coursePlan.course.code}</div>
                        <div className="course-title">{coursePlan.course.title}</div>
                      </div>
                    ))}
                  </div>
                  
                  {termIndex < planFlowchart.terms.length - 1 && (
                    <div className="flow-arrow">↓</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
</div>
        </div>
      </div>

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

      {/* Career Plan Selection Modal */}
      {showCareerPlanModal && careerPlans.length > 0 && (
        <div className="modal-overlay">
          <div className="modal-content career-plan-modal">
            <div className="modal-header">
              <h3>Select Your Career Track</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCareerPlanModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Choose the career track that best fits your goals:</p>
              <div className="career-plan-options">
                {careerPlans.map(plan => (
                  <div 
                    key={plan.id} 
                    className="career-plan-option"
                    onClick={() => handleSelectCareerPlan(plan.id)}
                  >
                    <h4 className="plan-name">{plan.name}</h4>
                    <p className="plan-description">{plan.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Description Display */}
      {selectedCourseDescription && (
        <div className="course-description-overlay">
          <div className="course-description-modal">
            <div className="modal-header">
              <h3>{selectedCourseDescription.code} - {selectedCourseDescription.title}</h3>
              <button 
                className="modal-close"
                onClick={() => setSelectedCourseDescription(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="course-description-text">
                {selectedCourseDescription.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChatPage;
