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
            <a href="/certificate" className="button secondary w-button" style={{ borderColor: "#F6A700", color: "#F6A700" }}>Certificate Studio</a>
            <a href="https://discord.com/events/1526478795857592401/1526481750807674881" target="_blank" className="button secondary w-button">Join Community</a>
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
            <a href="https://discord.com/events/1526478795857592401/1526481750807674881" target="_blank" className="button secondary w-button">Join Community</a>
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

  useEffect(() => {
    const saved = localStorage.getItem("user_registration");
    if (saved) {
      setIsLoggedIn(true);
    }
  }, []);

  if (isLoggedIn) {
    return (
      <a href="/dashboard" className="button secondary w-button">
        MY ACCOUNT
      </a>
    );
  }

  return (
    <a href="/login" className="button secondary w-button">
      LOGIN SPACE
    </a>
  );
}
