import React, { useState, useEffect } from 'react';
import { X, BookOpen, Clock, Users, Star, ChevronRight, ExternalLink, MessageSquare } from 'lucide-react';
import ReviewForm from './ReviewForm';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import './CourseModal.css';

const CourseModal = ({ course, onClose, onCourseUpdate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [courseData, setCourseData] = useState(course);
  const { user } = useAuth();

  // Update courseData when course prop changes
  useEffect(() => {
    setCourseData(course);
  }, [course]);

  if (!course) return null;

  const formatCredits = (credits) => {
    if (!credits) return 'N/A';
    if (typeof credits === 'object') {
      return credits.credits || credits.value || 'N/A';
    }
    return credits;
  };

  const formatPrerequisites = (prereqs) => {
    if (!prereqs) return 'None';
    if (Array.isArray(prereqs)) {
      return prereqs.length > 0 ? prereqs.join(', ') : 'None';
    }
    if (typeof prereqs === 'object') {
      return prereqs.description || prereqs.text || prereqs;
    }
    return prereqs;
  };

  const formatCorequisites = (coreqs) => {
    if (!coreqs) return 'None';
    if (typeof coreqs === 'object') {
      return coreqs.description || coreqs.text || 'See requirements';
    }
    return coreqs;
  };

  const renderOverview = () => (
    <div className="modal-section">
      <div className="course-info">
        <h2 className="course-title-large">{courseData.title}</h2>
        
        {courseData.description && (
          <div className="course-description-large">
            {courseData.description}
          </div>
        )}
      </div>

      <div className="course-details-grid">
        <div className="detail-item">
          <BookOpen size={20} color="var(--vt-burntOrange)" />
          <div>
            <h4>Credits</h4>
            <p>{formatCredits(courseData.credits)}</p>
          </div>
        </div>

        <div className="detail-item">
          <Clock size={20} color="var(--vt-maroon)" />
          <div>
            <h4>Prerequisites</h4>
            <p>{formatPrerequisites(courseData.prerequisites)}</p>
          </div>
        </div>

        {courseData.corequisites && (
          <div className="detail-item">
            <Users size={20} color="var(--vt-hokieStone)" />
            <div>
              <h4>Corequisites</h4>
              <p>{formatCorequisites(courseData.corequisites)}</p>
            </div>
          </div>
        )}

        {courseData.restrictions && (
          <div className="detail-item">
            <Star size={20} color="var(--vt-burntOrange)" />
            <div>
              <h4>Restrictions</h4>
              <p>{courseData.restrictions}</p>
            </div>
          </div>
        )}
      </div>

      {courseData.pathways && (
        <div className="pathways-section">
          <h3>Pathways</h3>
          <p>{courseData.pathways}</p>
        </div>
      )}
    </div>
  );

  const renderReviews = () => (
    <div className="modal-section">
      <div className="reviews-header">
        <h3>Student Reviews</h3>
        {courseData.stats && (
          <div className="review-stats">
            <div className="stat">
              <span className="stat-value">{courseData.stats.rating?.toFixed(1) || 'N/A'}</span>
              <span className="stat-label">Overall Rating</span>
            </div>
            <div className="stat">
              <span className="stat-value">{courseData.stats.difficulty?.toFixed(1) || 'N/A'}</span>
              <span className="stat-label">Difficulty</span>
            </div>
            <div className="stat">
              <span className="stat-value">{courseData.stats.interest?.toFixed(1) || 'N/A'}</span>
              <span className="stat-label">Interest</span>
            </div>
            <div className="stat">
              <span className="stat-value">{courseData.stats.count || 0}</span>
              <span className="stat-label">Reviews</span>
            </div>
          </div>
        )}
      </div>

      <div className="reviews-list">
        {courseData.reviews && courseData.reviews.length > 0 ? (
          courseData.reviews.map((review, index) => (
            <div key={index} className="review-item">
              <div className="review-header">
                <div className="review-rating">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={16} 
                      fill={i < (review.rating || 0) ? "var(--vt-burntOrange)" : "transparent"}
                      color="var(--vt-burntOrange)"
                    />
                  ))}
                </div>
                <div className="review-meta">
                  {review.semester && <span>{review.semester}</span>}
                  {review.instructor && <span>• {review.instructor}</span>}
                </div>
              </div>
              
              {review.review && (
                <div className="review-text">
                  {review.review}
                </div>
              )}
              
              <div className="review-details">
                {review.difficulty && (
                  <div className="review-detail">
                    <span>Difficulty: {review.difficulty}/5</span>
                  </div>
                )}
                {review.interest && (
                  <div className="review-detail">
                    <span>Interest: {review.interest}/5</span>
                  </div>
                )}
                {review.workload && (
                  <div className="review-detail">
                    <span>Workload: {review.workload}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-reviews">
            <p>No reviews available for this course yet.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderRecommendations = () => (
    <div className="modal-section">
      <h3>Similar Courses</h3>
      <div className="recommendations-list">
        <p>Recommendations would be loaded here based on course similarity.</p>
        <p>This feature would use the backend's AI recommendation system.</p>
      </div>
    </div>
  );

  const handleReviewSubmitted = async () => {
    console.log('Review submitted successfully');
    
    // Update local course data to reflect new review count
    setCourseData(prevCourse => ({
      ...prevCourse,
      reviews: prevCourse.reviews ? [...prevCourse.reviews, { 
        id: Date.now(), // Temporary ID for new review
        rating: 0, // Will be updated when we fetch real data
        review: 'Review submitted successfully!',
        semester: 'Current',
        instructor: 'Unknown'
      }] : [],
      stats: {
        ...prevCourse.stats,
        count: (prevCourse.stats?.count || 0) + 1,
        rating: prevCourse.stats?.rating || 0,
        difficulty: prevCourse.stats?.difficulty || 0,
        interest: prevCourse.stats?.interest || 0
      }
    }));

    // Notify parent component to refresh course data
    if (onCourseUpdate) {
      console.log('Notifying parent component to refresh course data...');
      await onCourseUpdate();
    }
  };

  return (
    <>
      {showReviewForm && (
        <ReviewForm
          course={courseData}
          onClose={() => setShowReviewForm(false)}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
      
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <div className="course-badge">
            <BookOpen size={20} />
            <span>{courseData.code}</span>
          </div>
        </div>

        <div className="modal-tabs">
          <button 
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews ({courseData.reviews?.length || 0})
          </button>
          <button 
            className={`tab ${activeTab === 'recommendations' ? 'active' : ''}`}
            onClick={() => setActiveTab('recommendations')}
          >
            Similar Courses
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'reviews' && renderReviews()}
          {activeTab === 'recommendations' && renderRecommendations()}
        </div>

        <div className="modal-footer">
          {user && (
            <button 
              className="btn btn-primary"
              onClick={() => setShowReviewForm(true)}
              style={{ marginRight: 'auto' }}
            >
              <MessageSquare size={12} style={{ marginRight: '0.25rem' }} />
              Give Review
            </button>
          )}
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default CourseModal;

