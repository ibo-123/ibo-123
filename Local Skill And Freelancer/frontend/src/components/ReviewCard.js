import React, { useState } from 'react';
import PropTypes from 'prop-types';

const ReviewCard = ({ 
  review, 
  showActions = false, 
  onDelete, 
  onReport,
  onHelpful,
  variant = 'default',
  isOwnReview = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHelpfulClicked, setIsHelpfulClicked] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount || 0);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Render stars based on rating
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - Math.ceil(rating);
    
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <svg key={`full-${i}`} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        ))}
        
        {hasHalfStar && (
          <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 20 20">
            <defs>
              <linearGradient id="halfGradient">
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="50%" stopColor="#d1d5db" />
              </linearGradient>
            </defs>
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" fill="url(#halfGradient)" />
          </svg>
        )}
        
        {[...Array(emptyStars)].map((_, i) => (
          <svg key={`empty-${i}`} className="w-5 h-5 text-gray-300 fill-current" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        ))}
        
        <span className="ml-2 text-sm font-semibold text-gray-700">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // Get random avatar color based on name
  const getAvatarColor = (name) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const index = name?.charAt(0)?.charCodeAt(0) || 0;
    return colors[index % colors.length];
  };

  // Get initials
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Truncate comment
  const truncateComment = (text, maxLength = 200) => {
    if (!text) return 'No comment provided';
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}...`;
  };

  // Handle helpful click
  const handleHelpfulClick = async () => {
    if (!isHelpfulClicked && onHelpful) {
      setIsHelpfulClicked(true);
      setHelpfulCount(prev => prev + 1);
      try {
        await onHelpful(review._id);
      } catch (error) {
        setHelpfulCount(prev => prev - 1);
        setIsHelpfulClicked(false);
      }
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      await onDelete(review._id);
    }
  };

  // Handle report
  const handleReport = async () => {
    const reason = prompt('Please provide a reason for reporting this review:');
    if (reason) {
      await onReport(review._id, reason);
    }
  };

  // Get variant classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return 'p-3';
      case 'featured':
        return 'p-6 border-2 border-yellow-200 bg-gradient-to-br from-white to-yellow-50';
      default:
        return 'p-4';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ${getVariantClasses()}`}>
      {/* Header Section */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className={`h-10 w-10 rounded-full ${getAvatarColor(review.reviewer?.name)} flex items-center justify-center text-white font-semibold text-sm`}>
            {getInitials(review.reviewer?.name)}
          </div>
          
          <div>
            <p className="font-semibold text-gray-900">
              {review.reviewer?.name || 'Anonymous User'}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {renderStars(review.rating)}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
          {review.updatedAt && review.updatedAt !== review.createdAt && (
            <p className="text-xs text-gray-400 mt-1">(Edited)</p>
          )}
        </div>
      </div>

      {/* Review Title (if exists) */}
      {review.title && (
        <h4 className="text-lg font-semibold text-gray-800 mb-2">
          {review.title}
        </h4>
      )}

      {/* Review Comment */}
      <div className="mb-4">
        <p className="text-gray-600 leading-relaxed">
          {isExpanded ? review.comment : truncateComment(review.comment)}
        </p>
        {review.comment && review.comment.length > 200 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 text-sm mt-1 hover:text-blue-700 font-medium"
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Job Info (if provided) */}
      {review.job && (
        <div className="mb-3 p-2 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Reviewed for:</p>
          <p className="text-sm font-medium text-gray-700">{review.job.title}</p>
        </div>
      )}

      {/* Response from recipient (if exists) */}
      {review.response && (
        <div className="mb-4 ml-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <p className="text-xs font-semibold text-blue-700 mb-1">Response from {review.recipient?.name}:</p>
          <p className="text-sm text-gray-700">{review.response}</p>
        </div>
      )}

      {/* Helpful Section & Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <button
            onClick={handleHelpfulClick}
            disabled={isHelpfulClicked}
            className={`flex items-center gap-1 text-sm transition-colors ${
              isHelpfulClicked 
                ? 'text-green-600 cursor-default' 
                : 'text-gray-500 hover:text-green-600'
            }`}
          >
            <svg className="w-4 h-4" fill={isHelpfulClicked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            <span>Helpful ({helpfulCount})</span>
          </button>
          
          {review.verifiedPurchase && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Verified Purchase
            </span>
          )}
        </div>
        
        {showActions && (
          <div className="flex items-center gap-2">
            {isOwnReview && onDelete && (
              <button
                onClick={handleDelete}
                className="text-red-600 text-sm hover:text-red-700 transition-colors"
              >
                Delete
              </button>
            )}
            {!isOwnReview && onReport && (
              <button
                onClick={handleReport}
                className="text-gray-500 text-sm hover:text-red-600 transition-colors"
              >
                Report
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// PropTypes
ReviewCard.propTypes = {
  review: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    rating: PropTypes.number.isRequired,
    comment: PropTypes.string,
    title: PropTypes.string,
    reviewer: PropTypes.shape({
      name: PropTypes.string,
      _id: PropTypes.string
    }),
    recipient: PropTypes.shape({
      name: PropTypes.string
    }),
    job: PropTypes.shape({
      title: PropTypes.string,
      _id: PropTypes.string
    }),
    response: PropTypes.string,
    helpfulCount: PropTypes.number,
    verifiedPurchase: PropTypes.bool,
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string
  }).isRequired,
  showActions: PropTypes.bool,
  onDelete: PropTypes.func,
  onReport: PropTypes.func,
  onHelpful: PropTypes.func,
  variant: PropTypes.oneOf(['default', 'compact', 'featured']),
  isOwnReview: PropTypes.bool
};

// Default props
ReviewCard.defaultProps = {
  showActions: false,
  onDelete: null,
  onReport: null,
  onHelpful: null,
  variant: 'default',
  isOwnReview: false
};

export default ReviewCard;