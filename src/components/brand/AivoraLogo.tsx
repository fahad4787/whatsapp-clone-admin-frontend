"use client";

type AivoraLogoProps = {
  size?: number;
  animated?: boolean;
  className?: string;
  title?: string;
};

/**
 * Aivora Node mark — green fill, white chat + call, no dots / wifi.
 * Soft connector + handset motion when animated.
 */
export function AivoraLogo({
  size = 36,
  animated = true,
  className = "",
  title = "Aivora",
}: AivoraLogoProps) {
  const id = `av-node-${size}`;

  return (
    <span
      className={`aivora-logo aivora-logo--node inline-flex shrink-0 ${animated ? "aivora-logo--live" : ""} ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={title}
    >
      <svg viewBox="0 0 48 48" width={size} height={size} fill="none" aria-hidden>
        <defs>
          <linearGradient id={`${id}-bg`} x1="6" y1="2" x2="44" y2="46" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1ecf75" offset="0" />
            <stop stopColor="#129a55" offset="0.55" />
            <stop stopColor="#086638" offset="1" />
          </linearGradient>
          <radialGradient id={`${id}-sheen`} cx="32%" cy="28%" r="70%">
            <stop stopColor="#ffffff" stopOpacity="0.34" offset="0" />
            <stop stopColor="#ffffff" stopOpacity="0" offset="1" />
          </radialGradient>
          <linearGradient id={`${id}-sweep`} x1="0" y1="0" x2="48" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" stopOpacity="0" offset="0" />
            <stop stopColor="#ffffff" stopOpacity="0.35" offset="0.5" />
            <stop stopColor="#ffffff" stopOpacity="0" offset="1" />
          </linearGradient>
        </defs>

        <rect x="1.5" y="1.5" width="45" height="45" rx="14" fill={`url(#${id}-bg)`} />
        <rect x="1.5" y="1.5" width="45" height="45" rx="14" fill={`url(#${id}-sheen)`} />

        {/* Soft light sweep (replaces wifi animation) */}
        <rect
          className="aivora-logo__sweep"
          x="-20"
          y="1.5"
          width="18"
          height="45"
          fill={`url(#${id}-sweep)`}
          opacity="0.55"
        />

        {/* Connector between chat & call */}
        <path
          className="aivora-logo__link"
          d="M17 26.5 H31"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />

        {/* Comment bubble + chat dots */}
        <g className="aivora-logo__chat">
          <rect x="9" y="18" width="15" height="13" rx="4.5" fill="#ffffff" />
          <path d="M13 31 L13 36.5 L18.5 31 Z" fill="#ffffff" />
          <circle className="aivora-logo__chat-dot aivora-logo__chat-dot--1" cx="13.2" cy="24.5" r="1.35" fill="#0b7a42" />
          <circle className="aivora-logo__chat-dot aivora-logo__chat-dot--2" cx="16.5" cy="24.5" r="1.35" fill="#0b7a42" opacity="0.7" />
          <circle className="aivora-logo__chat-dot aivora-logo__chat-dot--3" cx="19.8" cy="24.5" r="1.35" fill="#0b7a42" opacity="0.45" />
        </g>

        {/* Call node */}
        <g className="aivora-logo__call">
          <circle cx="34.5" cy="26.5" r="8" fill="#ffffff" />
          <g transform="translate(34.5 26.5) rotate(-25) scale(0.95)">
            <g className="aivora-logo__handset">
              <path
                d="M-3.8 -.75c-.65-1.55.22-2.4 1.55-3l.82-.3c.42-.15.82.05.98.5l.5 1.4c.15.42 0 .82-.35 1.05l-.65.4c.65 1.25 1.55 2.15 2.85 2.85l.4-.65c.22-.35.63-.5 1.05-.35l1.4.5c.45.15.65.56.5.98l-.3.82c-.55 1.33-1.45 2.15-3 1.55-3-1.2-5.25-3.45-6.45-6.45z"
                fill="#0b7a42"
              />
            </g>
          </g>
        </g>
      </svg>
    </span>
  );
}

type AivoraBrandProps = {
  size?: number;
  subtitle?: string;
  inverted?: boolean;
  collapsed?: boolean;
  animated?: boolean;
  className?: string;
};

export function AivoraBrand({
  size = 36,
  subtitle,
  inverted = false,
  collapsed = false,
  animated = true,
  className = "",
}: AivoraBrandProps) {
  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <AivoraLogo size={size} animated={animated} />
      {!collapsed ? (
        <div className="min-w-0">
          <div
            className={`truncate text-[14px] font-extrabold tracking-tight ${
              inverted ? "text-white" : "text-bp-ink"
            }`}
          >
            Aivora
          </div>
          {subtitle ? (
            <div
              className={`text-[10px] font-bold tracking-[0.08em] uppercase ${
                inverted ? "text-white/55" : "text-bp-muted"
              }`}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
