import AssetImage from "@/components/AssetImage";

export default function ChangelogPage() {
  return (
    <>
        <section className="service-page">
    <div className="w-layout-blockcontainer container w-container">
      <div className="wrapper vertical-flex-center">
        <nav className="internal-page-nav">
          <div className="w-layout-blockcontainer container w-container">
            <div className="internal-page-nav-content">
              <a href="/" className="nav-logo-block w-inline-block">
                <div style={{fontFamily: '"Anton", sans-serif', fontSize: 19, lineHeight: '0.95', letterSpacing: '-0.2px', textTransform: 'uppercase', color: '#151304', fontWeight: 400, textAlign: 'left', display: 'flex', flexDirection: 'column'}}>
                  <span>Git &amp; GitHub</span>
                  <span>Masterclass</span>
                </div>
              </a>
            </div>
          </div>
        </nav>
        <div className="service-page-header">
          <h1 className="h1 service-page-heading">Changelog</h1>
          <p className="medium-l-uppercase max-width-560">
            Discover updates, improvements, and bug fixes in each release.
            Stay informed.
          </p>
        </div>
        <div className="service-page-content">
          <div className="service-page-item">
            <h2 className="h2 grow">V1.0</h2>
            <p className="medium-m grow">Workshop launched in July 2025.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
  <footer className="footer">
    <div className="w-layout-blockcontainer container w-container">
      <div className="footer-content">
        <div className="footer-text-and-button">
          <div className="footer-text-wrapper">
            <div className="footer-text">Git &amp; GitHub Masterclass</div>
          </div>
          <a href="https://forms.gle/GfyDohyNo6wbLrQq7" target="_blank" className="footer-button w-inline-block"><div className="unique-button-text-wrapper">
              <div className="regular-xl max-width-96">REGISTER NOW</div>
            </div>
            <AssetImage src="/images/star-20shape.svg" loading="lazy" alt="" className="unique-button-shape" /></a>
        </div>
        <div className="footer-menu-wrapper">
          <div className="footer-menu service-page-menu">
            <div className="footer-menu-items">
              <a href="/" className="footer-menu-item">Back to Home</a>
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
    </>
  );
}
