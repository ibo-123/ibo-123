import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
    <div className="bg-white shadow rounded-xl p-10 text-center">
      <h1 className="text-5xl font-bold text-slate-900 mb-4">404</h1>
      <p className="text-slate-600 mb-6">Page not found. The link may be broken or the page may have been moved.</p>
      <Link to="/" className="inline-flex items-center justify-center rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700">
        Go back home
      </Link>
    </div>
  </div>
);

export default NotFound;
