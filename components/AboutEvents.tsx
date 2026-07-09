import AssetImage from "@/components/AssetImage";

export default function AboutEvents() {
  return (
    <>
        <section id="about-events" className="section section-padding section-margin-top">
    <div className="w-layout-blockcontainer container w-container">
      <div className="wrapper vertical-flex-center">
        <div className="about-events-block">
          <div className="heading-and-badge-wrapper">
            <h2 className="h2">Not Just a Workshop — A Working Portfolio</h2>
            <div className="heading-badge">
              <div className="medium-s-uppercase">Real Projects</div>
            </div>
          </div>
          <div className="about-events-content">
            <div className="regular-xxl color-grey-60">
              Every day builds on the same live project. You'll
              <span className="color-white">build and deploy a real portfolio website</span>
              and contribute to a
              <span className="color-white">shared open-source repository</span>
              — leaving with
              <span className="color-white">links you can put directly on your resume</span>.
            </div>
            <a href="https://forms.gle/2FDrawGpibbderMu6" target="_blank" className="button primary primary-accent w-inline-block"><div className="medium-m-uppercase">Register Now</div>
              <div className="button-icon-wrapper primary-accent-icon">
                <AssetImage src="/images/arrow-20right-20up-2.svg" loading="lazy" alt="" className="icon-size-16" /></div></a>
          </div>
          <AssetImage src="/images/about-events-shape-1.svg" loading="lazy" data-w-id="4c5e1c0b-b491-311d-711d-bcede33598e2" alt="" className="about-events-shape-1" /><AssetImage src="/images/about-events-shape-2.svg" loading="lazy" data-w-id="1740926b-0e61-edc0-71ba-03ab9f6480d4" alt="" className="about-events-shape-2" /><AssetImage src="/images/about-events-shape-3.svg" loading="lazy" data-w-id="eb3b1135-2916-5653-9b68-92fc1ae2762e" alt="" className="about-events-shape-3" /><AssetImage src="/images/about-events-shape-4.svg" loading="lazy" data-w-id="c97aed93-7db1-1edd-af22-7ede1bacb208" alt="" className="about-events-shape-4" />
        </div>
      </div>
    </div>
  </section>
  <section className="section section-padding section-margin-top">
    <div className="w-layout-blockcontainer container-wide w-container">
      <div data-poster-url="/images/6976655-uhd_1920_1440_25fps-poster-00001.jpg" data-video-urls="/images/6976655-uhd_1920_1440_25fps-transcode.mp4,/images/6976655-uhd_1920_1440_25fps-transcode.webm" data-autoplay="true" data-loop="true" data-wf-ignore="true" className="video w-background-video w-background-video-atom">
        <video id="a37c3082-9596-2c0e-ffce-e94212b63813-video" autoPlay loop style={{backgroundImage: 'url("/images/6976655-uhd_1920_1440_25fps-poster-00001.jpg")'}} muted playsInline data-wf-ignore="true" data-object-fit="cover">
          <source src="/images/6976655-uhd_1920_1440_25fps-transcode.mp4" data-wf-ignore="true" />
          <source src="/images/6976655-uhd_1920_1440_25fps-transcode.webm" data-wf-ignore="true" />
        </video>
        <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 10, pointerEvents: 'none', padding: 24, textAlign: 'center'}}>
          <h2 style={{color: '#ffffff', fontFamily: '"Anton", sans-serif', fontSize: 'clamp(32px, 6vw, 80px)', letterSpacing: '-1.5px', textTransform: 'uppercase', margin: 0, textShadow: '0px 4px 30px rgba(0, 0, 0, 0.7)', lineHeight: 1.0, fontWeight: 400}}>
            Still Looking for a GitHub Workshop?
          </h2>
          <p style={{color: '#ffffff', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: 'clamp(16px, 2vw, 24px)', letterSpacing: '0.5px', textTransform: 'uppercase', marginTop: 16, marginBottom: 0, textShadow: '0px 2px 15px rgba(0, 0, 0, 0.7)', fontWeight: 600}}>
            Join Here at Arka Jain University
          </p>
        </div>
      </div>
    </div>
  </section>
    </>
  );
}
