import Navbar from "./components/landing/nav-bar";
import HeroSection from "./components/landing/hero-section";
import FeaturesSection from "./components/landing/FeaturesSection";
import HowItWorks from "./components/landing/HowItWorks";
import Footer from "./components/landing/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorks />
      </main>
      <Footer />
    </>
  );
}