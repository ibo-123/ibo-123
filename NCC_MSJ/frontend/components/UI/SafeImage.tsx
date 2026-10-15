"use client";

import { useState } from "react";
import Image from "next/image";

interface SafeImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
}

export default function SafeImage({
  src,
  alt,
  width,
  height,
  className = "",
  fill = false,
  priority = false,
  sizes = "100vw",
}: SafeImageProps) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={fill ? { width: "100%", height: "100%" } : { width, height }}
      >
        <span className="text-gray-500 text-sm">{alt.charAt(0)}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      className={className}
      fill={fill}
      priority={priority}
      sizes={sizes}
      onError={() => setError(true)}
    />
  );
}
