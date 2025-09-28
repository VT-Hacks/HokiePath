import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { courseAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import './ReviewForm.css';

const ReviewForm = ({ course, onClose, onReviewSubmitted }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    rating: 0,
    difficulty: 0,
    interest: 0,
    review: '',
    instructor: '',
    semester: '',
    workload: '',
    attendance_required: false,
    grading_style: ''
  });
  const [hoveredRating, setHoveredRating] = useState(0);
  const [hoveredDifficulty, setHoveredDifficulty] = useState(0);
  const [hoveredInterest, setHoveredInterest] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRatingClick = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleDifficultyClick = (difficulty) => {
    setFormData(prev => ({ ...prev, difficulty }));
  };

  const handleInterestClick = (interest) => {
    setFormData(prev => ({ ...prev, interest }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to submit a review');
      return;
    }

    if (formData.rating === 0 || formData.difficulty === 0 || formData.interest === 0) {
      setError('Please provide ratings for all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const reviewData = {
        ...formData,
        user_id: user.id
      };
console.log("course.id");
console.log(course.id);
console.log(reviewData);
      await courseAPI.submitReview(course.id, reviewData);
      
      toast.success('Review submitted successfully!');
      
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
      
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      setError(error.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = (value, hoveredValue, onHover, onClick, label) => (
    <div className="rating-group">
      <label className="rating-label">{label}</label>
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={20}
            className={`star ${star <= (hoveredValue || value) ? 'filled' : 'empty'}`}
            onMouseEnter={() => onHover(star)}
            onMouseLeave={() => onHover(0)}
            onClick={() => onClick(star)}
          />
        ))}
        <span className="rating-text">
          {hoveredValue || value > 0 ? `${hoveredValue || value}/5` : 'Click to rate'}
        </span>
      </div>
    </div>
  );

  return (
    <div className="review-form-overlay" onClick={onClose}>
      <div className="review-form-content" onClick={(e) => e.stopPropagation()}>
        <div className="review-form-header">
          <h3>Review {course.code} - {course.title}</h3>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="review-form">
          {error && <div className="error-message">{error}</div>}

          <div className="rating-section">
            {renderStarRating(
              formData.rating,
              hoveredRating,
              setHoveredRating,
              handleRatingClick,
              'Overall Rating *'
            )}

            {renderStarRating(
              formData.difficulty,
              hoveredDifficulty,
              setHoveredDifficulty,
              handleDifficultyClick,
              'Difficulty Level *'
            )}

            {renderStarRating(
              formData.interest,
              hoveredInterest,
              setHoveredInterest,
              handleInterestClick,
              'Interest Level *'
            )}
          </div>

          <div className="form-group">
            <label htmlFor="review">Review Text</label>
            <input
              type="text"
              id="review"
              name="review"
              value={formData.review}
              onChange={handleInputChange}
              placeholder="Share your experience with this course..."
              maxLength={1000}
            />
            <div className="character-count">{formData.review.length}/1000</div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="instructor">Instructor</label>
              <input
                type="text"
                id="instructor"
                name="instructor"
                value={formData.instructor}
                onChange={handleInputChange}
                placeholder="Professor name"
                maxLength={100}
              />
            </div>

            <div className="form-group">
              <label htmlFor="semester">Semester</label>
              <input
                type="text"
                id="semester"
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                placeholder="e.g., Fall 2024"
                maxLength={100}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="workload">Workload</label>
              <select
                id="workload"
                name="workload"
                value={formData.workload}
                onChange={handleInputChange}
              >
                <option value="">Select workload</option>
                <option value="Light">Light</option>
                <option value="Moderate">Moderate</option>
                <option value="Heavy">Heavy</option>
                <option value="Very Heavy">Very Heavy</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="grading_style">Grading Style</label>
              <input
                type="text"
                id="grading_style"
                name="grading_style"
                value={formData.grading_style}
                onChange={handleInputChange}
                placeholder="e.g., Exams, Projects, Papers"
                maxLength={200}
              />
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="attendance_required"
                checked={formData.attendance_required}
                onChange={handleInputChange}
              />
              <span className="checkbox-text">Attendance Required</span>
            </label>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting || formData.rating === 0 || formData.difficulty === 0 || formData.interest === 0}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewForm;
