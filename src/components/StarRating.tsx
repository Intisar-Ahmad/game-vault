"use client";

import { useState } from "react";
import { Star, Ban } from "lucide-react";

interface StarRatingProps {
  value: number | null;
  onChange?: (val: number | null) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const display = hoverValue !== null ? hoverValue : (value ?? -1);

  const iconSize = size === "sm" ? 14 : size === "lg" ? 22 : 18;

  return (
    <div
      className="inline-flex items-center gap-1 select-none"
      onMouseLeave={() => setHoverValue(null)}
    >
      {!readonly && (
        <button
          type="button"
          title="Rate 0 stars"
          onClick={() => onChange?.(value === 0 ? null : 0)}
          onMouseEnter={() => setHoverValue(0)}
          className={`mr-0.5 rounded p-0.5 transition-colors ${
            value === 0
              ? "text-rose-400 bg-rose-500/15"
              : "text-zinc-600 hover:text-rose-400"
          }`}
        >
          <Ban size={iconSize - 2} />
        </button>
      )}

      {[1, 2, 3, 4, 5].map((star) => {
        const isFull = display >= star;
        const isHalf = !isFull && display >= star - 0.5;

        return (
          <div key={star} className="relative" style={{ width: iconSize, height: iconSize }}>
            {/* Base empty star */}
            <Star
              size={iconSize}
              className="text-zinc-700/80"
              strokeWidth={1.75}
            />

            {/* Filled overlay (full or half) */}
            {(isFull || isHalf) && (
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ width: isFull ? "100%" : "50%" }}
              >
                <Star
                  size={iconSize}
                  className="text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.45)]"
                  strokeWidth={1.75}
                />
              </div>
            )}

            {/* Left & Right click/hover hitboxes */}
            {!readonly && (
              <>
                <button
                  type="button"
                  aria-label={`Rate ${star - 0.5} stars`}
                  onMouseEnter={() => setHoverValue(star - 0.5)}
                  onClick={() => onChange?.(star - 0.5)}
                  className="absolute inset-y-0 left-0 w-1/2 cursor-pointer"
                />
                <button
                  type="button"
                  aria-label={`Rate ${star} stars`}
                  onMouseEnter={() => setHoverValue(star)}
                  onClick={() => onChange?.(star)}
                  className="absolute inset-y-0 right-0 w-1/2 cursor-pointer"
                />
              </>
            )}
          </div>
        );
      })}

      <span className="ml-1.5 font-mono text-xs text-zinc-400 min-w-[2.2rem]">
        {value === null ? "—" : value.toFixed(1)}
      </span>
    </div>
  );
}