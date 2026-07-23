import type { Metadata } from "next";
import { Suspense } from "react";
import VerifyContent from "./VerifyContent";

export const metadata: Metadata = {
  title: "Certificate Verification — Git & GitHub Masterclass",
  description:
    "Verify the authenticity of a Git & GitHub Masterclass certificate issued by Arka Jain University.",
  robots: { index: false, follow: false },
};

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            background: "#090D16",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ color: "#64748B", fontSize: "14px" }}>Loading…</div>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
