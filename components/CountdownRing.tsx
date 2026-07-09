"use client";

interface CountdownRingProps {
  mm: string;
  ss: string;
  /** Remaining fraction 0..1 for the progress arc. */
  progress: number;
  expired?: boolean;
}

export default function CountdownRing({ mm, ss, progress, expired }: CountdownRingProps) {
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));
  const offset = circumference * (1 - clamped);

  return (
    <div className={`countdown-ring${expired ? " expired" : ""}`}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle className="countdown-track" cx="70" cy="70" r={r} />
        <circle
          className="countdown-progress"
          cx="70"
          cy="70"
          r={r}
          style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
        />
      </svg>
      <div className="countdown-num">
        {mm}:{ss}
      </div>
    </div>
  );
}
