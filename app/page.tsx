import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import RoadmapSection from "@/components/RoadmapSection";
import WhoWeAre from "@/components/WhoWeAre";
import MissionGrid from "@/components/MissionGrid";
import AboutEvents from "@/components/AboutEvents";
import SpotlightStats from "@/components/SpotlightStats";
import Mentors from "@/components/Mentors";
import FAQAccordion from "@/components/FAQAccordion";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <main className="hero">
        <Navbar />
        <Hero />
      </main>
      <div className="empty-section"></div>
      <div className="all-sections-wrapper">
        <div
          data-w-id="fb427fae-3205-2f87-dd41-eadd66de26d3"
          className="two-sections-wrapper"
        >
          <RoadmapSection />
          <WhoWeAre />
        </div>
        <div className="sections-wrapper">
          <MissionGrid />
          <AboutEvents />
          <SpotlightStats />
          <Mentors />
          <FAQAccordion />
          <ContactSection />
          <Footer />
        </div>
      </div>
    </>
  );
}
