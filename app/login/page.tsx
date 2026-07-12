"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import AssetImage from "@/components/AssetImage";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState("");

  // If already logged in via NextAuth session → redirect to student dashboard
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  // If already logged in via credentials → redirect based on role
  useEffect(() => {
    const saved = localStorage.getItem("user_registration");
    if (saved) {
      try {
        const user = JSON.parse(saved);
        if (user.role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/dashboard");
        }
      } catch {
        router.push("/register");
      }
    }
  }, [router]);

  // Fix full-height layout
  useEffect(() => {
    const origHtmlHeight = document.documentElement.style.height;
    const origHtmlMargin = document.documentElement.style.margin;
    const origHtmlPadding = document.documentElement.style.padding;
    const origHtmlOverflow = document.documentElement.style.overflow;
    const origBodyHeight = document.body.style.height;
    const origBodyMargin = document.body.style.margin;
    const origBodyPadding = document.body.style.padding;
    const origBodyOverflow = document.body.style.overflow;
    const origBodyBg = document.body.style.backgroundColor;

    document.documentElement.style.height = "100%";
    document.documentElement.style.margin = "0";
    document.documentElement.style.padding = "0";
    document.documentElement.style.overflow = "auto";
    document.body.style.height = "auto";
    document.body.style.minHeight = "100vh";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflow = "auto";
    document.body.style.backgroundColor = "transparent";

    return () => {
      document.documentElement.style.height = origHtmlHeight;
      document.documentElement.style.margin = origHtmlMargin;
      document.documentElement.style.padding = origHtmlPadding;
      document.documentElement.style.overflow = origHtmlOverflow;
      document.body.style.height = origBodyHeight;
      document.body.style.margin = origBodyMargin;
      document.body.style.padding = origBodyPadding;
      document.body.style.overflow = origBodyOverflow;
      document.body.style.backgroundColor = origBodyBg;
    };
  }, []);

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("user_registration", JSON.stringify(data.user));
        if (data.user.role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/dashboard");
        }
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

  const handleOAuth = async (provider: "google" | "github") => {
    setOauthLoading(provider);
    setErrorMsg("");
    try {
      await signIn(provider, { callbackUrl: "/register" });
    } catch (err) {
      setErrorMsg("OAuth sign-in failed. Please try again.");
    } finally {
      setOauthLoading("");
    }
  };

  return (
    <div style={{
      backgroundColor: "#faf9f6",
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      margin: 0,
      padding: 0,
      boxSizing: "border-box",
    }}>
      <section className="register-section" style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        width: "100%",
        padding: 0,
        margin: 0,
        boxSizing: "border-box",
      }}>
        {/* Internal Page Nav */}
        <nav className="internal-page-nav" style={{ 
          paddingBottom: "20px", 
          paddingTop: "20px",
          paddingLeft: "20px",
          paddingRight: "20px",
          width: "100%", 
          flexShrink: 0,
          boxSizing: "border-box",
          margin: 0,
        }}>
          <div className="w-layout-blockcontainer container w-container" style={{ margin: 0, padding: 0 }}>
            <div className="internal-page-nav-content" style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              margin: 0,
              padding: 0,
            }}>
              <Link href="/" className="nav-logo-block w-inline-block" style={{ textDecoration: "none", margin: 0, padding: 0 }}>
                <div style={{
                  fontFamily: '"Anton", sans-serif',
                  fontSize: 19,
                  lineHeight: "0.95",
                  letterSpacing: "-0.2px",
                  textTransform: "uppercase",
                  color: "#151304",
                  fontWeight: 400,
                  textAlign: "left",
                  display: "flex",
                  flexDirection: "column",
                  margin: 0,
                  padding: 0,
                }}>
                  <span>Git &amp; GitHub</span>
                  <span>Masterclass</span>
                </div>
              </Link>
              <Link href="/" className="w-inline-block" style={{ margin: 0, padding: 0 }}>
                <AssetImage
                  src="/images/arka-jain-logo-wide.png"
                  loading="lazy"
                  alt="Arka Jain University Logo"
                  className="arka-jain-header-logo"
                />
              </Link>
            </div>
          </div>
        </nav>

        <div className="register-container" id="form-container" style={{ 
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          minHeight: 0,
          margin: 0,
          padding: "20px",
          boxSizing: "border-box",
        }}>
          <form onSubmit={handleLogin} className="register-card">
            <div className="register-header">
              <h1 className="register-title">Attendee Login</h1>
              <p className="register-desc" style={{ fontWeight: 500, fontSize: "16px" }}>
                Access your Student Space using your University Enrollment Number and Phone Number.
              </p>
              <div style={{
                margin: "12px 0",
                padding: "10px",
                background: "#f7f6f1",
                borderRadius: "8px",
                border: "1.5px solid var(--black)",
                textAlign: "center",
              }}>
                <Link href="/register" style={{
                  color: "var(--colors--orange)",
                  fontWeight: 700,
                  textDecoration: "underline",
                }}>
                  Don't have an account? Click here to Register
                </Link>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="form-group" style={{
                padding: "12px 16px",
                backgroundColor: "rgba(211, 77, 81, 0.1)",
                borderRadius: "8px",
                border: "1px solid var(--colors--coral)",
              }}>
                <span className="error-msg" style={{ marginTop: 0 }}>{errorMsg}</span>
              </div>
            )}

            {/* OAuth Buttons — shown first */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "4px" }}>
              {/* Google */}
              <button
                type="button"
                id="login-google-btn"
                onClick={() => handleOAuth("google")}
                disabled={!!oauthLoading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  width: "100%",
                  padding: "11px 16px",
                  borderRadius: "8px",
                  border: "1.5px solid rgba(0,0,0,0.15)",
                  backgroundColor: "#ffffff",
                  cursor: oauthLoading ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#1a1a1a",
                  transition: "all 0.2s",
                  opacity: oauthLoading === "github" ? 0.5 : 1,
                }}
                onMouseEnter={(e) => { if (!oauthLoading) e.currentTarget.style.backgroundColor = "#f8f8f8"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#ffffff"; }}
              >
                {oauthLoading === "google" ? (
                  <span style={{ fontSize: "16px" }}>⏳</span>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                {oauthLoading === "google" ? "Redirecting to Google…" : "Continue with Google"}
              </button>

              {/* GitHub */}
              <button
                type="button"
                id="login-github-btn"
                onClick={() => handleOAuth("github")}
                disabled={!!oauthLoading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  width: "100%",
                  padding: "11px 16px",
                  borderRadius: "8px",
                  border: "1.5px solid rgba(0,0,0,0.15)",
                  backgroundColor: "#24292e",
                  cursor: oauthLoading ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#ffffff",
                  transition: "all 0.2s",
                  opacity: oauthLoading === "google" ? 0.5 : 1,
                }}
                onMouseEnter={(e) => { if (!oauthLoading) e.currentTarget.style.backgroundColor = "#1a1f24"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#24292e"; }}
              >
                {oauthLoading === "github" ? (
                  <span style={{ fontSize: "16px" }}>⏳</span>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                )}
                {oauthLoading === "github" ? "Redirecting to GitHub…" : "Continue with GitHub"}
              </button>
            </div>

            {/* Divider */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              margin: "4px 0 12px",
            }}>
              <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(0,0,0,0.12)" }} />
              <span style={{ fontSize: "12px", fontWeight: "700", color: "rgba(0,0,0,0.4)", textTransform: "uppercase", letterSpacing: "0.5px" }}>or sign in with credentials</span>
              <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(0,0,0,0.12)" }} />
            </div>

            {/* Username */}
            <div className="form-group">
              <label className="form-label" htmlFor="username" style={{ color: "#000000" }}>
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
              <label className="form-label" htmlFor="password" style={{ color: "#000000" }}>
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
            <button type="submit" disabled={isSubmitting} className="form-submit-btn" id="login-submit-btn">
              {isSubmitting ? "Logging in..." : "Login to Dashboard"}
            </button>

            <p style={{ fontSize: "11px", color: "rgba(0,0,0,0.4)", textAlign: "center", marginTop: "10px", lineHeight: "1.5" }}>
              OAuth sign-in creates a student account automatically. Admin login only via credentials above.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
