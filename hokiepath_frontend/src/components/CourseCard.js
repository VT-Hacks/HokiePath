import React from 'react';
import { BookOpen, Star, Users, Clock, Plus, Check } from 'lucide-react';
import './CourseCard.css';

const CourseCard = ({ course, onClick, onAddToCatalog, isInCatalog = false }) => {
  const formatCredits = (credits) => {
    if (!credits) return 'N/A';
    if (typeof credits === 'object') {
      return credits.credits || credits.value || 'N/A';
    }
    return credits;
  };

  const formatPrerequisites = (prereqs) => {
    if (!prereqs) return 'None';
    if (typeof prereqs === 'object') {
      return prereqs.description || 'See requirements';
    }
    return prereqs;
  };

  const handleAddToCatalog = (e) => {
    e.stopPropagation(); // Prevent triggering the card click
    if (onAddToCatalog) {
      onAddToCatalog(course);
    }
  };

  return (
    <div className="course-card" onClick={onClick}>
      <div className="course-card-content">
        <div className="course-code">{course.code}</div>
        <div className="course-title">{course.title}</div>
      </div>
      {onAddToCatalog && (
        <button 
          className={`add-to-catalog-btn ${isInCatalog ? 'added' : ''}`}
          onClick={handleAddToCatalog}
          title={isInCatalog ? 'Remove from catalog' : 'Add to catalog'}
        >
          {isInCatalog ? <Check size={16} /> : <Plus size={16} />}
        </button>
      )}
    </div>
  );
};

export default CourseCard;

