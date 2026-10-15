import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import ProposalCard from '../components/ProposalCard';
import ReviewCard from '../components/ReviewCard';
import JobCard from '../components/JobCard';
import ServiceCard from '../components/ServiceCard';

const Dashboard = () => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [services, setServices] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalSpent: 0,
    activeJobs: 0,
    completedJobs: 0
  });

  const fetchDataRef = useRef(false);

  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    if (!user || fetchDataRef.current) return;
    fetchDataRef.current = true;

    setLoading(true);
    setError(null);

    try {
      // Fetch profile
      const profileRes = await axios.get('/users/me');
      setProfile(profileRes.data.profile);

      // Fetch role-specific data
      if (user.role === 'client') {
        const [jobsRes, proposalsRes, statsRes] = await Promise.all([
          axios.get('/jobs/user'),
          axios.get('/proposals/user'),
          axios.get('/stats/user')
        ]);
        setJobs(jobsRes.data);
        setProposals(proposalsRes.data);
        setStats(statsRes.data);
      } else {
        const [servicesRes, proposalsRes, statsRes] = await Promise.all([
          axios.get('/services/user'),
          axios.get('/proposals/freelancer'),
          axios.get('/stats/user')
        ]);
        setServices(servicesRes.data);
        setProposals(proposalsRes.data);
        setStats(statsRes.data);
      }

      // Fetch reviews
      const reviewsRes = await axios.get('/reviews/user');
      setReviews(reviewsRes.data);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      fetchDataRef.current = false;
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]); // Include both dependencies

  // Save profile changes
  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const res = await axios.put('/users/me', editData);
      
      setProfile(res.data.profile);
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      setEditMode(false);
      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Error saving profile:', error);
      setError(error.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    setEditData({
      name: user.name,
      email: user.email,
      ...profile
    });
    setEditMode(true);
  };

  const handleAcceptProposal = async (proposalId) => {
    try {
      await axios.put(`/proposals/${proposalId}`, { status: 'accepted' });
      const proposalsRes = await axios.get('/proposals/user');
      setProposals(proposalsRes.data);
    } catch (error) {
      console.error('Error accepting proposal:', error);
      setError(error.response?.data?.message || 'Failed to accept proposal');
    }
  };

  const handleRejectProposal = async (proposalId) => {
    try {
      await axios.put(`/proposals/${proposalId}`, { status: 'rejected' });
      const proposalsRes = await axios.get('/proposals/user');
      setProposals(proposalsRes.data);
    } catch (error) {
      console.error('Error rejecting proposal:', error);
      setError(error.response?.data?.message || 'Failed to reject proposal');
    }
  };

  const handleWithdrawProposal = async (proposalId) => {
    try {
      await axios.put(`/proposals/${proposalId}`, { status: 'withdrawn' });
      const proposalsRes = await axios.get('/proposals/freelancer');
      setProposals(proposalsRes.data);
    } catch (error) {
      console.error('Error withdrawing proposal:', error);
      setError(error.response?.data?.message || 'Failed to withdraw proposal');
    }
  };

  // Render overview statistics
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">
                {user?.role === 'client' ? 'Jobs Posted' : 'Services Offered'}
              </p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {user?.role === 'client' ? jobs.length : services.length}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Proposals</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{proposals.length}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Reviews</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{reviews.length}</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Rating</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {reviews.length > 0
                  ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
                  : 'N/A'}
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats for Freelancers */}
      {user?.role === 'freelancer' && stats.totalEarnings > 0 && (
        <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl shadow-md p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-90 uppercase tracking-wide">Total Earnings</p>
              <p className="text-3xl font-bold mt-2">${stats.totalEarnings.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Completed Projects</p>
              <p className="text-2xl font-bold mt-1">{stats.completedJobs}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
        {proposals.slice(0, 5).length > 0 ? (
          <div className="space-y-3">
            {proposals.slice(0, 5).map((proposal) => (
              <div key={proposal._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{proposal.job?.title || 'Service'}</p>
                  <p className="text-sm text-gray-500">Status: {proposal.status}</p>
                </div>
                <span className="text-sm text-gray-400">
                  {new Date(proposal.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No recent activity</p>
        )}
      </div>
    </div>
  );

  // Render profile edit form
  const renderProfile = () => (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-8">
        <div className="flex items-center space-x-4">
          <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white text-3xl font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
            <p className="text-blue-100 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">Profile Information</h3>
          {!editMode && (
            <button
              onClick={handleEditProfile}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Edit Profile
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {editMode ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                value={editData.name || ''}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                placeholder="Name"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                value={editData.email || ''}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                placeholder="Email"
                type="email"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {user?.role === 'freelancer' ? 'Bio' : 'Company'}
              </label>
              {user?.role === 'freelancer' ? (
                <textarea
                  value={editData.bio || ''}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows="4"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <input
                  value={editData.company || ''}
                  onChange={(e) => setEditData({ ...editData, company: e.target.value })}
                  placeholder="Company name"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex py-2 border-b">
              <span className="w-32 font-medium text-gray-600">Name:</span>
              <span className="text-gray-800">{user?.name}</span>
            </div>
            <div className="flex py-2 border-b">
              <span className="w-32 font-medium text-gray-600">Email:</span>
              <span className="text-gray-800">{user?.email}</span>
            </div>
            <div className="flex py-2 border-b">
              <span className="w-32 font-medium text-gray-600">Role:</span>
              <span className="text-gray-800 capitalize">{user?.role}</span>
            </div>
            {user?.role === 'freelancer' && profile?.bio && (
              <div className="flex py-2 border-b">
                <span className="w-32 font-medium text-gray-600">Bio:</span>
                <span className="text-gray-800">{profile.bio}</span>
              </div>
            )}
            {user?.role === 'client' && profile?.company && (
              <div className="flex py-2 border-b">
                <span className="w-32 font-medium text-gray-600">Company:</span>
                <span className="text-gray-800">{profile.company}</span>
              </div>
            )}
            <div className="flex py-2">
              <span className="w-32 font-medium text-gray-600">Member since:</span>
              <span className="text-gray-800">
                {new Date(user?.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render jobs or services
  const renderJobsServices = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {user?.role === 'client' ? 'My Jobs' : 'My Services'}
        </h2>
        {user?.role === 'client' ? (
          <Link
            to="/post-job"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + Post New Job
          </Link>
        ) : (
          <Link
            to="/create-service"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + Create Service
          </Link>
        )}
      </div>

      {(user?.role === 'client' ? jobs : services).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(user?.role === 'client' ? jobs : services).map((item) => (
            user?.role === 'client' ? (
              <JobCard key={item._id} job={item} showActions={false} />
            ) : (
              <ServiceCard key={item._id} service={item} showActions={false} />
            )
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No {user?.role === 'client' ? 'jobs' : 'services'} yet</h3>
          <p className="mt-2 text-gray-500">
            {user?.role === 'client' 
              ? 'Get started by posting your first job' 
              : 'Create your first service to start earning'}
          </p>
          <Link
            to={user?.role === 'client' ? '/post-job' : '/create-service'}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            {user?.role === 'client' ? 'Post a Job' : 'Create Service'}
          </Link>
        </div>
      )}
    </div>
  );

  // Render proposals
  const renderProposals = () => (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Proposals</h2>
      
      {proposals.length > 0 ? (
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <ProposalCard
              key={proposal._id}
              proposal={proposal}
              onAccept={user?.role === 'client' ? handleAcceptProposal : undefined}
              onReject={user?.role === 'client' ? handleRejectProposal : undefined}
              onWithdraw={user?.role === 'freelancer' ? handleWithdrawProposal : undefined}
              showActions={true}
              isFreelancer={user?.role === 'freelancer'}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No proposals yet</h3>
          <p className="mt-2 text-gray-500">
            {user?.role === 'client' 
              ? 'When freelancers apply to your jobs, they will appear here' 
              : 'Apply to jobs to see your proposals here'}
          </p>
          {user?.role === 'freelancer' && (
            <Link
              to="/jobs"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Browse Jobs
            </Link>
          )}
        </div>
      )}
    </div>
  );

  // Render reviews
  const renderReviews = () => (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {user?.role === 'client' ? 'Reviews About You' : 'Your Reviews'}
      </h2>
      
      {reviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((review) => (
            <ReviewCard key={review._id} review={review} showActions={false} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No reviews yet</h3>
          <p className="mt-2 text-gray-500">
            Complete projects to receive reviews from your clients
          </p>
        </div>
      )}
    </div>
  );

  if (loading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.name}! Here's what's happening with your account.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="flex flex-wrap gap-2 -mb-px">
            {[
              { id: 'overview', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
              { id: 'profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
              { id: 'jobs', label: user?.role === 'client' ? 'Jobs' : 'Services', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
              { id: 'proposals', label: 'Proposals', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
              { id: 'reviews', label: 'Reviews', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'profile' && renderProfile()}
          {activeTab === 'jobs' && renderJobsServices()}
          {activeTab === 'proposals' && renderProposals()}
          {activeTab === 'reviews' && renderReviews()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;