import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center space-y-6 max-w-3xl mx-auto mt-20">
        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
          Welcome to the Industry Alumni Portal
        </h1>
        <p className="text-xl text-slate-600">
          Connect with industry partners, explore vacancies, and manage your events efficiently.
        </p>
        <div className="flex justify-center gap-4 mt-8">
          <Link to="/login" className="px-6 py-3 bg-emerald-600 text-white rounded-md font-medium hover:bg-emerald-700 transition">
            Sign In to Portal
          </Link>
          <a href="#about" className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-md font-medium hover:bg-slate-50 transition">
            Learn More
          </a>
        </div>
      </div>
    </div>
  );
}
