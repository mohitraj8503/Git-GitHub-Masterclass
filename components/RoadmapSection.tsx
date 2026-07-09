"use client";

import { useEffect, useState, useRef, useLayoutEffect } from "react";

interface DayData {
  day: number;
  date: string;
  tag: string;
  title: string;
  icon: React.ReactNode;
}

export default function RoadmapSection() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [pathD, setPathD] = useState("");
  const [pathLength, setPathLength] = useState(0);
  const [visibleDays, setVisibleDays] = useState<Record<number, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<(HTMLDivElement | null)[]>([]);
  const pathRef = useRef<SVGPathElement>(null);

  const days: DayData[] = [
    {
      day: 1,
      date: "15 JUL 2026",
      tag: "GIT BASICS",
      title: "Why Version Control? Setup & First Repo",
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="roadmap-icon-svg">
          <polyline points="4 17 10 11 4 5"></polyline>
          <line x1="12" y1="19" x2="20" y2="19"></line>
        </svg>
      )
    },
    {
      day: 2,
      date: "16 JUL 2026",
      tag: "WORKFLOW",
      title: "Mastering the Staging Area & Commits",
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="roadmap-icon-svg">
          <circle cx="12" cy="12" r="4"></circle>
          <line x1="1.05" y1="12" x2="8" y2="12"></line>
          <line x1="16" y1="12" x2="22.95" y2="12"></line>
        </svg>
      )
    },
    {
      day: 3,
      date: "17 JUL 2026",
      tag: "BRANCHES",
      title: "Branching Strategies & Solving Conflicts",
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="roadmap-icon-svg">
          <line x1="6" y1="3" x2="6" y2="15"></line>
          <circle cx="18" cy="6" r="3"></circle>
          <circle cx="6" cy="18" r="3"></circle>
          <path d="M18 9a9 9 0 0 1-9 9"></path>
        </svg>
      )
    },
    {
      day: 4,
      date: "18 JUL 2026",
      tag: "REMOTE",
      title: "Going Remote — Push, Pull, Deploy",
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="roadmap-icon-svg">
          <path d="M16 16l-4-4-4 4"></path>
          <path d="M12 12v9"></path>
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
        </svg>
      )
    },
    {
      day: 5,
      date: "19 JUL 2026",
      tag: "COLLABORATION",
      title: "Pull Requests, Issues & Forking",
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="roadmap-icon-svg">
          <circle cx="18" cy="18" r="3"></circle>
          <circle cx="6" cy="6" r="3"></circle>
          <circle cx="6" cy="18" r="3"></circle>
          <path d="M18 15V9a4 4 0 0 0-4-4H9"></path>
          <polyline points="12 8 9 5 12 2"></polyline>
          <line x1="6" y1="9" x2="6" y2="15"></line>
        </svg>
      )
    },
    {
      day: 6,
      date: "20 JUL 2026",
      tag: "POLISH",
      title: "Repo Hygiene, Deployment & Industry Guest",
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="roadmap-icon-svg">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          <polyline points="9 11 11 13 15 9"></polyline>
        </svg>
      )
    },
    {
      day: 7,
      date: "21 JUL 2026",
      tag: "FINALE",
      title: "Open Source Demo Day & Community Launch",
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="roadmap-icon-svg">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
          <path d="M4 22h16"></path>
          <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"></path>
          <path d="M12 2a6 6 0 0 1 6 6v5a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z"></path>
        </svg>
      )
    }
  ];

  // Function to calculate curve path dynamically
  const updatePath = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    const points = dotsRef.current
      .map((dot) => {
        if (!dot) return null;
        const rect = dot.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2 - containerRect.left,
          y: rect.top + rect.height / 2 - containerRect.top,
        };
      })
      .filter((p): p is { x: number; y: number } => p !== null);

    if (points.length < 2) return;

    // Create a smooth cubic bezier winding river path
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];

      // Vertical halfway midpoint
      const cy = p0.y + (p1.y - p0.y) / 2;

      // Keep control points vertically aligned with ends to make it enter/exit vertically
      d += ` C ${p0.x} ${cy}, ${p1.x} ${cy}, ${p1.x} ${p1.y}`;
    }

    setPathD(d);

    // Get path length for drawing animation
    // Wrap in requestAnimationFrame to ensure the DOM elements are updated
    requestAnimationFrame(() => {
      if (pathRef.current) {
        try {
          const length = pathRef.current.getTotalLength();
          setPathLength(length);
        } catch (e) {
          console.error("Error reading SVG path length", e);
        }
      }
    });
  };

  // Run updatePath on mount, resize, and when visible elements shift
  useLayoutEffect(() => {
    // Small delay to ensure any custom fonts or dynamic cards are fully settled
    const timer = setTimeout(() => {
      updatePath();
    }, 100);

    window.addEventListener("resize", updatePath);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updatePath);
    };
  }, []);

  // Recalculate when node visibilities change, as translation shifts rects
  useEffect(() => {
    updatePath();
  }, [visibleDays]);

  // Scroll listener for drawing progress
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      const containerHeight = rect.height;
      const startTrigger = rect.top - windowHeight / 2;
      const totalDist = containerHeight;
      
      let progress = 0;
      if (rect.top <= windowHeight) {
        progress = Math.min(Math.max(-startTrigger / totalDist, 0), 1);
      }
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // IntersectionObserver for scroll-reveal fade/slide in
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const dayNum = Number(entry.target.getAttribute("data-day"));
            setVisibleDays((prev) => ({ ...prev, [dayNum]: true }));
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    const elements = document.querySelectorAll(".roadmap-node-wrapper");
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <section id="upcoming-events" className="section upcoming-events">
      <div className="w-layout-blockcontainer container margin-bottom-48-mobile-32 w-container">
        <div className="section-heading">
          <h2 className="h2 max-width-328-tablet-280-mobile-232">
            The 7-Day Journey
          </h2>
          <p className="medium-l-uppercase section-description">
            Seven days. One live project. Real Git workflows used at top
            tech companies — built from scratch.
          </p>
        </div>
      </div>

      <div className="w-layout-blockcontainer container w-container">
        <div ref={containerRef} className="roadmap-timeline-wrapper" id="roadmap-journey">
          {/* Dynamic Winding S-Curve SVG Line */}
          <div className="roadmap-timeline-line-container">
            <svg className="roadmap-timeline-svg" style={{ width: "100%", height: "100%" }}>
              {pathD && (
                <>
                  <path 
                    d={pathD} 
                    className="roadmap-line-bg" 
                    fill="none" 
                  />
                  <path 
                    ref={pathRef}
                    d={pathD} 
                    className="roadmap-line-active" 
                    fill="none"
                    strokeDasharray={pathLength || 2000}
                    strokeDashoffset={pathLength ? pathLength * (1 - scrollProgress) : 2000}
                  />
                </>
              )}
            </svg>
          </div>

          {/* Roadmap Days */}
          <div className="roadmap-nodes-container">
            {days.map((item, index) => {
              const isEven = index % 2 === 1;
              const isVisible = !!visibleDays[item.day];
              const isActive = scrollProgress >= (index / (days.length - 1));
              
              return (
                <div 
                  key={item.day} 
                  data-day={item.day} 
                  className={`roadmap-node-wrapper ${isEven ? "roadmap-node-even" : "roadmap-node-odd"} ${isVisible ? "roadmap-visible" : "roadmap-hidden"}`}
                >
                  {/* Empty Spacer Column for Desktop */}
                  <div className="roadmap-node-spacer" />

                  {/* Timeline Intersection Node point */}
                  <div className="roadmap-node-dot-container">
                    <div 
                      ref={(el) => { dotsRef.current[index] = el; }}
                      className={`roadmap-node-dot ${isActive ? "roadmap-dot-active" : ""}`}
                    >
                      <span className="roadmap-dot-inner">{item.day}</span>
                    </div>
                  </div>

                  {/* Day Content Card */}
                  <div className="roadmap-node-card-container">
                    <div className="roadmap-node-card">
                      <div className="roadmap-card-header">
                        <div className="roadmap-card-day-date">
                          <span className="roadmap-card-day">DAY {item.day}</span>
                          <span className="roadmap-card-date">{item.date}</span>
                        </div>
                        <div className="roadmap-card-tag-wrapper">
                          <div className="chips border-dashed-yellow">
                            <span className="medium-s-uppercase color-yellow">{item.tag}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="roadmap-card-body">
                        <h3 className="h3 roadmap-card-title">{item.title}</h3>
                        <div className="roadmap-card-icon-container">
                          {item.icon}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
