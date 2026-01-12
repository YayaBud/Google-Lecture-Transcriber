import React, { useRef, useEffect, useState } from 'react';
import { Button } from "../ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Mic, Brain, Zap, Shield } from "lucide-react";
import { motion } from "framer-motion";
import Particles from "./Particles";
import SpotlightCard from "../ui/SpotlightCard";

const container = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.15 } }
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

// Typewriter Hook with Loop
function useTypewriter(text: string, speed: number = 50) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDelaying, setIsDelaying] = useState(false);

  useEffect(() => {
    if (isDelaying) return;

    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else {
      // Finished typing, wait 2 seconds then reset
      const delayTimeout = setTimeout(() => {
        setIsDelaying(true);
        setDisplayText("");
        setCurrentIndex(0);
        setTimeout(() => setIsDelaying(false), 100);
      }, 2000);
      return () => clearTimeout(delayTimeout);
    }
  }, [currentIndex, text, speed, isDelaying]);

  return displayText;
}

// Magnetic Button Wrapper
function MagneticButton({ children }: { children: React.ReactNode }): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let mouseX = 0, mouseY = 0;
    let rect: DOMRect | null = null;
    function handleMouseMove(e: MouseEvent) {
      if (!el) return;
      rect = el.getBoundingClientRect();
      mouseX = e.clientX - rect.left - rect.width / 2;
      mouseY = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${mouseX * 0.12}px, ${mouseY * 0.12}px)`;
    }
    function handleMouseLeave() {
      if (!el) return;
      el.style.transform = "translate(0,0)";
    }
    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);
  return (
    <div ref={ref} style={{ display: "inline-block", transition: "transform 0.2s cubic-bezier(.22,.68,.43,1.01)" }}>
      {children}
    </div>
  );
}

function HeroSection() {
  const fullText = "Turn Lectures into\nPerfect Notes.";
  const typewriterText = useTypewriter(fullText, 80);

  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDarkMode(root.classList.contains("dark"));

    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  
  // Split by newline for display
  const lines = typewriterText.split('\n');
  const line1 = lines[0] || "";
  const line2 = lines[1] || "";
  
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-32 pb-20 bg-background overflow-hidden">
      {isDarkMode && (
        <Particles
          particleColors={["#ffffff", "#ffffff"]}
          particleCount={260}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={true}
          alphaParticles={false}
          disableRotation={false}
        />
      )}
      {/* Simple clean background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-10" />

      <div className="container mx-auto px-4 relative z-20">
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-5xl mx-auto"
        >
          {/* Badge - Minimalist */}
          <motion.div variants={item} className="flex justify-center mb-8">
            <SpotlightCard className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border text-xs font-medium text-secondary-foreground backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI-Powered Note Taking</span>
            </SpotlightCard>
            </motion.div>

            {/* Headline - Clean & Bold with Typewriter Effect */}
            <motion.h1 variants={item} className="text-center font-display text-5xl md:text-7xl font-bold tracking-tight mb-8 text-foreground leading-[1.1] min-h-[180px] md:min-h-[230px]">
              {line1}
              {line1 && !line2 && <span className="inline-block animate-pulse">_</span>}
              {line2 && (
                <>
                  <br />
                  <span className="text-primary">{line2}</span>
                  {typewriterText.length < fullText.length && <span className="text-primary inline-block animate-pulse">_</span>}
                </>
              )}
            </motion.h1>

            <motion.p variants={item} className="text-center text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
              Capture every word with AI precision. We transcribe, summarize, and organize your study material while you focus on learning.
            </motion.p>

            {/* ✅ FIXED: Buttons now use theme colors properly */}
            <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24">
              <MagneticButton>
                <Button 
                  size="lg" 
                  className="rounded-full px-8 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105" 
                  asChild
                >
                  <Link to="/dashboard">
                    Start for Free
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </MagneticButton>
              <MagneticButton>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="rounded-full px-8 h-12 text-base font-semibold transition-all hover:scale-105" 
                  asChild
                >
                  <Link to="#how-it-works">See How It Works</Link>
                </Button>
              </MagneticButton>
            </motion.div>
            {/* Clean Bento Grid - No color backgrounds */}
            <motion.div 
              variants={container}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Feature 1 */}
              <motion.div variants={item} className="md:col-span-2">
                <SpotlightCard className="p-8 rounded-3xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors duration-300">
                  <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center mb-4 shadow-sm text-foreground">
                    <Mic className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">Live Transcription</h3>
                  <p className="text-muted-foreground">Real-time, 99% accurate speech-to-text. Simple and effective.</p>
                </SpotlightCard>
              </motion.div>

              {/* Feature 2 */}
              <motion.div variants={item}>
                <SpotlightCard className="p-8 rounded-3xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors duration-300">
                  <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center mb-4 shadow-sm text-foreground">
                    <Brain className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-foreground">AI Summary</h3>
                  <p className="text-muted-foreground text-sm">Instant key concepts.</p>
                </SpotlightCard>
              </motion.div>

              {/* Feature 3 */}
              <motion.div variants={item}>
                <SpotlightCard className="p-8 rounded-3xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors duration-300">
                  <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center mb-4 shadow-sm text-foreground">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-foreground">Fast Sync</h3>
                  <p className="text-muted-foreground text-sm">Notes everywhere.</p>
                </SpotlightCard>
              </motion.div>

              {/* Feature 4 */}
              <motion.div variants={item} className="md:col-span-2">
                <SpotlightCard className="p-8 rounded-3xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors duration-300">
                  <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center mb-4 shadow-sm text-foreground">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">Private & Secure</h3>
                  <p className="text-muted-foreground">Enterprise-grade encryption keeps your data safe.</p>
                </SpotlightCard>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    );
}

export default HeroSection;
