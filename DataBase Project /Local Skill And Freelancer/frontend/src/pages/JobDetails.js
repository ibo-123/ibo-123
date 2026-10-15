import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import ProposalCard from '../components/ProposalCard';
import LoadingSpinner from '../components/LoadingSpinner';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [proposalText, setProposalText] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  
  const user = JSON.parse(localStorage.getItem('user'));
  const isOwner = user?._id === job?.client?._id || user?.role === 'admin';
  const canApply = user?.role === 'freelancer' && !isOwner && job?.status === 'open';

  // Fetch job details
  const fetchJob = useCallback(async () => {
    try {
      const res = await api.get(`/jobs/${id}`);
      setJob(res.data);
    } catch (error) {
      console.error('Error fetching job:', error);
      setError(error.response?.data?.message || 'Failed to load job details');
    }
  }, [id]);

  // Fetch proposals
  const fetchProposals = useCallback(async () => {
    try {
      const res = await api.get(`/proposals/job/${id}`);
      setProposals(res.data);
    } catch (error) {
      console.error('Error fetching proposals:', error);
    }
  }, [id]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchJob(), fetchProposals()]);
      setLoading(false);
    };
    loadData();
  }, [fetchJob, fetchProposals]);

  // Submit proposal
  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      await api.post('/proposals', {
        jobId: id,
        proposalText,
        proposedPrice: parseFloat(proposedPrice),
        estimatedDays: parseInt(estimatedDays),
        coverLetter
      });
      
      setSuccessMessage('Proposal submitted successfully!');
      setProposalText('');
      setProposedPrice('');
      setEstimatedDays('');
      setCoverLetter('');
      
      // Refresh proposals
      await fetchProposals();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error submitting proposal:', error);
      setError(error.response?.data?.message || 'Failed to submit proposal');
    } finally {
      setSubmitting(false);
    }
  };

  // Update job status (for client)
  const handleUpdateJobStatus = async (newStatus) => {
    try {
      await api.put(`/jobs/${id}`, { status: newStatus });
      setJob({ ...job, status: newStatus });
      setSuccessMessage(`Job marked as ${newStatus}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating job:', error);
      setError(error.response?.data?.message || 'Failed to update job status');
    }
  };

  // Delete job
  const handleDeleteJob = async () => {
    if (window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      try {
        await api.delete(`/jobs/${id}`);
        navigate('/dashboard');
      } catch (error) {
        console.error('Error deleting job:', error);
        setError(error.response?.data?.message || 'Failed to delete job');
      }
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      open: { label: 'Open', className: 'bg-green-100 text-green-800', icon: '🔓' },
      in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800', icon: '⚙️' },
      completed: { label: 'Completed', className: 'bg-purple-100 text-purple-800', icon: '✓' },
      cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800', icon: '✗' },
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800', icon: '⏳' }
    };
    return badges[status] || badges.open;
  };

  const statusBadge = getStatusBadge(job?.status);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading job details..." />
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Job Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/jobs')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Browse Jobs
          </button>
        </div>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex mb-6 text-sm">
          <Link to="/" className="text-gray-500 hover:text-gray-700">Home</Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link to="/jobs" className="text-gray-500 hover:text-gray-700">Jobs</Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-900 font-medium">{job.title}</span>
        </nav>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Job Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${statusBadge.className}`}>
                    <span>{statusBadge.icon}</span>
                    <span>{statusBadge.label}</span>
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Posted by: <strong>{job.client?.user?.name || job.client?.name || 'Anonymous'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Posted on: {formatDate(job.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex gap-4 px-6">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`py-3 px-1 text-sm font-medium transition ${
                      activeTab === 'details'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Job Details
                  </button>
                  <button
                    onClick={() => setActiveTab('proposals')}
                    className={`py-3 px-1 text-sm font-medium transition ${
                      activeTab === 'proposals'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Proposals ({proposals.length})
                  </button>
                  {isOwner && (
                    <button
                      onClick={() => setActiveTab('manage')}
                      className={`py-3 px-1 text-sm font-medium transition ${
                        activeTab === 'manage'
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Manage Job
                    </button>
                  )}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    {/* Description */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                      <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                        {job.description}
                      </div>
                    </div>

                    {/* Skills Required */}
                    {job.skills && job.skills.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Skills Required</h3>
                        <div className="flex flex-wrap gap-2">
                          {job.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-sm font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Additional Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      {job.category && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 01.586 1.414V19a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
                          </svg>
                          <span>Category: <strong>{job.category}</strong></span>
                        </div>
                      )}
                      {job.location && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>Location: <strong>{job.location}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'proposals' && (
                  <div>
                    {proposals.length > 0 ? (
                      <div className="space-y-4">
                        {proposals.map((proposal) => (
                          <ProposalCard
                            key={proposal._id}
                            proposal={proposal}
                            showActions={isOwner && job.status === 'open'}
                            onAccept={async (id) => {
                              await api.put(`/proposals/${id}`, { status: 'accepted' });
                              fetchProposals();
                            }}
                            onReject={async (id) => {
                              await api.put(`/proposals/${id}`, { status: 'rejected' });
                              fetchProposals();
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No proposals yet</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {isOwner 
                            ? "Freelancers haven't submitted proposals for this job yet."
                            : "Be the first to submit a proposal for this job!"}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'manage' && isOwner && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Status</h3>
                      <div className="flex flex-wrap gap-3">
                        {['open', 'in_progress', 'completed', 'cancelled'].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleUpdateJobStatus(status)}
                            disabled={job.status === status}
                            className={`px-4 py-2 rounded-lg font-medium transition ${
                              job.status === status
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            Mark as {status.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-semibold text-red-600 mb-3">Danger Zone</h3>
                      <button
                        onClick={handleDeleteJob}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                      >
                        Delete Job
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1">
            {/* Budget Card */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget</h3>
              <div className="text-3xl font-bold text-green-600 mb-2">
                ${job.budget?.toLocaleString()}
              </div>
              <p className="text-sm text-gray-500">Fixed price</p>
            </div>

            {/* Submit Proposal Form */}
            {canApply && job.status === 'open' && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Proposal</h3>
                <form onSubmit={handleSubmitProposal} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Proposal Text *
                    </label>
                    <textarea
                      placeholder="Why are you the best fit for this job?"
                      value={proposalText}
                      onChange={(e) => setProposalText(e.target.value)}
                      rows="4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Proposed Price ($) *
                    </label>
                    <input
                      type="number"
                      placeholder="Your bid amount"
                      value={proposedPrice}
                      onChange={(e) => setProposedPrice(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      min="1"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Days to Complete
                    </label>
                    <input
                      type="number"
                      placeholder="Number of days"
                      value={estimatedDays}
                      onChange={(e) => setEstimatedDays(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cover Letter (Optional)
                    </label>
                    <textarea
                      placeholder="Additional information about your experience..."
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Submit Proposal'}
                  </button>
                </form>
              </div>
            )}

            {/* Already Applied Message */}
            {user?.role === 'freelancer' && proposals.some(p => p.freelancer?.user?._id === user._id) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium text-yellow-800">You've already applied</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      You have already submitted a proposal for this job. Wait for the client's response.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Login Prompt */}
            {!user && job.status === 'open' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-blue-800 mb-3">Interested in this job?</p>
                <Link
                  to="/login"
                  state={{ from: `/job/${id}` }}
                  className="block text-center bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Login to Apply
                </Link>
              </div>
            )}

            {/* Job Stats */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                Job Statistics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Proposals</span>
                  <span className="font-semibold">{proposals.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`font-semibold ${statusBadge.className}`}>
                    {statusBadge.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Posted</span>
                  <span className="font-semibold">{formatDate(job.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;