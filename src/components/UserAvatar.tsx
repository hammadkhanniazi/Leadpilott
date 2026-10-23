import React, { useState } from 'react';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  role?: string;
}

/**
 * Validates whether an avatar URL is an authentic uploaded image or account photo,
 * explicitly rejecting mock images, stock photography, or automatically generated placeholders.
 */
export const isValidUserPhoto = (url?: string | null): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return false;

  // Never treat AI-generated, Unsplash stock photos, Dicebear, or mock URLs as user photos
  if (
    trimmed.includes('images.unsplash.com') ||
    trimmed.includes('unsplash.com') ||
    trimmed.includes('dicebear.com') ||
    trimmed.includes('placeholder') ||
    trimmed.includes('pravatar') ||
    trimmed.includes('aida-public') ||
    trimmed.includes('thispersondoesnotexist')
  ) {
    return false;
  }

  // Authentic uploaded or OAuth account photos:
  // - Data URLs from manual local file uploads (data:image/...)
  // - Blob URLs (blob:...)
  // - Firebase Storage uploaded URLs (firebasestorage.googleapis.com)
  // - Google Workspace / Google OAuth account photos (googleusercontent.com, excluding aida-public)
  return (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:') ||
    trimmed.includes('firebasestorage.googleapis.com') ||
    (trimmed.includes('googleusercontent.com') && !trimmed.includes('aida-public'))
  );
};

/**
 * Generates clean uppercase initials from a user's full name.
 */
export const getInitials = (name?: string): string => {
  if (!name || !name.trim()) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  className = '',
  role,
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const isValid = !imageFailed && isValidUserPhoto(avatarUrl);
  const initials = getInitials(name);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm font-semibold',
    lg: 'w-12 h-12 text-base font-bold',
    xl: 'w-16 h-16 text-lg font-bold',
  }[size];

  if (isValid && avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        onError={() => setImageFailed(true)}
        className={`${sizeClasses} rounded-full object-cover shrink-0 select-none ring-1 ring-surface-container ${className}`}
      />
    );
  }

  // Consistent neutral placeholder avatar with user initials
  return (
    <div
      aria-label={name}
      title={name}
      className={`${sizeClasses} rounded-full bg-surface-container-high text-on-surface-variant font-semibold flex items-center justify-center shrink-0 select-none border border-outline-variant/30 tracking-tight shadow-2xs ${className}`}
    >
      <span>{initials}</span>
    </div>
  );
};
