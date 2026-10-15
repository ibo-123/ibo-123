import React, { useState } from 'react';
import PropTypes from 'prop-types';

const ProposalCard = ({ 
  proposal, 
  onAccept, 
  onReject, 
  onWithdraw,
  showActions = true,
  isFreelancer = false,
  variant = 'default'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Truncate text
  const truncateText = (text, maxLength = 150) => {
    if (!text) return 'No description provided';
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}...`;
  };

  // Get status configuration
  const getStatusConfig = (status) => {
    const statuses = {
      pending: {
        label: 'Pending',
        className: 'bg-yellow-100 text-yellow-800',
        icon: '⏳',
        badge: 'border-l-4 border-yellow-500'
      },
      accepted: {
        label: 'Accepted',
        className: 'bg-green-100 text-green-800',
        icon: '✓',
        badge: 'border-l-4 border-green-500'
      },
      rejected: {
        label: 'Rejected',
        className: 'bg-red-100 text-red-800',
        icon: '✗',
        badge: 'border-l-4 border-red-500'
      },
      withdrawn: {
        label: 'Withdrawn',
        className: 'bg-gray-100 text-gray-800',
        icon: '↺',
        badge: 'border-l-4 border-gray-500'
      },
      in_review: {
        label: 'In Review',
        className: 'bg-blue-100 text-blue-800',
        icon: '👁️',
        badge: 'border-l-4 border-blue-500'
      }
    };
    return statuses[status] || statuses.pending;
  };

  const statusConfig = getStatusConfig(proposal.status);
  
  // Handle accept action
  const handleAccept = async () => {
    if (onAccept && !isLoading) {
      setIsLoading(true);
      try {
        await onAccept(proposal._id);
      } catch (error) {
        console.error('Error accepting proposal:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle reject action
  const handleReject = async () => {
    if (onReject && !isLoading) {
      setIsLoading(true);
      try {
        await onReject(proposal._id);
      } catch (error) {
        console.error('Error rejecting proposal:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle withdraw action
  const handleWithdraw = async () => {
    if (onWithdraw && !isLoading) {
      setIsLoading(true);
      try {
        await onWithdraw(proposal._id);
      } catch (error) {
        console.error('Error withdrawing proposal:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Get variant classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return 'p-3';
      case 'featured':
        return 'p-6 border-2 border-blue-200 bg-gradient-to-br from-white to-blue-50';
      default:
        return 'p-4';
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ${statusConfig.badge} ${getVariantClasses()}`}
    >
      {/* Header Section */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          {proposal.freelancer && (
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
                {proposal.freelancer.name?.[0] || 'F'}
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  {proposal.freelancer.name || 'Anonymous Freelancer'}
                </p>
                {proposal.freelancer.rating && (
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-yellow-500">★</span>
                    <span className="text-slate-600">{proposal.freelancer.rating}</span>
                    {proposal.freelancer.reviews && (
                      <span className="text-slate-400">({proposal.freelancer.reviews} reviews)</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusConfig.className}`}>
            <span>{statusConfig.icon}</span>
            <span>{statusConfig.label}</span>
          </span>
        </div>
      </div>

      {/* Proposal Text */}
      <div className="mb-3">
        <p className="text-slate-600 leading-relaxed">
          {isExpanded ? proposal.proposalText : truncateText(proposal.proposalText)}
        </p>
        {proposal.proposalText && proposal.proposalText.length > 150 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 text-sm mt-1 hover:text-blue-700 font-medium"
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4 pt-2 border-t border-slate-100">
        <div>
          <p className="text-xs text-slate-500 mb-1">Proposed Price</p>
          <p className="text-lg font-bold text-green-600">
            {formatCurrency(proposal.proposedPrice)}
          </p>
        </div>
        
        {proposal.estimatedDays && (
          <div>
            <p className="text-xs text-slate-500 mb-1">Estimated Timeline</p>
            <p className="text-sm font-semibold text-slate-700 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {proposal.estimatedDays} days
            </p>
          </div>
        )}
        
        {proposal.createdAt && (
          <div>
            <p className="text-xs text-slate-500 mb-1">Submitted</p>
            <p className="text-sm text-slate-600">{formatDate(proposal.createdAt)}</p>
          </div>
        )}
        
        {proposal.updatedAt && proposal.status !== 'pending' && (
          <div>
            <p className="text-xs text-slate-500 mb-1">Last Updated</p>
            <p className="text-sm text-slate-600">{formatDate(proposal.updatedAt)}</p>
          </div>
        )}
      </div>

      {/* Skills/Cover Letter */}
      {proposal.coverLetter && (
        <div className="mb-4 p-3 bg-slate-50 rounded-lg">
          <p className="text-xs font-semibold text-slate-600 mb-1">Cover Letter</p>
          <p className="text-sm text-slate-600">{truncateText(proposal.coverLetter, 100)}</p>
        </div>
      )}

      {/* Action Buttons */}
      {showActions && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {!isFreelancer && proposal.status === 'pending' && (
            <>
              <button
                onClick={handleAccept}
                disabled={isLoading}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'Accept Proposal'}
              </button>
              <button
                onClick={handleReject}
                disabled={isLoading}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject
              </button>
            </>
          )}
          
          {isFreelancer && proposal.status === 'pending' && (
            <button
              onClick={handleWithdraw}
              disabled={isLoading}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Withdraw Proposal'}
            </button>
          )}
          
          {proposal.status === 'accepted' && (
            <div className="w-full text-center text-green-600 text-sm font-medium py-2">
              ✓ This proposal has been accepted
            </div>
          )}
          
          {proposal.status === 'rejected' && (
            <div className="w-full text-center text-red-600 text-sm font-medium py-2">
              ✗ This proposal has been rejected
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// PropTypes
ProposalCard.propTypes = {
  proposal: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    proposalText: PropTypes.string,
    proposedPrice: PropTypes.number.isRequired,
    status: PropTypes.oneOf(['pending', 'accepted', 'rejected', 'withdrawn', 'in_review']),
    freelancer: PropTypes.shape({
      name: PropTypes.string,
      rating: PropTypes.number,
      reviews: PropTypes.number
    }),
    estimatedDays: PropTypes.number,
    coverLetter: PropTypes.string,
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string
  }).isRequired,
  onAccept: PropTypes.func,
  onReject: PropTypes.func,
  onWithdraw: PropTypes.func,
  showActions: PropTypes.bool,
  isFreelancer: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'compact', 'featured'])
};

// Default props
ProposalCard.defaultProps = {
  onAccept: null,
  onReject: null,
  onWithdraw: null,
  showActions: true,
  isFreelancer: false,
  variant: 'default'
};

export default ProposalCard;