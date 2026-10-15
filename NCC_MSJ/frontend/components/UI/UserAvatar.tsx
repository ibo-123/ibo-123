"use client";

import { useState } from "react";

interface UserAvatarProps {
  name: string;
  profileImage?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function UserAvatar({
  name,
  profileImage,
  size = "md",
  className = "",
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  const getInitials = () => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // If no image or image failed to load, show initials
  if (!profileImage || imgError) {
    return (
      <div
        className={`
        ${sizeClasses[size]} 
        rounded-full 
        bg-gradient-to-r from-green-600 to-emerald-500 
        flex items-center justify-center text-white font-bold 
        ${className}
      `}
      >
        {getInitials()}
      </div>
    );
  }

  // Show image
  return (
    <div
      className={`${sizeClasses[size]} rounded-full overflow-hidden ${className}`}
    >
      <img
        src={profileImage}
        alt={name}
        className="w-full h-full object-cover"
        onError={() => setImgError(true)}
      />
    </div>
  );
}
