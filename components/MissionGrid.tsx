import AssetImage from "@/components/AssetImage";

export default function MissionGrid() {
  return (
    <section id="what-we-do" className="section section-padding">
  <div className="w-layout-blockcontainer container margin-bottom-48-mobile-32 w-container">
    <div className="section-heading">
      <h2 className="h2 max-width-328-tablet-280-mobile-232">
        Core Curriculum
      </h2>
      <p className="medium-l-uppercase section-description">
        From basic commands to complex collaborative workflows, we cover everything you need to master professional software version control.
      </p>
    </div>
  </div>
  <div className="w-layout-blockcontainer container-wide w-container">
    <div className="w-layout-grid three-columns-grid-tablet-two">
      <div className="service-card bg-color-coral">
        <div className="service-card-illustration-wrapper">
          <AssetImage src="/images/illustration-201.png" loading="lazy" sizes="(max-width: 479px) 80vw, (max-width: 767px) 216px, (max-width: 991px) 240px, 280px" srcSet="/images/illustration-201-p-500.png 500w,
                      /images/illustration-201-1.png     561w
              " alt="" className="service-card-illustration" />
          <div className="service-card-highlight-circle" />
        </div>
        <h3 className="h3 max-width-240-mobile-216">
          Git Fundamentals
        </h3>
      </div>
      <div className="service-card bg-color-orange">
        <div className="service-card-illustration-wrapper">
          <AssetImage src="/images/illustration-202.png" loading="lazy" sizes="(max-width: 479px) 80vw, (max-width: 767px) 216px, (max-width: 991px) 240px, 280px" srcSet="/images/illustration-202-p-500.png 500w,
                      /images/illustration-202-1.png     561w
              " alt="" className="service-card-illustration" />
          <div className="service-card-highlight-circle" />
        </div>
        <h3 className="h3 max-width-240-mobile-216">
          Branching &amp; Merging
        </h3>
      </div>
      <div className="service-card bg-color-light-purple">
        <div className="service-card-illustration-wrapper">
          <AssetImage src="/images/illustration-203.png" loading="lazy" sizes="(max-width: 479px) 80vw, (max-width: 767px) 216px, (max-width: 991px) 240px, 280px" srcSet="/images/illustration-203-p-500.png 500w,
                      /images/illustration-203-1.png     560w
              " alt="" className="service-card-illustration" />
          <div className="service-card-highlight-circle" />
        </div>
        <h3 className="h3 max-width-240-mobile-216">
          Remote Collaboration
        </h3>
      </div>
      <div className="service-card bg-color-blue">
        <div className="service-card-illustration-wrapper">
          <AssetImage src="/images/illustration-204.png" loading="lazy" sizes="(max-width: 479px) 80vw, (max-width: 767px) 216px, (max-width: 991px) 240px, 280px" srcSet="/images/illustration-204-p-500.png 500w,
                      /images/illustration-204-1.png     561w
              " alt="" className="service-card-illustration" />
          <div className="service-card-highlight-circle" />
        </div>
        <h3 className="h3 max-width-240-mobile-216">
          Pull Requests &amp; Code Review
        </h3>
      </div>
      <div className="service-card bg-color-magenta">
        <div className="service-card-illustration-wrapper">
          <AssetImage src="/images/illustration-205.png" loading="lazy" sizes="(max-width: 479px) 80vw, (max-width: 767px) 216px, (max-width: 991px) 240px, 280px" srcSet="/images/illustration-205-p-500.png 500w,
                      /images/illustration-205-1.png     561w
              " alt="" className="service-card-illustration" />
          <div className="service-card-highlight-circle" />
        </div>
        <h3 className="h3 max-width-240-mobile-216">
          Professional Repo Hygiene
        </h3>
      </div>
      <div className="service-card bg-color-green">
        <div className="service-card-illustration-wrapper">
          <AssetImage src="/images/illustration-206.png" loading="lazy" sizes="(max-width: 479px) 80vw, (max-width: 767px) 216px, (max-width: 991px) 240px, 280px" srcSet="/images/illustration-206-p-500.png 500w,
                      /images/illustration-206-1.png     560w
              " alt="" className="service-card-illustration" />
          <div className="service-card-highlight-circle" />
        </div>
        <h3 className="h3 max-width-240-mobile-216">
          Open Source Contribution
        </h3>
      </div>
    </div>
  </div>
</section>
  );
}
