"use client";

import React, { useState, useEffect } from "react";
import { getGravatarUrl, getInitials } from "@/lib/avatar";

interface StudentAvatarProps {
  email?: string;
  name?: string;
  avatarUrl?: string; // DB saved custom photo or Google OAuth photo
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function StudentAvatar({
  email,
  name,
  avatarUrl,
  size = 42,
  className = "",
  style = {},
}: StudentAvatarProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [useInitialsFallback, setUseInitialsFallback] = useState(false);

  useEffect(() => {
    // Reset state on prop changes
    setUseInitialsFallback(false);

    if (avatarUrl && avatarUrl.trim() !== "") {
      setSrc(avatarUrl);
    } else if (email && email.trim() !== "") {
      // Fetch gravatar with d=404 so it fires onError if no gravatar exists
      setSrc(getGravatarUrl(email, size));
    } else {
      setUseInitialsFallback(true);
    }
  }, [email, avatarUrl, size]);

  const handleError = () => {
    if (src && src.includes("gravatar.com")) {
      // Gravatar failed or returned 404, fall back to initials
      setUseInitialsFallback(true);
    } else if (src && email) {
      // Custom avatarUrl failed, try Gravatar next
      setSrc(getGravatarUrl(email, size));
    } else {
      setUseInitialsFallback(true);
    }
  };

  const initials = getInitials(name);

  if (useInitialsFallback || !src) {
    // Branded theme gradient background for initials avatar
    return (
      <div
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: `${size * 0.4}px`,
          fontWeight: "900",
          border: "1.5px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0 2px 8px rgba(30, 58, 138, 0.15)",
          flexShrink: 0,
          ...style,
        }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name || "User Avatar"}
      className={className}
      onError={handleError}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        objectFit: "cover",
        border: "1.5px solid rgba(0, 0, 0, 0.08)",
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
