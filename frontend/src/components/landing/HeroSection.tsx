import { Button } from "../ui/button";
import { ArrowRight, Sparkles, Mic, Brain, Zap, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, Variants } from "framer-motion";


const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring", 
      stiffness: 50 
    } 
  }
};

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-32 pb-20 bg-background">
      {/* Simple clean background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

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
            {/* Primary button - uses your theme's primary color */}
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
            
            {/* Secondary button - outline style */}
            <Button 
              variant="outline" 
              size="lg" 
              className="rounded-full px-8 h-12 text-base font-semibold transition-all hover:scale-105" 
              asChild
            >
              <Link to="#how-it-works">See How It Works</Link>
            </Button>
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
};

export default HeroSection;
