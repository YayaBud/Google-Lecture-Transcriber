import { Button } from "@/components/ui/button";
import { Mic, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            {/* Fixed Icon: Always Blue Background, White Mic */}
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">
              NoteFlow
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Features
            </a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              How it Works
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Pricing
            </a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            
            {/* Login Button - Ghost variant with hover scale */}
            <Button variant="ghost" asChild className="text-base font-medium hover:bg-secondary transition-all duration-300 hover:scale-105">
              <Link to="/login">Log in</Link>
            </Button>
            
            {/* Sign Up Button - Primary with strong shadow and scale */}
            <Button className="text-base font-medium rounded-full px-6 bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:scale-105" asChild>
              <Link to="/signup">Sign up</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-4">
            <ThemeToggle />
            <button
              className="p-2 text-foreground"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-4 animate-fade-in bg-background">
            <a href="#features" className="block text-muted-foreground hover:text-foreground transition-colors px-2">
              Features
            </a>
            <a href="#how-it-works" className="block text-muted-foreground hover:text-foreground transition-colors px-2">
              How it Works
            </a>
            <a href="#pricing" className="block text-muted-foreground hover:text-foreground transition-colors px-2">
              Pricing
            </a>
            <div className="pt-4 flex flex-col gap-3">
              <Button variant="ghost" asChild className="w-full justify-start">
                <Link to="/login">Log in</Link>
              </Button>
              <Button className="w-full rounded-full bg-primary text-white shadow-lg" asChild>
                <Link to="/signup">Sign up</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
