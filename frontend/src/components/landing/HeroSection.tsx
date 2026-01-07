export default HeroSection;
export { StarBackground };
import React, { useRef, useEffect } from 'react';
import { Button } from "../ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Mic, Brain, Zap, Shield } from "lucide-react";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.15 } }
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

// Live Star Background Component
function StarBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    let stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.2 + 0.3,
      dx: (Math.random() - 0.5) * 0.18, // Slightly slower speed
      dy: (Math.random() - 0.5) * 0.18, // Slightly slower speed
      twinkle: Math.random() * 0.5 + 0.5
    }));
    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      for (let star of stars) {
        ctx.save();
        ctx.globalAlpha = star.twinkle + Math.sin(Date.now() / 400 + star.x) * 0.2;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, 2 * Math.PI);
        ctx.fillStyle = "#fff";
        ctx.shadowColor = "#fff";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
        star.x += star.dx;
        star.y += star.dy;
        if (star.x < 0 || star.x > width) star.dx *= -1;
        if (star.y < 0 || star.y > height) star.dy *= -1;
      }
      requestAnimationFrame(draw);
    }
    draw();
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
  inset: 0,
  width: "100vw",
  height: "100vh",
  zIndex: 0,
  pointerEvents: "none"
      }}
    />
  );
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
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-32 pb-20 bg-background overflow-hidden">
      <StarBackground />
      {/* Simple clean background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-5xl mx-auto"
        >
          {/* Badge - Minimalist */}
          <motion.div variants={item} className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border text-xs font-medium text-secondary-foreground backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI-Powered Note Taking</span>
              </div>
            </motion.div>

            {/* Headline - Clean & Bold */}
            <motion.h1 variants={item} className="text-center font-display text-5xl md:text-7xl font-bold tracking-tight mb-8 text-foreground leading-[1.1]">
              Turn Lectures into <br />
              <span className="text-primary">Perfect Notes.</span>
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
              <motion.div variants={item} className="md:col-span-2 p-8 rounded-3xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors duration-300">
                <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center mb-4 shadow-sm text-foreground">
                  <Mic className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">Live Transcription</h3>
                <p className="text-muted-foreground">Real-time, 99% accurate speech-to-text. Simple and effective.</p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div variants={item} className="p-8 rounded-3xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors duration-300">
                <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center mb-4 shadow-sm text-foreground">
                  <Brain className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-foreground">AI Summary</h3>
                <p className="text-muted-foreground text-sm">Instant key concepts.</p>
              </motion.div>

              {/* Feature 3 */}
              <motion.div variants={item} className="p-8 rounded-3xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors duration-300">
                <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center mb-4 shadow-sm text-foreground">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-foreground">Fast Sync</h3>
                <p className="text-muted-foreground text-sm">Notes everywhere.</p>
              </motion.div>

              {/* Feature 4 */}
              <motion.div variants={item} className="md:col-span-2 p-8 rounded-3xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors duration-300">
                <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center mb-4 shadow-sm text-foreground">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">Private & Secure</h3>
                <p className="text-muted-foreground">Enterprise-grade encryption keeps your data safe.</p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    );
  }
