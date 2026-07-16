import AssetImage from "@/components/AssetImage";

export default function Footer() {
  return (
    <footer className="footer">
  <div className="w-layout-blockcontainer container w-container">
    <div className="footer-content">
      <div className="footer-text-and-button">
        <div className="footer-text-wrapper">
          <div className="footer-text">Git &amp; GitHub Masterclass</div>
        </div>
        <a href="javascript:void(0)" className="footer-button w-inline-block" style={{ cursor: "not-allowed", opacity: 0.7 }}><div className="unique-button-text-wrapper">
            <div className="regular-xl max-width-96">REGISTRATIONS CLOSED</div>
          </div>
          <AssetImage src="/images/star-20shape.svg" loading="lazy" style={{WebkitTransform: 'translate3d(0, 0, 0) scale3d(1, 1, 1) rotateX(0) rotateY(0) rotateZ(0deg) skew(0, 0)', MozTransform: 'translate3d(0, 0, 0) scale3d(1, 1, 1) rotateX(0) rotateY(0) rotateZ(0deg) skew(0, 0)', msTransform: 'translate3d(0, 0, 0) scale3d(1, 1, 1) rotateX(0) rotateY(0) rotateZ(0deg) skew(0, 0)', transform: 'translate3d(0, 0, 0) scale3d(1, 1, 1) rotateX(0) rotateY(0) rotateZ(0deg) skew(0, 0)'}} alt="" className="unique-button-shape" /></a>
      </div>
      <div className="footer-menu-wrapper">
        <div className="footer-menu">
          <div className="footer-menu-items">
            <a href="#upcoming-events" className="footer-menu-item">Upcoming Events</a><a href="#who-we-are" className="footer-menu-item">Who We Are</a><a href="#what-we-do" className="footer-menu-item">What We Do</a><a href="#about-events" className="footer-menu-item">About Events</a><a href="#mentors" className="footer-menu-item">Mentors</a><a href="#contact-us" className="footer-menu-item">Contact Us</a>
          </div>
            <a href="/licenses" className="footer-menu-item">Organized by Microsoft Learn Student Ambassador, Arka Jain University</a>
        </div>
        <div className="regular-s-uppercase color-accent">
          © 2026 Microsoft Learn Student Ambassador · Arka Jain University
        </div>
      </div>
    </div>
  </div>
</footer>
  );
}
