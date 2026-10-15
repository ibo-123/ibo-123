import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

const JobCard = ({ job, onStatusChange, showActions = true, variant = 'default' }) => {
  // Safely extract client name with fallbacks
  const clientName = job.client?.user?.name || job.client?.name || 'Anonymous Client';
  
  // Format description with proper truncation
  const formatDescription = (text, maxLength = 120) => {
    if (!text) return 'No description provided';
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).trim()}...`;
  };

  const description = formatDescription(job.description);
  
  // Status configuration
  const statusConfig = {
    open: {
      label: 'Open',
      className: 'bg-emerald-100 text-emerald-700',
      icon: '🔓'
    },
    in_progress: {
      label: 'In Progress',
      className: 'bg-blue-100 text-blue-700',
      icon: '⚙️'
    },
    completed: {
      label: 'Completed',
      className: 'bg-slate-100 text-slate-700',
      icon: '✓'
    },
    pending: {
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-700',
      icon: '⏳'
    },
    cancelled: {
      label: 'Cancelled',
      className: 'bg-red-100 text-red-700',
      icon: '✗'
    }
  };

  const currentStatus = statusConfig[job.status] || statusConfig.open;
  
  // Format budget with currency
  const formatBudget = (amount) => {
    if (!amount && amount !== 0) return 'Negotiable';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  // Handle status change
  const handleStatusChange = (newStatus) => {
    if (onStatusChange && typeof onStatusChange === 'function') {
      onStatusChange(job._id, newStatus);
    }
  };
  
  // Get variant-specific styling
  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return 'p-4';
      case 'featured':
        return 'border-2 border-blue-200 bg-gradient-to-br from-white to-blue-50';
      default:
        return 'p-6';
    }
  };
  
  return (
    <div 
      className={`group rounded-[28px] border border-slate-200 bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${getVariantClasses()}`}
      role="article"
      aria-label={`Job: ${job.title}`}
    >
      {/* Header Section */}
      <div className={`mb-4 flex items-start justify-between gap-3 ${variant === 'compact' ? 'flex-col' : ''}`}>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-slate-900 hover:text-blue-600 transition-colors line-clamp-2">
            <Link to={`/job/${job._id}`} className="hover:underline">
              {job.title}
            </Link>
          </h3>
          
          <div className="mt-2 flex items-center gap-3 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {clientName}
            </span>
            
            {job.createdAt && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDate(job.createdAt)}
              </span>
            )}
            
            {job.category && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 01.586 1.414V19a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
                </svg>
                {job.category}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span 
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${currentStatus.className}`}
            role="status"
          >
            <span>{currentStatus.icon}</span>
            <span>{currentStatus.label}</span>
          </span>
        </div>
      </div>
      
      {/* Description Section */}
      <p className="text-slate-600 mb-5 leading-7 line-clamp-3">
        {description}
      </p>
      
      {/* Skills/Tags Section */}
      {job.skills && job.skills.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {job.skills.slice(0, 4).map((skill, index) => (
            <span 
              key={index}
              className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600"
            >
              {skill}
            </span>
          ))}
          {job.skills.length > 4 && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              +{job.skills.length - 4} more
            </span>
          )}
        </div>
      )}
      
      {/* Footer Section */}
      <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-900">{formatBudget(job.budget)}</span>
          {job.budget && typeof job.budget === 'number' && (
            <span className="text-sm text-slate-500">fixed price</span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Status change dropdown (if admin/owner) */}
          {showActions && onStatusChange && (
            <select
              value={job.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Change job status"
            >
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          )}
          
          <Link 
            to={`/job/${job._id}`}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            View details
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

// PropTypes for better type checking
JobCard.propTypes = {
  job: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    budget: PropTypes.number,
    status: PropTypes.oneOf(['open', 'in_progress', 'completed', 'pending', 'cancelled']),
    client: PropTypes.shape({
      user: PropTypes.shape({
        name: PropTypes.string
      }),
      name: PropTypes.string
    }),
    category: PropTypes.string,
    skills: PropTypes.arrayOf(PropTypes.string),
    createdAt: PropTypes.string
  }).isRequired,
  onStatusChange: PropTypes.func,
  showActions: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'compact', 'featured'])
};

// Default props
JobCard.defaultProps = {
  onStatusChange: null,
  showActions: false,
  variant: 'default'
};

export default JobCard;