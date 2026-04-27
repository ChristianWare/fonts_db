/* eslint-disable @typescript-eslint/no-unused-vars */
import AboutHero from "@/components/AboutPage/AboutHero/AboutHero";
import AboutPageProject from "@/components/AboutPage/AboutPageProject/AboutPageProject";
import Approach from "@/components/AboutPage/Approach/Approach";
import ChrisAboutPage from "@/components/AboutPage/ChrisAboutPage/ChrisAboutPage";
import ThreeProducts from "@/components/AboutPage/ThreeProducts/ThreeProducts";
import AdminDashboardFeatures from "@/components/HomePage/AdminDashboardFeatures/AdminDashboardFeatures";
import Chris from "@/components/HomePage/Chris/Chris";
import Features from "@/components/HomePage/Features/Features";
import HowItWorks from "@/components/HomePage/HowItWorks/HowItWorks";
import OtherDashboards from "@/components/HomePage/OtherDashboards/OtherDashboards";
import ParallaxArea from "@/components/HomePage/ParallaxArea/ParallaxArea";
import ProjectSection from "@/components/HomePage/ProjectSection/ProjectSection";

export default function AboutPage() {
  return (
    <div>
      <AboutHero />
      <ChrisAboutPage />
      <Approach />
      <ThreeProducts />
      <AboutPageProject />
      {/* <Chris /> */}
      <AdminDashboardFeatures />
      {/* <Features /> */}
      {/* <OtherDashboards /> */}
      {/* <ProjectSection /> */}
      {/* <ParallaxArea /> */}
      {/* <HowItWorks /> */}
    </div>
  );
}
