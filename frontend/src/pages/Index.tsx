import Navbar from "../components/landing/Navbar";
import HeroSection from "../components/landing/HeroSection";
import { StarBackground } from "../components/landing/HeroSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import HowItWorksSection from "../components/landing/HowItWorksSection";
import CTASection from "../components/landing/CTASection";
import Footer from "../components/landing/Footer";
import { useScrollEffects } from "../hooks/useScrollEffects";

const Index = () => {
  useScrollEffects();
  return (
    <div className="min-h-screen bg-background transition-colors duration-500 relative overflow-hidden">
      {/* Star background covers all sections */}
      <StarBackground />
      <div className="relative z-10">
        <Navbar />
        <div className="scroll-fx"><HeroSection /></div>
        <div className="scroll-fx"><FeaturesSection /></div>
        <div className="scroll-fx"><HowItWorksSection /></div>
        <div className="scroll-fx"><CTASection /></div>
        <Footer />
      </div>
    </div>
  );
};

export default Index;
