"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const DEFAULT_REF_CODE = ""; // Indie Kit referrals (utm ref)

export type BuiltWithBadgeProps = {
  variant?: "compact" | "default";
  className?: string;
  /** Attribution link; defaults Indie Kit homepage */
  productUrl?: string;
  productLabel?: string;
  /** Optional SVG/PNG logo from /public */
  logoSrc?: string;
};

export function BuiltWithBadge({
  variant = "default",
  className,
  productUrl,
  productLabel = "Indie Kit",
  logoSrc = "/assets/indie-kit.svg",
}: BuiltWithBadgeProps) {
  const getUtmSource = () => {
    if (typeof window !== "undefined") {
      return window.location.hostname;
    }
    if (process.env.NEXT_PUBLIC_APP_URL) {
      try {
        return new URL(process.env.NEXT_PUBLIC_APP_URL).hostname;
      } catch {
        return "unknown";
      }
    }
    return "unknown";
  };

  const utmSource = getUtmSource();
  const baseUrl =
    productUrl ??
    `https://indiekit.pro?utm_source=${encodeURIComponent(utmSource)}&utm_campaign=built-with-kit&ref=${DEFAULT_REF_CODE}`;

  const imageSize = variant === "compact" ? 16 : 20;

  return (
    <Link
      href={baseUrl}
      target="_blank"
      rel="dofollow noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary",
        variant === "compact" ? "text-xs" : "text-sm",
        className
      )}
      aria-label={`Built with ${productLabel}`}
    >
      <span>Built with</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoSrc}
        alt=""
        width={imageSize}
        height={imageSize}
        className="inline-block"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
      <span className="font-medium">{productLabel}</span>
    </Link>
  );
}
