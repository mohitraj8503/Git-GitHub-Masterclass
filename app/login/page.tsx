"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AssetImage from "@/components/AssetImage";

export default function LoginPage() {
  const router = useRouter();

  // State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // If already logged in, redirect to student dashboard
  useEffect(() => {
    const saved = localStorage.getItem("user_registration");
    if (saved) {
      router.push("/register");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!username.trim() || !password.trim()) {
      return setErrorMsg("Please enter both Username and Password.");
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("user_registration", JSON.stringify(data.user));
        router.push("/register");
      } else {
        setErrorMsg(data.error || "Invalid Username or Password.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#faf9f6", minHeight: "100vh" }}>
      <section className="register-section" style={{ paddingTop: "20px" }}>
        {/* Internal Page Nav */}
        <nav className="internal-page-nav" style={{ paddingBottom: "40px" }}>
          <div className="w-layout-blockcontainer container w-container">
            <div className="internal-page-nav-content" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Link href="/" className="nav-logo-block w-inline-block" style={{ textDecoration: "none" }}>
                <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 19, lineHeight: "0.95", letterSpacing: "-0.2px", textTransform: "uppercase", color: "#151304", fontWeight: 400, textAlign: "left", display: "flex", flexDirection: "column" }}>
                  <span>Git &amp; GitHub</span>
                  <span>Masterclass</span>
                </div>
              </Link>
              <Link href="/" className="w-inline-block">
                <AssetImage src="/images/arka-jain-logo-wide.png" loading="lazy" alt="Arka Jain University Logo" className="arka-jain-header-logo" />
              </Link>
            </div>
          </div>
        </nav>

        <div className="register-container" id="form-container">
          <form onSubmit={handleLogin} className="register-card">
            <div className="register-header">
              <h1 className="register-title">Attendee Login</h1>
              <p className="register-desc" style={{ fontWeight: 500, fontSize: "16px" }}>
                Access your Student Space using your University Enrollment Number and Phone Number.
              </p>
              <div style={{ margin: "12px 0", padding: "10px", background: "#f7f6f1", borderRadius: "8px", border: "1.5px solid var(--black)", textAlign: "center" }}>
                <Link href="/register" style={{ color: "var(--colors--orange)", fontWeight: 700, textDecoration: "underline" }}>
                  Don't have an account? Click here to Register
                </Link>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="form-group" style={{ padding: "12px 16px", backgroundColor: "rgba(211, 77, 81, 0.1)", borderRadius: "8px", border: "1px solid var(--colors--coral)" }}>
                <span className="error-msg" style={{ marginTop: 0 }}>{errorMsg}</span>
              </div>
            )}

            {/* Username */}
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                Username (Enrollment Number) <span className="required">*</span>
              </label>
              <input
                type="text"
                id="username"
                className="form-input-text"
                placeholder="e.g. AJU19082"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password (Phone Number) <span className="required">*</span>
              </label>
              <input
                type="password"
                id="password"
                className="form-input-text"
                placeholder="Enter your WhatsApp phone number"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={isSubmitting} className="form-submit-btn">
              {isSubmitting ? "Logging in..." : "Login to Dashboard"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
