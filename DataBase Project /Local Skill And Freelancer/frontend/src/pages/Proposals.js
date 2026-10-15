import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import { AuthContext } from '../context/AuthContext';

const Proposals = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const res = await api.get('/proposals/user');
        setProposals(res.data);
      } catch (err) {
        setError('Failed to load proposals');
      } finally {
        setLoading(false);
      }
    };
    fetchProposals();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Proposals</h1>
      {proposals.length === 0 ? (
        <p>No proposals yet.</p>
      ) : (
        <div className="space-y-4">
          {proposals.map(proposal => (
            <div key={proposal._id} className="bg-white p-4 rounded shadow">
              <h2 className="text-xl font-semibold">{proposal.job.title}</h2>
              <p>{proposal.proposalText}</p>
              <p>Proposed Price: ${proposal.proposedPrice}</p>
              <p>Status: {proposal.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Proposals;