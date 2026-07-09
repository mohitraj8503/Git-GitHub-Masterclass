import AssetImage from "@/components/AssetImage";

export default function WhoWeAre() {
  return (
    <div className="w-layout-blockcontainer container-wide w-container">
  <div className="who-we-are-section-wrapper">
    <section id="who-we-are" className="section section-padding">
      <div className="w-layout-blockcontainer container w-container">
        <div className="wrapper vertical-flex-center">
          <div className="who-we-are-content">
            <div className="medium-s-uppercase">About the Program</div>
            <div className="large-heding">
              Learn Git the Way Real Developers Do
            </div>
            <p className="medium-m" style={{maxWidth: 520, marginBottom: 28, letterSpacing: 0, textTransform: 'none'}}>
              This workshop is organized by the Microsoft Learn Student
              Ambassador program at Arka Jain University. Over seven
              days, you'll build one real project from scratch
              — using the exact Git and GitHub workflow used at
              companies like Microsoft and Google.
            </p>
            <a href="https://forms.gle/2FDrawGpibbderMu6" target="_blank" className="button primary primary-black w-inline-block"><div className="medium-m-uppercase">See the Schedule</div>
              <div className="button-icon-wrapper primary-black-icon">
                <AssetImage src="/images/arrow-20right-20up-1.svg" loading="lazy" alt="" className="icon-size-16" /></div></a><AssetImage src="/images/who-we-are-shape-1.svg" loading="lazy" data-w-id="a5cfa73d-99fb-b4dc-81bb-1dc90c392969" alt="" className="who-we-are-shape-1" /><AssetImage src="/images/who-we-are-shape-2.svg" loading="lazy" data-w-id="b0a65224-62fc-0af4-ffcc-8c2da6dc9e96" alt="" className="who-we-are-shape-2" /><AssetImage src="/images/who-we-are-shape-3.svg" loading="lazy" data-w-id="fa3d18fc-32ec-416b-2816-bc5c50122ddf" alt="" className="who-we-are-shape-3" />
            <div className="who-we-are-ball-1" />
            <div className="who-we-are-ball-2" />
          </div>
        </div>
      </div>
    </section>
  </div>
</div>
  );
}
