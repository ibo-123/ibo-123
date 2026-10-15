import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get('/users/profile');
        setProfile(response.data);
        setCourses(response.data.enrolledCourses || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load dashboard.');
      }
    };

    loadProfile();
  }, []);

  return (
    <section className="page-dashboard">
      <h1>Welcome, {user?.name || 'student'}</h1>
      {error && <div className="form-error">{error}</div>}
      {profile ? (
        <div className="card-grid">
          <div className="card">
            <h2>Your profile</h2>
            <p><strong>Name:</strong> {profile.name}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Role:</strong> {profile.role}</p>
            <p><strong>Enrolled courses:</strong> {courses.length}</p>
          </div>
          <div className="card">
            <h2>Enrolled courses</h2>
            {courses.length ? (
              <ul>
                {courses.map((course) => (
                  <li key={course._id}>
                    <strong>{course.title}</strong> • {course.instructor}
                  </li>
                ))}
              </ul>
            ) : (
              <p>You are not yet enrolled in any course.</p>
            )}
          </div>
        </div>
      ) : (
        <p>Loading profile...</p>
      )}
    </section>
  );
}
