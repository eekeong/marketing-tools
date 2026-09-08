"use client";

import { useState, ReactNode } from "react";

export default function ReelThumb({
  thumbnailUrl,
  igUrl,
  color,
  className = "",
  children,
}: {
  thumbnailUrl: string | null;
  igUrl: string;
  color: string;
  className?: string;
  children?: ReactNode;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = thumbnailUrl && !imgFailed;

  return (
    <a
      href={igUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`relative flex items-center justify-center text-white text-3xl overflow-hidden group ${className}`}
      style={!showImage ? { background: `linear-gradient(160deg, ${color}, ${color}88)` } : undefined}
    >
      {showImage && (
        // Instagram's CDN URLs are signed and expire after a while — fall back to the gradient placeholder if the image 404s.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnailUrl}
          alt=""
          onError={() => setImgFailed(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <span className="relative z-10 drop-shadow group-hover:scale-110 transition-transform">▶</span>
      {children}
    </a>
  );
}
