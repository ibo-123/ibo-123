import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await register(name, email, password);
      setMessage('Registration successful! Please login.');
      setName('');
      setEmail('');
      setPassword('');
      setTimeout(() => navigate('/login'), 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-form">
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Name
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </label>
        <button type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</button>
        {error && <div className="form-error">{error}</div>}
        {message && <div className="form-success">{message}</div>}
      </form>
      <p>
        Already registered? <Link to="/login">Login here</Link>
      </p>
    </section>
  );
}
