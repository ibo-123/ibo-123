import React, { useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import JobCard from '../components/JobCard';
import ServiceCard from '../components/ServiceCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { AuthContext } from '../context/AuthContext';

const categories = [
  { id: 'web', name: 'Web Development', icon: '💻', color: 'bg-blue-100 text-blue-700' },
  { id: 'design', name: 'Design', icon: '🎨', color: 'bg-purple-100 text-purple-700' },
  { id: 'marketing', name: 'Marketing', icon: '📢', color: 'bg-green-100 text-green-700' },
  { id: 'writing', name: 'Writing', icon: '✍️', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'mobile', name: 'Mobile', icon: '📱', color: 'bg-orange-100 text-orange-700' },
  { id: 'support', name: 'Support', icon: '🎧', color: 'bg-red-100 text-red-700' }
];

const Home = () => {
  const [jobs, setJobs] = useState([]);
  const [services, setServices] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('jobs');
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalServices: 0,
    totalFreelancers: 0,
    recentActivity: []
  });
  
  const { user } = useContext(AuthContext);

  const fetchDataRef = useRef(false);

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (fetchDataRef.current) return;
    fetchDataRef.current = true;

    setLoading(true);
    setError(null);

    try {
      const [jobsRes, servicesRes, statsRes] = await Promise.all([
        api.get('/jobs?limit=100'),
        api.get('/services?limit=100'),
        api.get('/stats/home')
      ]);

      setJobs(jobsRes.data);
      setServices(servicesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching home data:', error);
      setError(error.response?.data?.message || 'Failed to load data. Please try again.');
    } finally {
      fetchDataRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (isMounted) {
        await fetchData();
      }
    };

    loadData();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [fetchData]); // Include fetchData as dependency

  // Filter jobs based on search query and category
  const filteredJobs = useMemo(() => {
    if (!jobs.length) return [];

    return jobs.filter((job) => {
      const normalizedQuery = query.toLowerCase().trim();
      const matchesQuery = !normalizedQuery ||
        job.title?.toLowerCase().includes(normalizedQuery) ||
        job.description?.toLowerCase().includes(normalizedQuery) ||
        job.skills?.some(skill => skill.toLowerCase().includes(normalizedQuery));

      const matchesCategory = !selectedCategory ||
        job.title?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        job.description?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        job.category?.toLowerCase().includes(selectedCategory.toLowerCase());

      return matchesQuery && matchesCategory;
    });
  }, [jobs, query, selectedCategory]);

  // Filter services based on search query and category
  const filteredServices = useMemo(() => {
    if (!services.length) return [];
    
    return services.filter((service) => {
      const normalizedQuery = query.toLowerCase().trim();
      const matchesQuery = !normalizedQuery ||
        service.title?.toLowerCase().includes(normalizedQuery) ||
        service.description?.toLowerCase().includes(normalizedQuery) ||
        service.skills?.some(skill => skill.toLowerCase().includes(normalizedQuery));
      
      const matchesCategory = !selectedCategory ||
        service.title?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        service.description?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        service.category?.toLowerCase().includes(selectedCategory.toLowerCase());
      
      return matchesQuery && matchesCategory;
    });
  }, [services, query, selectedCategory]);

  // Get unique freelancers count
  const uniqueFreelancers = useMemo(() => {
    const freelancers = new Set();
    services.forEach(service => {
      const name = service.freelancer?.user?.name || service.freelancer?.name;
      if (name) freelancers.add(name);
    });
    return freelancers.size;
  }, [services]);

  // Handle search input with debounce
  const handleSearchChange = (e) => {
    setQuery(e.target.value);
  };

  // Clear all filters
  const clearFilters = () => {
    setQuery('');
    setSelectedCategory('');
  };

  // Get featured items (highest rated or recently added)
  const featuredJobs = useMemo(() => {
    return [...filteredJobs]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);
  }, [filteredJobs]);

  const featuredServices = useMemo(() => {
    return [...filteredServices]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 6);
  }, [filteredServices]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading amazing opportunities..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full filter blur-3xl opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full filter blur-3xl opacity-20"></div>
        
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-4 py-2 text-sm font-semibold text-white mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>Local Talent Marketplace</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6">
              Find trusted freelancers
              <br />
              <span className="text-blue-200">for local projects</span>
            </h1>
            
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Connect with skilled professionals in your area. Post jobs, hire freelancers, and get work done faster.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/jobs"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white text-slate-900 font-semibold hover:bg-gray-100 transition transform hover:scale-105"
              >
                Explore Jobs
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              
              {user?.role === 'client' && (
                <Link
                  to="/post-job"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full border-2 border-white/30 bg-white/10 text-white font-semibold hover:bg-white/20 transition"
                >
                  Post a Job
                </Link>
              )}
              
              {!user && (
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full border-2 border-white/30 bg-white/10 text-white font-semibold hover:bg-white/20 transition"
                >
                  Get Started
                </Link>
              )}
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-white">{stats.totalJobs || jobs.length}</div>
              <div className="text-sm text-blue-100 mt-1">Active Jobs</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-white">{stats.totalServices || services.length}</div>
              <div className="text-sm text-blue-100 mt-1">Services Offered</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-white">{stats.totalFreelancers || uniqueFreelancers}</div>
              <div className="text-sm text-blue-100 mt-1">Trusted Freelancers</div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 -mt-20 relative z-10">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  value={query}
                  onChange={handleSearchChange}
                  placeholder="Search for web development, design, marketing..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-12 pr-4 py-4 text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setActiveSection('jobs')}
                className={`px-6 py-3 rounded-xl font-semibold transition ${
                  activeSection === 'jobs'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Find Jobs
              </button>
              <button
                onClick={() => setActiveSection('services')}
                className={`px-6 py-3 rounded-xl font-semibold transition ${
                  activeSection === 'services'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Find Services
              </button>
            </div>
          </div>

          {/* Categories */}
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  selectedCategory === category.name
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
            {(query || selectedCategory) && (
              <button
                onClick={clearFilters}
                className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Jobs Section */}
      {activeSection === 'jobs' && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Available Jobs</h2>
              <p className="text-gray-600 mt-1">
                {filteredJobs.length} {filteredJobs.length === 1 ? 'opportunity' : 'opportunities'} found
              </p>
            </div>
            <Link
              to="/jobs"
              className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {filteredJobs.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredJobs.map((job) => (
                <JobCard key={job._id} job={job} variant="default" />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-2xl">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No jobs found</h3>
              <p className="mt-2 text-gray-500">
                Try adjusting your search or browse all available jobs.
              </p>
              <button
                onClick={clearFilters}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>
      )}

      {/* Services Section */}
      {activeSection === 'services' && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Popular Services</h2>
              <p className="text-gray-600 mt-1">
                {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'} available
              </p>
            </div>
            <Link
              to="/services"
              className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {filteredServices.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredServices.map((service) => (
                <ServiceCard key={service._id} service={service} variant="default" />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-2xl">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No services found</h3>
              <p className="mt-2 text-gray-500">
                Try adjusting your search or check back later for new services.
              </p>
              <button
                onClick={clearFilters}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>
      )}

      {/* CTA Section for Non-authenticated Users */}
      {!user && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to start your project?
            </h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Join thousands of freelancers and clients already using our platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="px-6 py-3 bg-white text-blue-600 rounded-full font-semibold hover:bg-gray-100 transition"
              >
                Sign Up Free
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 border-2 border-white text-white rounded-full font-semibold hover:bg-white/10 transition"
              >
                Login to Account
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;