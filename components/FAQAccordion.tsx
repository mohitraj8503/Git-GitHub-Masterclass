import AssetImage from "@/components/AssetImage";

export default function FAQAccordion() {
  return (
    <div className="w-layout-blockcontainer container-wide w-container">
  <div className="faq-section-wrapper">
    <section id="faq" className="section section-padding">
      <div className="w-layout-blockcontainer container w-container">
        <div className="wrapper vertical-flex-center">
          <div className="faq-content">
            <div className="wrapper vertical-flex-center max-width-328-tablet-280-mobile-232 center-text">
              <div className="medium-s-uppercase margin-bottom-32-mobile-24">
                HAve A Question?
              </div>
              <h2 className="h2">We have Answers</h2>
            </div>
            <div className="faq-items-wrapper">
              <div className="faq-item">
                <div className="faq-question">
                  <div className="semibold-l-uppercase">
                    Who can join this workshop?
                  </div>
                  <AssetImage src="/images/plus.svg" loading="lazy" alt="" className="icon-size-24" />
                </div>
                <div className="faq-answer">
                  <p className="medium-m faq-answer-text">
                    Any B.Tech or Diploma student at Arka Jain
                    University — no prior experience required.
                  </p>
                </div>
              </div>
              <div className="faq-item">
                <div className="faq-question">
                  <div className="semibold-l-uppercase">
                    Do I need to bring my own laptop?
                  </div>
                  <AssetImage src="/images/plus.svg" loading="lazy" alt="" className="icon-size-24" />
                </div>
                <div className="faq-answer">
                  <p className="medium-m faq-answer-text">
                    Recommended, but lab systems will be available if
                    needed.
                  </p>
                </div>
              </div>
              <div className="faq-item">
                <div className="faq-question">
                  <div className="semibold-l-uppercase">
                    Is this workshop free?
                  </div>
                  <AssetImage src="/images/plus.svg" loading="lazy" alt="" className="icon-size-24" />
                </div>
                <div className="faq-answer">
                  <p className="medium-m faq-answer-text">
                    Yes, completely free for all registered students.
                  </p>
                </div>
              </div>
              <div className="faq-item">
                <div className="faq-question">
                  <div className="semibold-l-uppercase">
                    Will I get a certificate?
                  </div>
                  <AssetImage src="/images/plus.svg" loading="lazy" alt="" className="icon-size-24" />
                </div>
                <div className="faq-answer">
                  <p className="medium-m faq-answer-text">
                    This workshop focuses on real, tangible outcomes — a
                    live deployed portfolio and a merged open-source
                    contribution — rather than a certificate.
                  </p>
                </div>
              </div>
              <div className="faq-item">
                <div className="faq-question">
                  <div className="semibold-l-uppercase">
                    Do I need to attend all 7 days?
                  </div>
                  <AssetImage src="/images/plus.svg" loading="lazy" alt="" className="icon-size-24" />
                </div>
                <div className="faq-answer">
                  <p className="medium-m faq-answer-text">
                    Yes — each day builds directly on the previous one.
                  </p>
                </div>
              </div>
              <div className="faq-item">
                <div className="faq-question">
                  <div className="semibold-l-uppercase">
                    What if I don't know how to code at all?
                  </div>
                  <AssetImage src="/images/plus.svg" loading="lazy" alt="" className="icon-size-24" />
                </div>
                <div className="faq-answer">
                  <p className="medium-m faq-answer-text">
                    That's fine — Day 1 starts from zero, and every
                    session is beginner-friendly.
                  </p>
                </div>
              </div>
            </div>
            <AssetImage src="/images/arrow-shape.svg" loading="lazy" data-w-id="3a9f640f-2e4a-88dc-3740-9ef9f7a56926" alt="" className="faq-shape-1" /><AssetImage src="/images/faq-shape-2.svg" loading="lazy" data-w-id="8b78431b-8eb4-d3a2-0998-524729213820" alt="" className="faq-shape-2" /><AssetImage src="/images/faq-shape-3.svg" loading="lazy" data-w-id="8706a278-2242-065a-7e11-83da4fdb97c0" alt="" className="faq-shape-3" />
            <div className="faq-ball-1" />
            <div className="faq-ball-2" />
          </div>
        </div>
      </div>
    </section>
  </div>
</div>
  );
}
