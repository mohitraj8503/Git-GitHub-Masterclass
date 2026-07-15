import AssetImage from "@/components/AssetImage";

const teamMembers = [
  {
    name: "Ayush Singh",
    role: "Technical Coordinator",
    image: "/Team/Ayush_Singh.png",
    bgColor: "bg-color-coral",
    link: "https://www.linkedin.com/"
  },
  {
    name: "Suditi Srivastava",
    role: "Event Coordinator",
    image: "/Team/suditisrivastava.png",
    bgColor: "bg-color-orange",
    link: "https://www.linkedin.com/in/suditi-srivastava-a3768235b?utm_source=share_via&utm_content=profile&utm_medium=member_android"
  },
  {
    name: "Aman Monazir",
    role: "Design Lead",
    image: "/Team/Aman Monazir.png",
    bgColor: "bg-color-light-purple",
    link: "https://www.linkedin.com/"
  },
  {
    name: "Rishika Kumari",
    role: "PR & Outreach",
    image: "/Team/Rishika Kumari.png",
    bgColor: "bg-color-blue",
    link: "https://www.linkedin.com/"
  },
  {
    name: "Farhan Khalid",
    role: "Technical Co-Lead",
    image: "/Team/Farhan Khalid.jpeg",
    bgColor: "bg-color-magenta",
    link: "https://www.linkedin.com/"
  },
  {
    name: "Riteeka",
    role: "Social Media Lead",
    image: "/Team/Riteeka.png",
    bgColor: "bg-color-green",
    link: "https://www.linkedin.com/"
  },
  {
    name: "Jaisleen Kaur",
    role: "Technical Committee",
    image: "/images/jaisleen_kaur.png",
    bgColor: "bg-color-blue",
    link: "https://www.linkedin.com/"
  }
];

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
          <a data-w-id="ddcb6850-30b8-a90d-79a5-c801dd9088f1" href="https://www.linkedin.com/" target="_blank" className="person-block w-inline-block">
            <div className="person-block-content">
              <h2 className="h2 max-width-280-mobile-200">Prof. Rakhi Jha</h2>
              <div className="colored-chips bg-color-green">
                <div className="medium-s-uppercase">Faculty Advisor</div>
              </div>
            </div>
            <div className="absolute-card-image-wrapper">
              <div className="card-image-linear" />
              <AssetImage src="/images/rakhi_jha.jpg" loading="lazy" alt="Prof. Rakhi Jha" className="card-image" style={{objectFit: 'cover'}} />
            </div>
          </a>
          <a data-w-id="5771c404-eb6f-df9b-be8f-30ec148f3b7b" href="https://www.linkedin.com/" target="_blank" className="person-block w-inline-block">
            <div className="person-block-content">
              <h2 className="h2 max-width-280-mobile-200">Mohit Raj</h2>
              <div className="colored-chips bg-color-magenta">
                <div className="medium-s-uppercase">Microsoft Learn Lead</div>
              </div>
            </div>
            <div className="absolute-card-image-wrapper">
              <div className="card-image-linear" />
              <AssetImage src="/images/mohit_raj.png" loading="lazy" alt="Mohit Raj" className="card-image" style={{objectFit: 'cover'}} />
            </div>
          </a>
          <a data-w-id="429661cd-04bd-a9fa-a8b0-b2630af928bd" href="https://www.linkedin.com/" target="_blank" className="person-block w-inline-block">
            <div className="person-block-content">
              <h2 className="h2 max-width-280-mobile-200">Sayantani De</h2>
              <div className="colored-chips bg-color-coral">
                <div className="medium-s-uppercase">Faculty Member</div>
              </div>
            </div>
            <div className="absolute-card-image-wrapper">
              <div className="card-image-linear" />
              <AssetImage src="/Team/Sayantani De ( Facaulty Member ).png" loading="lazy" alt="Sayantani De" className="card-image" style={{objectFit: 'cover'}} />
            </div>
          </a>
        </div>

        {/* 7 Team Members in 1 Line */}
        <div className="seven-columns-grid">
          {teamMembers.map((member, index) => (
            <a
              key={index}
              href={member.link}
              target="_blank"
              rel="noopener noreferrer"
              className="person-block-small w-inline-block"
            >
              <div className="person-block-content-small">
                <h3 className="h2-small">{member.name}</h3>
                <div className={`colored-chips-small ${member.bgColor}`}>
                  <div className="medium-s-uppercase">{member.role}</div>
                </div>
              </div>
              <div className="absolute-card-image-wrapper">
                <div className="card-image-linear" />
                <AssetImage
                  src={member.image}
                  loading="lazy"
                  alt={member.name}
                  className="card-image"
                  style={{ objectFit: "cover", transform: member.name === "Jaisleen Kaur" ? "scale(1.15)" : undefined }}
                />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
