import Faq from "@/components/HomePage/Faq/Faq";
import Hero from "../components/HomePage/Hero/Hero";
import Outgrow from "../components/HomePage/Outgrow/Outgrow";
import ProjectSection from "../components/HomePage/ProjectSection/ProjectSection";
import Solution from "../components/HomePage/Solution/Solution";
import ContactSection from "@/components/HomePage/ContactSection/ContactSection";
import Chris from "@/components/HomePage/Chris/Chris";
import Solutionii from "@/components/HomePage/Solutionii/Solutionii";
import ParallaxArea from "@/components/HomePage/ParallaxArea/ParallaxArea";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Outgrow />
      <Solutionii />
      <Solution />
      <ProjectSection />
      <Chris />
      <ParallaxArea />
      <Faq />
      <ContactSection />
    </main>
  );
}
