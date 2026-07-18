"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import AssetImage from "@/components/AssetImage";

export default function RegisterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    const origBodyBg = document.body.style.backgroundColor;
    const origHtmlBg = document.documentElement.style.backgroundColor;
    document.body.style.backgroundColor = "#ffd446";
    document.documentElement.style.backgroundColor = "#ffd446";
    return () => {
      document.body.style.backgroundColor = origBodyBg;
      document.documentElement.style.backgroundColor = origHtmlBg;
    };
  }, []);

  // Redirect to dashboard if already registered
  useEffect(() => {
    const saved = localStorage.getItem("user_registration");
    if (saved) {
      router.push("/dashboard");
    }
  }, [router]);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    enrollmentNumber: "",
    email: "",
    phoneNumber: "",
    branch: "",
    yearOfStudy: "",
    sectionClass: "",
    gitExperience: "",
    githubUsername: "",
    hasLaptop: "",
    hasGithubAccount: "",
    availableAllDays: "",
    joiningReason: "",
    agreeCodeOfConduct: false,
  });

  // UI Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setFormData((prev) => ({
        ...prev,
        email: prev.email || session.user?.email || "",
        name: prev.name || session.user?.name || "",
      }));
    }
  }, [session, status]);

  // Field change handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target;
    const name = target.name;
    const value = target.type === "checkbox" ? (target as HTMLInputElement).checked : target.value;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Client-side validations
    if (!formData.name.trim()) return setErrorMsg("Full Name is required.");
    if (!formData.enrollmentNumber.trim()) return setErrorMsg("Enrollment Number is required.");
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return setErrorMsg("Please provide a valid Email Address.");
    }
    if (!formData.phoneNumber.trim()) return setErrorMsg("Phone Number (WhatsApp) is required.");
    if (!formData.branch.trim()) return setErrorMsg("Branch / Department is required.");
    if (!formData.yearOfStudy) return setErrorMsg("Year of Study is required.");
    if (!formData.gitExperience) return setErrorMsg("Please select your experience with Git/GitHub.");
    if (!formData.hasLaptop) return setErrorMsg("Please answer the laptop availability question.");
    if (!formData.hasGithubAccount) return setErrorMsg("Please specify if you already have a GitHub account.");
    if (!formData.availableAllDays) return setErrorMsg("Please answer your availability response.");
    if (!formData.agreeCodeOfConduct) return setErrorMsg("You must agree to the Code of Conduct to register.");

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const submissionWithId = { ...formData, id: Date.now().toString() };
        localStorage.setItem("user_registration", JSON.stringify(submissionWithId));
        router.push("/dashboard");
      } else {
        setErrorMsg(data.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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

      {/* Main Form Content */}
      <div className="register-container">
        <form onSubmit={handleSubmit} className="register-card">
          <div className="register-header">
            <h1 className="register-title">Workshop Registration Form</h1>
            <p className="register-desc" style={{ fontWeight: 500, fontSize: "16px" }}>
              Join the 7-Day Git &amp; GitHub Master Workshop conducted by the Microsoft Learn Student Ambassador at Arka Jain University.
            </p>
            <p className="register-desc">
              Learn Git and GitHub from scratch, collaborate on real-world projects, deploy your own portfolio website, and launch your live deployed portfolio and merged open-source contribution through an engaging, hands-on learning experience. Whether you're a beginner or an aspiring developer, this workshop is designed to help you build industry-ready skills.
            </p>
            <p className="register-desc" style={{ color: "var(--accent-orange)", fontWeight: "600", fontSize: "14px" }}>
              ⚠️ Reserve your seat today — limited registrations available!
            </p>
            <div className="register-leads">
              <strong>Workshop Lead:</strong> Mohit Raj (Microsoft Learn Student Ambassador &amp; Club Lead)<br />
              <strong>Faculty Advisor:</strong> Ms. Rakhi Jha
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="form-group" style={{ padding: "12px 16px", backgroundColor: "rgba(211, 77, 81, 0.1)", borderRadius: "8px", border: "1px solid var(--colors--coral)" }}>
              <span className="error-msg" style={{ marginTop: 0 }}>{errorMsg}</span>
            </div>
          )}

          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Full Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className="form-input-text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Enrollment Number */}
          <div className="form-group">
            <label className="form-label" htmlFor="enrollmentNumber">
              Enrollment Number <span className="required">*</span>
            </label>
            <input
              type="text"
              id="enrollmentNumber"
              name="enrollmentNumber"
              className="form-input-text"
              placeholder="Enter your university enrollment number"
              value={formData.enrollmentNumber}
              onChange={handleChange}
              required
            />
          </div>

          {/* Email Address */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input-text"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Phone Number */}
          <div className="form-group">
            <label className="form-label" htmlFor="phoneNumber">
              Phone Number (WhatsApp) <span className="required">*</span>
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              className="form-input-text"
              placeholder="Enter your WhatsApp number"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
            />
          </div>

          {/* Branch / Department */}
          <div className="form-group">
            <label className="form-label" htmlFor="branch">
              Branch / Department <span className="required">*</span>
            </label>
            <input
              type="text"
              id="branch"
              name="branch"
              className="form-input-text"
              placeholder="e.g., B.Tech CSE, BCA, Diploma ME"
              value={formData.branch}
              onChange={handleChange}
              required
            />
          </div>

          {/* Year of Study */}
          <div className="form-group">
            <label className="form-label">
              Year of Study <span className="required">*</span>
            </label>
            <div className="radio-group">
              {["1st Year", "2nd Year", "3rd Year", "4th Year"].map((year) => (
                <label key={year} className="radio-option">
                  <input
                    type="radio"
                    name="yearOfStudy"
                    value={year}
                    checked={formData.yearOfStudy === year}
                    onChange={handleChange}
                    required
                  />
                  <span className="checkmark-radio"></span>
                  {year}
                </label>
              ))}
            </div>
          </div>

          {/* Section / Class */}
          <div className="form-group">
            <label className="form-label" htmlFor="sectionClass">
              Section / Class
            </label>
            <input
              type="text"
              id="sectionClass"
              name="sectionClass"
              className="form-input-text"
              placeholder="e.g., Sec A, Class B"
              value={formData.sectionClass}
              onChange={handleChange}
            />
          </div>

          {/* Git/GitHub Experience */}
          <div className="form-group">
            <label className="form-label">
              Have you used Git/GitHub before? <span className="required">*</span>
            </label>
            <div className="radio-group">
              {[
                "Never used it",
                "Heard of it but never tried",
                "Used it a little",
                "Comfortable with basics",
                "Use it regularly",
              ].map((option) => (
                <label key={option} className="radio-option">
                  <input
                    type="radio"
                    name="gitExperience"
                    value={option}
                    checked={formData.gitExperience === option}
                    onChange={handleChange}
                    required
                  />
                  <span className="checkmark-radio"></span>
                  {option}
                </label>
              ))}
            </div>
          </div>

          {["Used it a little", "Comfortable with basics", "Use it regularly"].includes(formData.gitExperience) && (
            <div className="form-group">
              <label className="form-label" htmlFor="githubUsername">
                GitHub Username / ID (Optional - you can add/edit it later in your profile settings)
              </label>
              <input
                type="text"
                id="githubUsername"
                name="githubUsername"
                className="form-input-text"
                placeholder="Enter your GitHub username (e.g. mohitraj8503)"
                value={formData.githubUsername}
                onChange={handleChange}
              />
            </div>
          )}

          {/* Has Laptop */}
          <div className="form-group">
            <label className="form-label">
              Do you have a laptop to bring for hands-on sessions? <span className="required">*</span>
            </label>
            <div className="radio-group">
              {[
                "Yes, I'll bring my own laptop",
                "No, I'll need a lab system",
                "Not sure yet",
              ].map((option) => (
                <label key={option} className="radio-option">
                  <input
                    type="radio"
                    name="hasLaptop"
                    value={option}
                    checked={formData.hasLaptop === option}
                    onChange={handleChange}
                    required
                  />
                  <span className="checkmark-radio"></span>
                  {option}
                </label>
              ))}
            </div>
          </div>

          {/* Has GitHub Account */}
          <div className="form-group">
            <label className="form-label">
              Do you already have a GitHub account? <span className="required">*</span>
            </label>
            <div className="radio-group">
              {["Yes", "No", "Not sure"].map((option) => (
                <label key={option} className="radio-option">
                  <input
                    type="radio"
                    name="hasGithubAccount"
                    value={option}
                    checked={formData.hasGithubAccount === option}
                    onChange={handleChange}
                    required
                  />
                  <span className="checkmark-radio"></span>
                  {option}
                </label>
              ))}
            </div>
          </div>

          {/* Available All Days */}
          <div className="form-group">
            <label className="form-label">
              Are you available for all 7 days at the scheduled time? <span className="required">*</span>
            </label>
            <div className="radio-group">
              {["Yes, fully available", "I might miss 1-2 days", "Not sure yet"].map((option) => (
                <label key={option} className="radio-option">
                  <input
                    type="radio"
                    name="availableAllDays"
                    value={option}
                    checked={formData.availableAllDays === option}
                    onChange={handleChange}
                    required
                  />
                  <span className="checkmark-radio"></span>
                  {option}
                </label>
              ))}
            </div>
          </div>

          {/* Why Join */}
          <div className="form-group">
            <label className="form-label" htmlFor="joiningReason">
              Why do you want to join this workshop?
            </label>
            <textarea
              id="joiningReason"
              name="joiningReason"
              className="form-input-text"
              placeholder="Tell us why you would like to participate..."
              style={{ borderRadius: "16px", minHeight: "100px", resize: "vertical" }}
              value={formData.joiningReason}
              onChange={handleChange}
            />
          </div>

          {/* Agree Code of Conduct */}
          <div className="form-group">
            <label className="checkbox-container">
              <input
                type="checkbox"
                name="agreeCodeOfConduct"
                checked={formData.agreeCodeOfConduct}
                onChange={handleChange}
                required
              />
              <span className="checkmark-checkbox"></span>
              I agree to attend regularly and follow the workshop's code of conduct. <span className="required">*</span>
            </label>
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={isSubmitting} className="form-submit-btn">
            {isSubmitting ? "Submitting..." : "Submit Registration"}
          </button>
        </form>
      </div>
    </section>
  );
}
