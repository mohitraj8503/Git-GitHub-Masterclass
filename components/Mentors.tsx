import AssetImage from "@/components/AssetImage";

export default function Mentors() {
  return (
    <section id="mentors" data-w-id="ff6e9935-d314-d3d0-4f82-52aceab02ba4" className="section section-padding section-margin-top overflow-hidden">
  <div className="w-layout-blockcontainer container margin-bottom-48-mobile-32 w-container">
    <div className="section-heading">
      <h2 className="h2 max-width-328-tablet-280-mobile-232">
        Meet the Team
      </h2>
      <p className="medium-l-uppercase section-description">
        Discover the team behind the Git &amp; GitHub Masterclass workshop.
      </p>
    </div>
  </div>
  <div className="w-layout-blockcontainer container-wide w-container">
    <div className="w-layout-grid three-columns-grid-tablet-one">
      <a data-w-id="ddcb6850-30b8-a90d-79a5-c801dd9088f1" href="https://www.linkedin.com/" target="_blank" className="person-block w-inline-block"><div className="person-block-content">
          <h2 className="h2 max-width-280-mobile-200">Prof. Rakhi Jha</h2>
          <div className="colored-chips bg-color-green">
            <div className="medium-s-uppercase">Faculty Advisor</div>
          </div>
        </div>
        <div className="absolute-card-image-wrapper">
          <div className="card-image-linear" />
          <AssetImage src="/images/rakhi_jha.jpg" loading="lazy" alt="Prof. Rakhi Jha" className="card-image" style={{objectFit: 'cover'}} /></div></a>
      <a data-w-id="5771c404-eb6f-df9b-be8f-30ec148f3b7b" href="https://www.linkedin.com/" target="_blank" className="person-block w-inline-block"><div className="person-block-content">
          <h2 className="h2 max-width-280-mobile-200">Mohit Raj</h2>
          <div className="colored-chips bg-color-magenta">
            <div className="medium-s-uppercase">Microsoft Learn Lead</div>
          </div>
        </div>
        <div className="absolute-card-image-wrapper">
          <div className="card-image-linear" />
          <AssetImage src="/images/mohit_raj.png" loading="lazy" alt="Mohit Raj" className="card-image" style={{objectFit: 'cover'}} /></div></a>
      <a data-w-id="429661cd-04bd-a9fa-a8b0-b2630af928bd" href="https://www.linkedin.com/" target="_blank" className="person-block w-inline-block"><div className="person-block-content">
          <h2 className="h2 max-width-280-mobile-200">Jaisleen Kaur</h2>
          <div className="colored-chips bg-color-blue">
            <div className="medium-s-uppercase">Technical Committee</div>
          </div>
        </div>
        <div className="absolute-card-image-wrapper">
          <div className="card-image-linear" />
          <AssetImage src="/images/jaisleen_kaur.png" loading="lazy" alt="Jaisleen Kaur" className="card-image" style={{objectFit: 'cover', transform: 'scale(1.15)'}} /></div></a>
    </div>
  </div>
</section>
  );
}
