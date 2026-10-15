import React from 'react';

const Footer = () => (
  <footer className="bg-slate-900 text-slate-200 py-6">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-sm">
      <p>© {new Date().getFullYear()} Freelance Marketplace. All rights reserved.</p>
    </div>
  </footer>
);

export default Footer;
