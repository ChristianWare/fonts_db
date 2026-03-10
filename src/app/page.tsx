import AdminDashboardFeatures from "./components/HomePage/AdminDashboardFeatures/AdminDashboardFeatures";
import Features from "./components/HomePage/Features/Features";
import Hero from "./components/HomePage/Hero/Hero";
import OtherDashboards from "./components/HomePage/OtherDashboards/OtherDashboards";
import Outgrow from "./components/HomePage/Outgrow/Outgrow";
import Solution from "./components/HomePage/Solution/Solution";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Outgrow />
      <Solution />
      <Features />
      <AdminDashboardFeatures />
      <OtherDashboards />
    </main>
  );
}
