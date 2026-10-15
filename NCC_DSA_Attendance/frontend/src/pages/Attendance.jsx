import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Attendance() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [status, setStatus] = useState('present');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [attendanceRes, coursesRes] = await Promise.all([
          api.get('/attendance/me'),
          api.get('/courses'),
        ]);

        setAttendance(attendanceRes.data);
        setCourses(coursesRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load attendance data.');
      }
    };
    loadData();
  }, []);

  const handleMarkAttendance = async (evt) => {
    evt.preventDefault();
    setError('');
    setMessage('');

    if (!selectedCourseId) {
      setError('Choose a course before marking attendance.');
      return;
    }

    try {
      await api.post(`/attendance/${selectedCourseId}/mark`, { status });
      setMessage('Attendance marked successfully.');
      const response = await api.get('/attendance/me');
      setAttendance(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark attendance.');
    }
  };

  const enrolledCourseIds = courses
    .filter((course) => course.students?.some((student) => student._id === user.id))
    .map((course) => course._id);
  const enrolledCourses = courses.filter((course) => enrolledCourseIds.includes(course._id));

  return (
    <section className="page-attendance">
      <h1>Attendance</h1>
      {error && <div className="form-error">{error}</div>}
      {message && <div className="form-success">{message}</div>}

      <div className="card-grid">
        <div className="card">
          <h2>Mark Attendance</h2>
          <form onSubmit={handleMarkAttendance}>
            <label>
              Course
              <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
                <option value="">Select course</option>
                {enrolledCourses.length ? (
                  enrolledCourses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.title}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    Enroll in a course first
                  </option>
                )}
              </select>
            </label>
            <label>
              Status
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
              </select>
            </label>
            <button type="submit">Mark Attendance</button>
          </form>
        </div>

        <div className="card">
          <h2>Attendance History</h2>
          {attendance.length ? (
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Course</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((record) => (
                  <tr key={record._id}>
                    <td>{new Date(record.date).toLocaleDateString()}</td>
                    <td>{record.courseId?.title || 'Unknown'}</td>
                    <td className={record.status}>{record.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No attendance records yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
