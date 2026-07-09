export default function LoadingSpinner({
  size = 22,
  label,
}: {
  size?: number;
  label?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        color: "#666",
        fontSize: "13px",
        padding: "14px 2px",
      }}
      role="status"
      aria-live="polite"
    >
      <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Loading">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
        <path
          d="M12 3 a9 9 0 0 1 9 9"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 12 12"
            to="360 12 12"
            dur="0.8s"
            repeatCount="indefinite"
          />
        </path>
      </svg>
      {label ? <span>{label}</span> : null}
    </div>
  );
}
