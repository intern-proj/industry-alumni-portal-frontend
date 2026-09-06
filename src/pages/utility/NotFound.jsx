import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-bright flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative">
          <span className="font-display-hero text-[110px] leading-none font-extrabold text-slate-200 select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-primary-container/20 text-primary-container rounded-2xl flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[36px]">search_off</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-headline-lg text-slate-900">Page Not Found</h1>
          <p className="font-body-base text-slate-600">
            The page or resource you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          <Link to="/">
            <Button variant="primary" icon="home" className="w-full sm:w-auto">
              Return Home
            </Button>
          </Link>
          <Link to="/events">
            <Button variant="outline" icon="explore" className="w-full sm:w-auto">
              Explore Events
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
