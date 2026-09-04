import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import bannerService from '../../services/bannerService';

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

  // Editable / Contextual icon
  const icon = banner.icon || (
    banner.type === 'MAINTENANCE'
      ? 'engineering'
      : banner.priority === 'HIGH' || banner.priority === 'URGENT'
      ? 'warning'
      : banner.priority === 'MEDIUM'
      ? 'campaign'
      : 'info'
  );

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
            className={`animate-marquee-ticker inline-flex items-center gap-12 font-medium text-sm tracking-wide px-4 ${isPaused ? '[animation-play-state:paused]' : ''}`}
            style={{ color: textColor }}
          >
            <span>{banner.message}</span>
            <span style={{ opacity: 0.25 }} className="mx-2">|</span>
            <span>{banner.message}</span>
            <span style={{ opacity: 0.25 }} className="mx-2">|</span>
            <span>{banner.message}</span>
            <span style={{ opacity: 0.25 }} className="mx-2">|</span>
          </div>
        ) : (
          <div
            ref={textRef}
            className="px-4 font-medium text-sm tracking-wide truncate"
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
    async function fetchBanners() {
      try {
        const banners = await bannerService.getActiveBanners();
        setActiveBanners(banners);
      } catch (error) {
        console.error('Failed to load active banners:', error);
      }
    }
    fetchBanners();
  }, []);

  // Guarantee banner is never displayed on any admin page or dashboard
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

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
