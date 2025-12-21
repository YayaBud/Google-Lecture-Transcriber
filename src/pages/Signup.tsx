import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { Mic, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const Signup = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 transition-colors duration-500">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="bg-card border border-border rounded-3xl p-8 shadow-xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg mb-4">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Create Account</h1>
            <p className="text-muted-foreground text-sm">Start taking smarter notes today</p>
          </div>

          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); navigate('/dashboard'); }}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">First Name</label>
                <Input placeholder="John" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Last Name</label>
                <Input placeholder="Doe" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input placeholder="name@example.com" type="email" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <Input placeholder="Create a password" type="password" required />
            </div>
            
            <Button className="w-full h-11 text-base rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:scale-[1.02]">
              Sign Up Free
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Log in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
