import AssetImage from "@/components/AssetImage";

export default function ContactSection() {
  return (
    <section id="contact-us" className="section section-padding section-margin-top">
      <div className="w-layout-blockcontainer container margin-bottom-48-mobile-32 w-container">
        <div className="section-heading">
          <h2 className="h2 max-width-328-tablet-280-mobile-232">
            READY TO START YOUR GIT JOURNEY?
          </h2>
          <p className="medium-l-uppercase section-description">
            Registration is open now — seats are limited. Fill out the form to reserve your spot.
          </p>
        </div>
      </div>
      <div className="w-layout-blockcontainer container-wide w-container">
        <div className="w-layout-grid contact-grid">
          <div className="contact-info">
            <a href="mailto:support@example.com?subject=Git Workshop Inquiry" className="contact-block bg-color-orange w-inline-block"><div className="contact-block-illustration-wrapper">
              <AssetImage src="/images/illustration-207.png" loading="lazy" sizes="184px" srcSet="/images/illustration-207-p-500.png 500w,
                      /images/illustration-207-1.png     560w
                " alt="" className="contact-block-illustration" />
              <div className="contact-block-highlight-circle" />
            </div>
              <div className="contact-block-text">
                <h3 className="h3 max-width-240-mobile-200">Email</h3>
                <div className="absolute-block-icons-wrapper">
                  <AssetImage src="/images/arrow-20right-20up.svg" loading="lazy" alt="" className="absolute-block-icon" /><AssetImage src="/images/arrow-20right-20up.svg" loading="lazy" alt="" className="absolute-block-icon second-icon" />
                </div></div></a><a href="https://discord.com/events/1526478795857592401/1526481750807674881" target="_blank" className="contact-block bg-color-light-purple w-inline-block"><div className="contact-block-illustration-wrapper">
                  <AssetImage src="/images/illustration-208.png" loading="lazy" sizes="184px" srcSet="/images/illustration-208-p-500.png 500w,
                      /images/illustration-208-1.png     560w
                " alt="" className="contact-block-illustration" />
                  <div className="contact-block-highlight-circle" />
                </div>
              <div className="contact-block-text">
                <h3 className="h3 max-width-240-mobile-200">Join Us</h3>
                <div className="absolute-block-icons-wrapper">
                  <AssetImage src="/images/arrow-20right-20up.svg" loading="lazy" alt="" className="absolute-block-icon" /><AssetImage src="/images/arrow-20right-20up.svg" loading="lazy" alt="" className="absolute-block-icon second-icon" />
                </div></div></a>
            <div id="w-node-_0f677f1b-4aa6-a36a-538a-82c50189bf46-0ebf6c48" className="contact-form-wrapper">
              <div className="wrapper max-width-400">
                <h3 className="h3 color-black margin-bottom-12">
                  Drop Us a Line
                </h3>
                <p className="medium-m color-black">
                  We value your feedback and look forward to hearing from
                  you. We will respond promptly to assist you with your
                  needs.
                </p>
              </div>
              <div className="form-block w-form">
                <form id="email-form" name="email-form" data-name="Email Form" method="get" className="contact-form" data-wf-page-id="664af7bf6430c50e0ebf6c48" data-wf-element-id="6f240489-1b40-84a6-2c24-fe99db9398c9">
                  <div className="form-inputs-wrapper">
                    <input className="form-input w-input" maxLength={256} name="Full-Name" data-name="Full Name" placeholder="Full Name" type="text" id="Full-Name" required /><input className="form-input w-input" maxLength={256} name="Email" data-name="Email" placeholder="Email" type="email" id="Email" required /><textarea required placeholder="Message" maxLength={5000} id="Message" name="Message" data-name="Message" className="form-area w-input" defaultValue={""} />
                  </div>
                  <input type="submit" data-wait="Please wait..." className="button form-button w-button" defaultValue="Send a Message" />
                </form>
                <div className="success-message w-form-done">
                  <div className="success-message-content">
                    <div className="success-message-icon">
                      <AssetImage src="/images/checkmark.svg" loading="lazy" alt="" className="icon-size-24" />
                    </div>
                    <div className="success-message-text">
                      <div className="regular-xl max-width-160">
                        Your Message Has&nbsp;Been Sent
                  </div>
                      <p className="medium-m">
                        You can expect a response within 24 hours.
                        Stay&nbsp;tuned for some fantastic news!
                      </p>
                    </div>
                  </div>
                </div>
                <div className="error-message w-form-fail">
                  <div className="medium-m">
                    Oops, something went wrong! Please double-check your
                    submission and try again.
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div data-poster-url="/images/6976368-uhd_1440_1920_25fps-poster-00001.jpg" data-video-urls="/Video.mp4" data-autoplay="true" data-loop="true" data-wf-ignore="true" className="contact-video w-background-video w-background-video-atom">
            <video id="679fedca-8de7-34d3-c77a-2c5a5af7253b-video" autoPlay loop style={{backgroundImage: 'url("/images/6976368-uhd_1440_1920_25fps-poster-00001.jpg")'}} muted playsInline data-wf-ignore="true" data-object-fit="cover">
              <source src="/Video.mp4" data-wf-ignore="true" />
            </video>
          </div>
        </div>
      </div>
    </section>
  );
}
