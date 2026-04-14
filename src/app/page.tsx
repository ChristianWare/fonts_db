/* eslint-disable @typescript-eslint/no-unused-vars */
import Faq from "@/components/HomePage/Faq/Faq";
import AdminDashboardFeatures from "../components/HomePage/AdminDashboardFeatures/AdminDashboardFeatures";
import ComparisonChart from "../components/HomePage/ComparisonChart/ComparisonChart";
import Features from "../components/HomePage/Features/Features";
import Hero from "../components/HomePage/Hero/Hero";
import HowItWorks from "../components/HomePage/HowItWorks/HowItWorks";
import OtherDashboards from "../components/HomePage/OtherDashboards/OtherDashboards";
import Outgrow from "../components/HomePage/Outgrow/Outgrow";
import ParallaxArea from "../components/HomePage/ParallaxArea/ParallaxArea";
import PricingPreview from "../components/HomePage/PricingPreview/PricingPreview";
import ProjectSection from "../components/HomePage/ProjectSection/ProjectSection";
import Solution from "../components/HomePage/Solution/Solution";
import ContactSection from "@/components/HomePage/ContactSection/ContactSection";
import Chris from "@/components/HomePage/Chris/Chris";
import ProblemSolution from "@/components/HomePage/ProblemSolution/ProblemSolution";
import ROICalculator from "@/components/HomePage/ROICalculator/ROICalculator";
import Solutionii from "@/components/HomePage/Solutionii/Solutionii";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <div id='learn-more'>
        <Outgrow />
        {/* <ProblemSolution /> */}
        {/* <OtherDashboards /> */}
        <Solutionii />
        <Solution />
        {/* <ProblemSolution />
        <Solution /> */}
      </div>

      {/* <div id='features'>
        <Features />
        <AdminDashboardFeatures />
        <OtherDashboards />
      </div>

      <div id='work'>
        <ProjectSection />
        <ParallaxArea />
      </div>

      <div id='pricing'>
        <PricingPreview />
        <ROICalculator />
      </div>

      <HowItWorks />
      <Faq />

      <div id='about'>
        <Chris />
      </div>

      <div id='contact'>
        <ContactSection />
      </div> */}
    </main>
  );
}
