import AssetImage from "@/components/AssetImage";

export default function SpotlightStats() {
  return (
    <section id="highlights" className="section section-padding section-margin-top">
  <div className="w-layout-blockcontainer container w-container">
    <div className="section-heading margin-bottom-64-mobile-48">
      <h2 className="h2 max-width-328-tablet-280-mobile-232">
        Spotlight Moments
      </h2>
      <p className="medium-l-uppercase section-description">
        Discover the most memorable moments from our events, showcasing
        the best in creativity, innovation, and engagement.
      </p>
    </div>
    <div className="w-layout-grid three-columns-wide-grid-tablet-two larger-gap">
      <div className="highlights-block">
        <div className="highlights-block-content">
          <div className="highlights-block-text">
            <div className="large-heding color-blue">7</div>
            <div className="medium-l-uppercase">Days of Live Learning</div>
          </div>
          <AssetImage src="/images/timer.svg" loading="lazy" alt="" className="highlights-icon" />
        </div>
        <div className="highlights-glow blue-glow" />
      </div>
      <div className="highlights-block">
        <div className="highlights-block-content">
          <div className="highlights-block-text">
            <div className="large-heding color-magenta">50+</div>
            <div className="medium-l-uppercase">Commits per Student</div>
          </div>
          <AssetImage src="/images/cursor.svg" loading="lazy" alt="" className="highlights-icon" />
        </div>
        <div className="highlights-glow magenta-glow" />
      </div>
      <div className="highlights-block">
        <div className="highlights-block-content">
          <div className="highlights-block-text">
            <div className="large-heding color-green">8-12</div>
            <div className="medium-l-uppercase">Competing Teams</div>
          </div>
          <AssetImage src="/images/signal.svg" loading="lazy" alt="" className="highlights-icon" />
        </div>
        <div className="highlights-glow green-glow" />
      </div>
      <div className="highlights-block">
        <div className="highlights-block-content">
          <div className="highlights-block-text">
            <div className="large-heding color-light-purple">1</div>
            <div className="medium-l-uppercase">Live Deployed Portfolio</div>
          </div>
          <AssetImage src="/images/category.svg" loading="lazy" alt="" className="highlights-icon" />
        </div>
        <div className="highlights-glow light-purple-glow" />
      </div>
      <div className="highlights-block">
        <div className="highlights-block-content">
          <div className="highlights-block-text">
            <div className="large-heding colors-orange">1</div>
            <div className="medium-l-uppercase">Open-Source Contribution</div>
          </div>
          <AssetImage src="/images/idea.svg" loading="lazy" alt="" className="highlights-icon" />
        </div>
        <div className="highlights-glow orange-glow" />
      </div>
      <div className="highlights-block">
        <div className="highlights-block-content">
          <div className="highlights-block-text">
            <div className="large-heding color-coral">1</div>
            <div className="medium-l-uppercase">New GitHub Community Launched</div>
          </div>
          <AssetImage src="/images/rocket.svg" loading="lazy" alt="" className="highlights-icon" />
        </div>
        <div className="highlights-glow coral-glow" />
      </div>
    </div>
  </div>
</section>
  );
}
