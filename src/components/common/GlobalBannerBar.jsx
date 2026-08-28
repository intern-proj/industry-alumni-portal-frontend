import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const storageKey = 'portal_system_banners_data';

// Default color options admins can choose when creating banners
const BANNER_COLORS = [
  { label: 'Royal Blue',    value: '#1d4ed8', text: '#e0e7ff' },
  { label: 'Crimson Red',   value: '#b91c1c', text: '#fee2e2' },
  { label: 'Forest Green',  value: '#15803d', text: '#dcfce7' },
  { label: 'Deep Purple',   value: '#7e22ce', text: '#f3e8ff' },
  { label: 'Amber Orange',  value: '#b45309', text: '#fef3c7' },
  { label: 'Dark Teal',     value: '#0f766e', text: '#ccfbf1' },
  { label: 'Slate Dark',    value: '#1e293b', text: '#e2e8f0' },
  { label: 'Fuchsia',       value: '#a21caf', text: '#fae8ff' },
];

function BannerTickerItem({ banner, onDismiss }) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const bg = banner.color || '#1d4ed8';
  const textColor = banner.textColor || '#e0e7ff';

  useEffect(() => {
    function checkOverflow() {
      if (containerRef.current && textRef.current) {
        const isLong = textRef.current.scrollWidth > containerRef.current.clientWidth - 20
          || banner.message.length > 80;
        setIsOverflowing(isLong);
      }
    }
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [banner.message]);

  // Priority icon
  const icon = banner.priority === 'HIGH' || banner.priority === 'URGENT'
    ? 'warning'
    : banner.priority === 'MEDIUM'
    ? 'campaign'
    : 'info';

  return (
    <div
      className="w-full rounded-none border-y border-x-0 flex items-stretch shadow-lg overflow-hidden"
      style={{ backgroundColor: bg, borderColor: `${textColor}20` }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Left Icon Corner - flush to edge */}
      <div
        className="flex items-center justify-center w-12 sm:w-14 shrink-0 border-r"
        style={{ backgroundColor: `${textColor}15`, borderColor: `${textColor}20` }}
      >
        <span
          className="material-symbols-outlined text-[22px]"
          style={{ color: textColor }}
        >
          {icon}
        </span>
      </div>

      {/* Center: Text / Marquee */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden flex items-center py-2.5"
      >
        {/* Fade masks for marquee */}
        {isOverflowing && (
          <>
            <div
              className="absolute left-0 top-0 bottom-0 w-10 z-10 pointer-events-none"
              style={{ background: `linear-gradient(to right, ${bg}, transparent)` }}
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-10 z-10 pointer-events-none"
              style={{ background: `linear-gradient(to left, ${bg}, transparent)` }}
            />
          </>
        )}

        {isOverflowing ? (
          <div
            className={`animate-marquee-ticker inline-flex items-center gap-16 font-semibold text-sm tracking-wide px-4 ${isPaused ? '[animation-play-state:paused]' : ''}`}
            style={{ color: textColor }}
          >
            <span>{banner.message}</span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span>{banner.message}</span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span>{banner.message}</span>
            <span style={{ opacity: 0.4 }}>•</span>
          </div>
        ) : (
          <div
            ref={textRef}
            className="px-4 font-semibold text-sm tracking-wide truncate"
            style={{ color: textColor }}
          >
            {banner.message}
          </div>
        )}
      </div>

      {/* Right Dismiss Corner - flush to edge */}
      <button
        type="button"
        onClick={() => onDismiss(banner.id)}
        className="flex items-center justify-center w-12 sm:w-14 shrink-0 border-l transition-opacity hover:opacity-75 cursor-pointer"
        style={{ backgroundColor: `${textColor}15`, borderColor: `${textColor}20` }}
        title="Dismiss"
      >
        <span
          className="material-symbols-outlined text-[20px]"
          style={{ color: textColor }}
        >
          close
        </span>
      </button>
    </div>
  );
}

export default function GlobalBannerBar() {
  const location = useLocation();
  const { user, hasAnyRole } = useAuth();
  const [activeBanners, setActiveBanners] = useState([]);
  const [dismissedIds, setDismissedIds] = useState([]);

  useEffect(() => {
    function loadBanners() {
      try {
        const saved = localStorage.getItem(storageKey);
        if (!saved) { setActiveBanners([]); return; }
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) return;
        const today = new Date().toISOString().split('T')[0];
        const valid = parsed.filter((b) => {
          if (!b.active) return false;
          if (b.startDate && b.startDate > today) return false;
          if (b.endDate && b.endDate < today) return false;
          return true;
        });
        setActiveBanners(valid);
      } catch { setActiveBanners([]); }
    }

    loadBanners();
    window.addEventListener('storage', loadBanners);
    window.addEventListener('bannersUpdated', loadBanners);
    return () => {
      window.removeEventListener('storage', loadBanners);
      window.removeEventListener('bannersUpdated', loadBanners);
    };
  }, []);



  const visibleBanners = activeBanners.filter((b) => !dismissedIds.includes(b.id));
  if (visibleBanners.length === 0) return null;

  return (
    <div className="w-full z-30 block">
      {visibleBanners.map((banner) => (
        <BannerTickerItem
          key={banner.id}
          banner={banner}
          onDismiss={(id) => setDismissedIds((prev) => [...prev, id])}
        />
      ))}
    </div>
  );
}

// Export the color palette so the banner management page can use it
export { BANNER_COLORS };
