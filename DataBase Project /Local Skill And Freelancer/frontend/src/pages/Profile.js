import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import { AuthContext } from '../context/AuthContext';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/me');
        setProfile(res.data);
        setFormData({
          name: res.data.user.name,
          email: res.data.user.email,
          ...res.data.profile
        });
      } catch (error) {
        console.error('Failed to fetch profile', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/users/profile', {
        name: formData.name,
        email: formData.email
      });
      if (user.role === 'freelancer') {
        await api.put('/users/profile/freelancer', {
          bio: formData.bio,
          skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : [],
          hourlyRate: formData.hourlyRate,
          github: formData.github,
          linkedin: formData.linkedin,
          portfolio: formData.portfolio,
          experience: formData.experience
        });
      } else {
        await api.put('/users/profile/client', {
          company: formData.company,
          bio: formData.bio,
          github: formData.github,
          linkedin: formData.linkedin,
          portfolio: formData.portfolio
        });
      }
      setEditing(false);
      // Refresh profile
      window.location.reload();
    } catch (error) {
      console.error('Failed to update profile', error);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          {user.role === 'freelancer' ? (
            <>
              <div>
                <label className="block text-sm font-medium">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Skills (comma separated)</label>
                <input
                  type="text"
                  name="skills"
                  value={formData.skills ? formData.skills.join(', ') : ''}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value.split(',').map(s => s.trim()) })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Hourly Rate</label>
                <input
                  type="number"
                  name="hourlyRate"
                  value={formData.hourlyRate || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Experience</label>
                <textarea
                  name="experience"
                  value={formData.experience || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium">Company</label>
              <input
                type="text"
                name="company"
                value={formData.company || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium">Bio</label>
            <textarea
              name="bio"
              value={formData.bio || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">GitHub</label>
            <input
              type="url"
              name="github"
              value={formData.github || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">LinkedIn</label>
            <input
              type="url"
              name="linkedin"
              value={formData.linkedin || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Portfolio</label>
            <input
              type="url"
              name="portfolio"
              value={formData.portfolio || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Save</button>
          <button type="button" onClick={() => setEditing(false)} className="ml-2 px-4 py-2 rounded">Cancel</button>
        </form>
      ) : (
        <div className="space-y-4">
          <div><strong>Name:</strong> {profile?.user?.name}</div>
          <div><strong>Email:</strong> {profile?.user?.email}</div>
          {user.role === 'freelancer' ? (
            <>
              <div><strong>Bio:</strong> {profile?.profile?.bio}</div>
              <div><strong>Skills:</strong> {profile?.profile?.skills?.join(', ')}</div>
              <div><strong>Hourly Rate:</strong> ${profile?.profile?.hourlyRate}</div>
              <div><strong>Experience:</strong> {profile?.profile?.experience}</div>
            </>
          ) : (
            <div><strong>Company:</strong> {profile?.profile?.company}</div>
          )}
          <div><strong>Bio:</strong> {profile?.profile?.bio}</div>
          <div><strong>GitHub:</strong> {profile?.profile?.github && <a href={profile.profile.github} target="_blank" rel="noopener noreferrer">{profile.profile.github}</a>}</div>
          <div><strong>LinkedIn:</strong> {profile?.profile?.linkedin && <a href={profile.profile.linkedin} target="_blank" rel="noopener noreferrer">{profile.profile.linkedin}</a>}</div>
          <div><strong>Portfolio:</strong> {profile?.profile?.portfolio && <a href={profile.profile.portfolio} target="_blank" rel="noopener noreferrer">{profile.profile.portfolio}</a>}</div>
          <button onClick={() => setEditing(true)} className="bg-blue-500 text-white px-4 py-2 rounded">Edit Profile</button>
        </div>
      )}
    </div>
  );
};

export default Profile;
