import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Courses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await api.get('/courses');
        setCourses(response.data);
        if (user?.role) {
          const enrolled = response.data.filter((course) => course.students?.some((student) => student._id === user.id));
          setEnrolledIds(enrolled.map((course) => course._id));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Cannot load courses.');
      }
    };
    loadCourses();
  }, [user]);

  const handleEnroll = async (courseId) => {
    setError('');
    setMessage('');
    try {
      await api.post(`/courses/${courseId}/enroll`);
      setMessage('Successfully enrolled in the course.');
      setEnrolledIds((ids) => [...ids, courseId]);
    } catch (err) {
      setError(err.response?.data?.message || 'Enrollment failed.');
    }
  };

  return (
    <section className="page-courses">
      <h1>Courses</h1>
      {error && <div className="form-error">{error}</div>}
      {message && <div className="form-success">{message}</div>}
      <div className="card-grid">
        {courses.map((course) => (
          <div className="card" key={course._id}>
            <h3>{course.title}</h3>
            <p>{course.description || 'No description yet.'}</p>
            <p><strong>Instructor:</strong> {course.instructor}</p>
            <p><strong>Students:</strong> {course.students?.length || 0}</p>
            <button
              type="button"
              onClick={() => handleEnroll(course._id)}
              disabled={enrolledIds.includes(course._id)}
            >
              {enrolledIds.includes(course._id) ? 'Enrolled' : 'Enroll'}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
