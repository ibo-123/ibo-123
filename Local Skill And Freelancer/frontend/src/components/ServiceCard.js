import React, { useState } from 'react';
import PropTypes from 'prop-types';

const ServiceCard = ({ 
  service, 
  onSelect, 
  showActions = true,
  variant = 'default',
  featured = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Format price
  const formatPrice = (price) => {
    if (!price && price !== 0) return 'Contact for price';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Get freelancer name with fallbacks
  const freelancerName = service.freelancer?.user?.name || 
                         service.freelancer?.name || 
                         service.provider?.name ||
                         'Freelancer';
  
  // Get freelancer avatar
  const getInitials = (name) => {
    if (!name || name === 'Freelancer') return 'F';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Get random color based on freelancer name
  const getAvatarColor = (name) => {
    const colors = [
      'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500',
      'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-red-500'
    ];
    const index = name?.charCodeAt(0) || 0;
    return colors[index % colors.length];
  };

  // Truncate description
  const truncateDescription = (text, maxLength = 120) => {
    if (!text) return 'No description provided';
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).trim()}...`;
  };

  // Get delivery time text
  const getDeliveryTime = (days) => {
    if (!days) return null;
    if (days === 1) return '1 day';
    if (days < 7) return `${days} days`;
    if (days === 7) return '1 week';
    return `${Math.floor(days / 7)} weeks`;
  };

  // Get rating stars
  const renderRating = (rating, reviews) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center gap-1">
        <div className="flex items-center">
          <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
          <span className="text-sm font-semibold text-gray-700 ml-1">{rating.toFixed(1)}</span>
        </div>
        {reviews > 0 && (
          <span className="text-xs text-gray-500">({reviews} {reviews === 1 ? 'review' : 'reviews'})</span>
        )}
      </div>
    );
  };

  // Get variant classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return 'p-4';
      case 'horizontal':
        return 'p-4 flex gap-4';
      default:
        return 'p-6';
    }
  };

  // Handle service selection
  const handleSelect = () => {
    if (onSelect && typeof onSelect === 'function') {
      onSelect(service._id);
    }
  };

  // Default image placeholder
  const defaultImage = `https://via.placeholder.com/400x200/3b82f6/ffffff?text=${encodeURIComponent(service.title || 'Service')}`;

  // Horizontal view
  if (variant === 'horizontal') {
    return (
      <div className="group bg-white rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          {/* Image Section */}
          {(!service.image || imageError) ? (
            <div className="sm:w-48 h-48 sm:h-auto relative overflow-hidden bg-gray-100">
              <img
                src={defaultImage}
                alt={service.title || 'Service'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          ) : (
            <div className="sm:w-48 h-48 sm:h-auto relative overflow-hidden bg-gray-100">
              <img
                src={service.image}
                alt={service.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={() => setImageError(true)}
              />
            </div>
          )}
          
          {/* Content Section */}
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-lg font-semibold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1">
                {service.title}
              </h3>
              {featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Featured
                </span>
              )}
            </div>
            
            {renderRating(service.rating, service.reviewCount)}
            
            <p className="text-gray-600 text-sm mt-2 line-clamp-2">
              {truncateDescription(service.description, 100)}
            </p>
            
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-500">by {freelancerName}</p>
                {service.deliveryDays && (
                  <p className="text-xs text-gray-500 mt-1">
                    ⏱ {getDeliveryTime(service.deliveryDays)}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{formatPrice(service.price)}</p>
                {showActions && onSelect && (
                  <button
                    onClick={handleSelect}
                    className="mt-1 rounded-full bg-blue-600 px-4 py-1 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Select
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default card view
  return (
    <div className={`group rounded-[28px] border border-slate-200 bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${getVariantClasses()}`}>
      {/* Image Section (optional) */}
      {(!service.image || imageError) ? (
        <div className="relative -mt-2 -mx-2 mb-4 overflow-hidden rounded-2xl">
          <img
            src={defaultImage}
            alt={service.title || 'Service'}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="relative -mt-2 -mx-2 mb-4 overflow-hidden rounded-2xl">
          <img
            src={service.image}
            alt={service.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
          {featured && (
            <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-yellow-400 px-2.5 py-1 text-xs font-semibold text-gray-900">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Featured
            </span>
          )}
        </div>
      )}

      {/* Title Section */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl font-semibold text-slate-900 hover:text-blue-600 transition-colors line-clamp-2">
            {service.title}
          </h3>
        </div>
        
        {renderRating(service.rating, service.reviewCount)}
      </div>

      {/* Description */}
      <div className="mb-4">
        <p className="text-slate-600 leading-7">
          {isExpanded ? service.description : truncateDescription(service.description)}
        </p>
        {service.description && service.description.length > 120 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 text-sm mt-1 hover:text-blue-700 font-medium"
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Skills/Tags */}
      {service.skills && service.skills.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {service.skills.slice(0, 3).map((skill, index) => (
            <span
              key={index}
              className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600"
            >
              {skill}
            </span>
          ))}
          {service.skills.length > 3 && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              +{service.skills.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-5">
        <div className="flex items-center gap-3">
          {/* Freelancer Avatar */}
          <div className={`h-10 w-10 rounded-full ${getAvatarColor(freelancerName)} flex items-center justify-center text-white font-semibold text-sm`}>
            {getInitials(freelancerName)}
          </div>
          
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Freelancer</p>
            <p className="text-base font-semibold text-slate-900 line-clamp-1">
              {freelancerName}
            </p>
            {service.deliveryDays && (
              <p className="text-xs text-slate-500 mt-0.5">
                ⏱ Delivers in {getDeliveryTime(service.deliveryDays)}
              </p>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-xs text-slate-500">Starting at</p>
          <p className="text-xl font-bold text-blue-600">{formatPrice(service.price)}</p>
          {showActions && onSelect && (
            <button
              onClick={handleSelect}
              className="mt-2 rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              View Service
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// PropTypes
ServiceCard.propTypes = {
  service: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    price: PropTypes.number,
    image: PropTypes.string,
    rating: PropTypes.number,
    reviewCount: PropTypes.number,
    deliveryDays: PropTypes.number,
    skills: PropTypes.arrayOf(PropTypes.string),
    freelancer: PropTypes.shape({
      user: PropTypes.shape({
        name: PropTypes.string
      }),
      name: PropTypes.string
    }),
    provider: PropTypes.shape({
      name: PropTypes.string
    })
  }).isRequired,
  onSelect: PropTypes.func,
  showActions: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'compact', 'horizontal']),
  featured: PropTypes.bool
};

// Default props
ServiceCard.defaultProps = {
  onSelect: null,
  showActions: true,
  variant: 'default',
  featured: false
};

export default ServiceCard;