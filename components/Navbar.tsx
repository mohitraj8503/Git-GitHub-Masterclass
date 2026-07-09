"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AssetImage from "@/components/AssetImage";

export default function Navbar() {
  return (
    <nav className="nav">
      <div className="w-layout-blockcontainer container w-container">
        <div className="nav-content">
          <a href="/" aria-current="page" className="nav-logo-block w-inline-block w--current">
            <div style={{fontFamily: '"Anton", sans-serif', fontSize: 19, lineHeight: '0.95', letterSpacing: '-0.2px', textTransform: 'uppercase', color: '#151304', fontWeight: 400, textAlign: 'left', display: 'flex', flexDirection: 'column'}}>
              <span>Git &amp; GitHub</span>
              <span>Masterclass</span>
            </div>
            <AssetImage src="/images/arka-jain-logo-wide.png" loading="lazy" alt="Arka Jain University" className="arka-jain-header-logo" />
          </a>
          <div className="nav-buttons-wrapper">
            <a href="https://discord.com/" target="_blank" className="button secondary w-button">Join Community</a>
            <ShuffleCapsule />
          </div>
          <div data-w-id="3a69cf98-d524-c705-09d0-7efc696f4ebd" className="hamburger-menu open-menu">
            <div data-w-id="d6b6be04-c64f-2a2c-46b1-db88bc99663d" className="hamburger-menu-line-one" />
            <div data-w-id="6c788ae3-ecc2-3205-37cf-448614eeca5c" className="hamburger-menu-line-two" />
          </div>
          <div className="hamburger-menu-dropdown">
            <a href="#upcoming-events" className="hamburger-menu-link">Upcoming Events</a>
            <a href="#who-we-are" className="hamburger-menu-link">Who We Are</a>
            <a href="#what-we-do" className="hamburger-menu-link">What We Do</a>
            <a href="#about-events" className="hamburger-menu-link">About Events</a>
            <a href="#mentors" className="hamburger-menu-link">Mentors</a>
            <a href="#contact-us" className="hamburger-menu-link">Contact Us</a>
            <a href="/login" className="hamburger-menu-link" style={{ fontWeight: "700", color: "var(--accent-yellow)" }}>Login Space</a>
          </div>
        </div>
        <div data-w-id="cfeb5d51-0757-a9ea-4ad7-d29ff97b3e75" className="nav-adaptation-menu">
          <div className="nav-menu-and-links">
            <div className="nav-content">
              <a href="/" aria-current="page" className="nav-logo-block w-inline-block w--current">
                <div style={{fontFamily: '"Anton", sans-serif', fontSize: 19, lineHeight: '0.95', letterSpacing: '-0.2px', textTransform: 'uppercase', color: '#151304', fontWeight: 400, textAlign: 'left', display: 'flex', flexDirection: 'column'}}>
                  <span>Git &amp; GitHub</span>
                  <span>Masterclass</span>
                </div>
                <AssetImage src="/images/arka-jain-logo-wide.png" loading="lazy" alt="Arka Jain University" className="arka-jain-header-logo" />
              </a>
              <div data-w-id="eafbfd94-11b2-e70b-681d-d501b8677f01" className="hamburger-menu close-menu">
                <div data-w-id="eafbfd94-11b2-e70b-681d-d501b8677f02" className="hamburger-menu-line-one" />
                <div data-w-id="eafbfd94-11b2-e70b-681d-d501b8677f03" className="hamburger-menu-line-two" />
              </div>
            </div>
            <div className="nav-adaptation-links-wrapper">
              <a href="#upcoming-events" className="nav-adaptation-link">Upcoming Events</a>
              <a href="#who-we-are" className="nav-adaptation-link">Who We Are</a>
              <a href="#what-we-do" className="nav-adaptation-link">What We Do</a>
              <a href="#about-events" className="nav-adaptation-link">About Events</a>
              <a href="#mentors" className="nav-adaptation-link">Mentors</a>
              <a href="#contact-us" className="nav-adaptation-link">Contact Us</a>
              <a href="/login" className="nav-adaptation-link" style={{ fontWeight: "700", color: "var(--accent-yellow)" }}>Login Space</a>
            </div>
          </div>
          <div className="adaptation-menu-buttons">
            <a href="https://discord.com/" target="_blank" className="button secondary w-button">Join Community</a>
            <ShuffleCapsule />
          </div>
        </div>
      </div>
    </nav>
  );
}

function ShuffleCapsule() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentMode, setCurrentMode] = useState<"login" | "register">("login");
  const [isExpanded, setIsExpanded] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("user_registration");
    if (saved) {
      setIsLoggedIn(true);
    }
  }, []);

  // Handle auto shuffling when not expanded and not logged in
  useEffect(() => {
    if (isLoggedIn || isExpanded) return;
    const interval = setInterval(() => {
      setCurrentMode((prev) => (prev === "login" ? "register" : "login"));
    }, 2500);
    return () => clearInterval(interval);
  }, [isLoggedIn, isExpanded]);

  // Handle outside clicks to collapse mobile state
  useEffect(() => {
    if (!isExpanded) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [isExpanded]);

  const handleLeftClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoggedIn) {
      router.push("/dashboard");
      return;
    }

    // Check if it's a touch pointer
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) {
      setIsExpanded(true);
    } else {
      router.push("/login");
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoggedIn) return;
    router.push("/register");
  };

  const handleMobileNav = (mode: "login" | "register", e: React.MouseEvent) => {
    e.stopPropagation();
    if (mode === "login") {
      router.push("/login");
    } else {
      router.push("/register");
    }
    setIsExpanded(false);
  };

  if (isLoggedIn) {
    return (
      <a href="/dashboard" className="button secondary w-button">
        MY ACCOUNT
      </a>
    );
  }

  return (
    <div ref={wrapperRef} className="shuffle-capsule-wrapper">
      {isExpanded ? (
        <div className="button secondary w-button shuffle-capsule-expanded">
          <span 
            onClick={(e) => handleMobileNav("login", e)} 
            className="shuffle-capsule-link"
          >
            LOGIN
          </span>
          <span className="shuffle-capsule-separator">|</span>
          <span 
            onClick={(e) => handleMobileNav("register", e)} 
            className="shuffle-capsule-link"
          >
            REGISTER
          </span>
        </div>
      ) : (
        <div 
          onClick={handleLeftClick}
          onContextMenu={handleRightClick}
          className="button secondary w-button shuffle-capsule-collapsed"
        >
          <div className="shuffle-capsule-text-wrapper">
            <span className={`shuffle-capsule-text ${currentMode === "login" ? "active" : ""}`}>
              LOGIN
            </span>
            <span className={`shuffle-capsule-text ${currentMode === "register" ? "active" : ""}`}>
              REGISTER
            </span>
          </div>
          {/* Tooltip hint visible on desktop hover */}
          <div className="shuffle-capsule-tooltip">
            Left Click: Login | Right Click: Register
          </div>
        </div>
      )}
    </div>
  );
}
