import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Alert } from '../../components/ui';
import { BrandMark } from '../../components/Icons';
import { inputClass, primaryButtonClass } from '../../components/formStyles';
import { dashboardPath } from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';

const points = [
  'Admins assign work, set deadlines, and review submissions.',
  'Contributors complete the required fields and send work for review.',
  'Approved content stays ready for handoff to the main platform.',
];

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-500">
        Loading...
      </div>
    );
  }

  if (user) {
    return <Navigate to={dashboardPath(user.role)} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const loggedInUser = await login(email, password);
      navigate(dashboardPath(loggedInUser.role), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-slate-100 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-slate-950 px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <BrandMark />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-300">TemariHub</p>
            <p className="text-sm text-slate-300">Contributor platform</p>
          </div>
        </div>
        <div className="relative max-w-lg">
          <h1 className="text-4xl font-semibold tracking-tight">
            Prepare, review, and approve contributor work in one place.
          </h1>
          <ul className="mt-8 space-y-4 text-sm leading-6 text-slate-300">
            {points.map((point) => (
              <li key={point} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-slate-500">Use the account issued to you.</p>
      </section>

      <section className="flex items-center justify-center px-4 py-16">
        <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <BrandMark className="h-8 w-8" />
            <p className="text-sm font-semibold text-slate-900">TemariHub</p>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Sign in</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Admin and contributor accounts use the same sign-in.</p>

          <label className="mt-8 block text-sm font-medium text-slate-700" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />

          <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
          />

          {error ? (
            <div className="mt-4">
              <Alert>{error}</Alert>
            </div>
          ) : null}

          <button type="submit" disabled={submitting} className={`${primaryButtonClass} mt-6 w-full`}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </div>
  );
}
