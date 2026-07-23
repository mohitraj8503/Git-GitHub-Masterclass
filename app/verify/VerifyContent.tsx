"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

type CertificateData = {
  certificateId: string;
  recipientName: string;
  workshopName: string;
  organizedBy: string;
  collaborators: string[];
  completionDate: string;
  issuedAt: string;
  status: string;
};

type VerifyResult = {
  valid: boolean;
  status?: string;
  message?: string;
  certificate?: CertificateData;
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const idFromQR = searchParams.get("id");

  const [inputId, setInputId] = useState(idFromQR || "");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const runVerify = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setSearched(true);
    setResult(null);
    try {
      const res = await fetch(`/api/certificates/verify?id=${encodeURIComponent(id.trim())}`);
      const data: VerifyResult = await res.json();
      setResult(data);
    } catch {
      setResult({ valid: false, message: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // Auto-verify on QR scan (URL has ?id= param)
  useEffect(() => {
    if (idFromQR) runVerify(idFromQR);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idFromQR]);

  const handleSearch = () => {
    if (!inputId.trim()) return;
    // Update URL so the result is shareable
    router.push(`/verify?id=${encodeURIComponent(inputId.trim())}`);
    runVerify(inputId);
  };

  const isRevoked = result && !result.valid && result.status === "REVOKED";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#090D16",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "64px 16px 48px",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Back link */}
      <div style={{ width: "100%", maxWidth: "560px", marginBottom: "32px" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: "#64748B",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Masterclass
        </Link>
      </div>

      {/* Header */}
      <div style={{ width: "100%", maxWidth: "560px", textAlign: "center", marginBottom: "40px" }}>
        {/* Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(245,158,11,0.1)",
            border: "1px solid rgba(245,158,11,0.25)",
            borderRadius: "9999px",
            padding: "6px 16px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#F59E0B",
            }}
          />
          <span style={{ color: "#FCD34D", fontSize: "12px", fontWeight: 700, letterSpacing: "0.06em" }}>
            GIT &amp; GITHUB MASTERCLASS
          </span>
        </div>

        <h1
          style={{
            color: "#F8FAFC",
            fontSize: "clamp(28px, 5vw, 40px)",
            fontWeight: 900,
            margin: "0 0 12px 0",
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
          }}
        >
          Certificate Verification
        </h1>
        <p style={{ color: "#64748B", fontSize: "15px", margin: 0, lineHeight: 1.6 }}>
          Verify the authenticity of any certificate issued by{" "}
          <span style={{ color: "#94A3B8", fontWeight: 600 }}>Arka Jain University</span>{" "}
          for the Git &amp; GitHub Masterclass.
        </p>
      </div>

      {/* Search Box */}
      <div
        style={{
          width: "100%",
          maxWidth: "560px",
          display: "flex",
          gap: "10px",
          marginBottom: "32px",
        }}
      >
        <input
          id="certificate-id-input"
          type="text"
          value={inputId}
          onChange={(e) => setInputId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Enter Certificate ID — e.g. GT/250609"
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "14px",
            padding: "14px 18px",
            color: "#F8FAFC",
            fontSize: "15px",
            fontFamily: "'Inter', sans-serif",
            outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#F59E0B")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
        />
        <button
          id="verify-button"
          onClick={handleSearch}
          disabled={loading}
          style={{
            background: loading ? "#78350F" : "#F59E0B",
            border: "none",
            borderRadius: "14px",
            padding: "14px 22px",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s",
            minWidth: "56px",
          }}
        >
          {loading ? (
            <svg
              style={{ animation: "spin 1s linear infinite", width: "20px", height: "20px" }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#000"
              strokeWidth="2.5"
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          ) : (
            <svg width="20" height="20" fill="none" stroke="#000" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          )}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Loading state */}
      {loading && (
        <div style={{ color: "#64748B", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <svg
            style={{ animation: "spin 1s linear infinite", width: "16px", height: "16px" }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#64748B"
            strokeWidth="2"
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          Verifying certificate…
        </div>
      )}

      {/* Result Card */}
      {!loading && searched && result && (
        <div
          style={{
            width: "100%",
            maxWidth: "560px",
            borderRadius: "20px",
            border: `1px solid ${
              result.valid
                ? "rgba(34,197,94,0.25)"
                : isRevoked
                ? "rgba(245,158,11,0.3)"
                : "rgba(239,68,68,0.25)"
            }`,
            background: result.valid
              ? "rgba(34,197,94,0.06)"
              : isRevoked
              ? "rgba(245,158,11,0.06)"
              : "rgba(239,68,68,0.06)",
            padding: "28px",
            animation: "fadeIn 0.3s ease",
          }}
        >
          {/* Status header */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            {result.valid ? (
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "rgba(34,197,94,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="24" height="24" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            ) : isRevoked ? (
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "rgba(245,158,11,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="24" height="24" fill="none" stroke="#F59E0B" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
            ) : (
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "rgba(239,68,68,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="24" height="24" fill="none" stroke="#EF4444" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
            )}

            <div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 800,
                  color: result.valid ? "#22C55E" : isRevoked ? "#F59E0B" : "#EF4444",
                  marginBottom: "2px",
                }}
              >
                {result.valid
                  ? "✅ Certificate Verified"
                  : isRevoked
                  ? "⚠️ Certificate Revoked"
                  : "❌ Certificate Not Found"}
              </div>
              {(result.message || isRevoked) && (
                <div style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.5 }}>
                  {result.message}
                </div>
              )}
            </div>
          </div>

          {/* Certificate details */}
          {result.certificate && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                borderTop: "1px solid rgba(255,255,255,0.07)",
                paddingTop: "20px",
              }}
            >
              {[
                { label: "Recipient", value: result.certificate.recipientName },
                { label: "Certificate ID", value: result.certificate.certificateId, mono: true },
                { label: "Workshop", value: result.certificate.workshopName },
                { label: "Organized By", value: result.certificate.organizedBy },
                {
                  label: "Collaborators",
                  value: result.certificate.collaborators.join(" · "),
                },
                {
                  label: "Completed On",
                  value: formatDate(result.certificate.completionDate),
                },
                {
                  label: "Issued On",
                  value: formatDate(result.certificate.issuedAt),
                },
                {
                  label: "Status",
                  value: result.certificate.status,
                  badge: true,
                },
              ].map(({ label, value, mono, badge }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "16px",
                  }}
                >
                  <span style={{ color: "#475569", fontSize: "13px", fontWeight: 600, flexShrink: 0 }}>
                    {label}
                  </span>
                  {badge ? (
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: "9999px",
                        background:
                          value === "VALID"
                            ? "rgba(34,197,94,0.15)"
                            : "rgba(239,68,68,0.15)",
                        color: value === "VALID" ? "#22C55E" : "#EF4444",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {value}
                    </span>
                  ) : (
                    <span
                      style={{
                        color: "#CBD5E1",
                        fontSize: "13px",
                        fontWeight: mono ? 700 : 500,
                        fontFamily: mono ? "monospace" : "inherit",
                        textAlign: "right",
                      }}
                    >
                      {value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* Help text */}
      {!searched && (
        <div
          style={{
            marginTop: "32px",
            color: "#334155",
            fontSize: "13px",
            textAlign: "center",
            maxWidth: "400px",
            lineHeight: 1.7,
          }}
        >
          Enter the Certificate ID shown on your certificate (e.g. <code style={{ background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: "4px", color: "#94A3B8" }}>GT/250609</code>
          ), or scan the QR code on your certificate to verify automatically.
        </div>
      )}
    </div>
  );
}
