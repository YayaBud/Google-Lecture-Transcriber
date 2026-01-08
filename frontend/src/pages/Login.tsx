import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { Mic, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "../hooks/use-toast";
import { api } from '../lib/api';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { response, data } = await api.login(formData);
      
      if (response.ok) {
        toast({
          title: "Welcome back!",
          description: "Logged in successfully.",
        });
        navigate('/dashboard');
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

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
          {/* Interactive test credentials info box */}
          <div className="mb-6 flex flex-col items-center animate-fade-in">
            <div className="bg-gradient-to-br from-primary/20 via-background to-primary/10 border border-primary/40 rounded-2xl px-6 py-5 flex flex-col items-center gap-3 shadow-xl animate-fade-in">
              <span className="font-semibold text-lg text-primary flex items-center gap-2">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="inline-block">
                  <path d="M12 2C7.03 2 3 6.03 3 11c0 4.97 4.03 9 9 9s9-4.03 9-9c0-4.97-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z" fill="#38bdf8"/>
                  <path d="M12 7a4 4 0 100 8 4 4 0 000-8z" fill="#0ea5e9"/>
                </svg>
                Test Login Credentials
              </span>
              <div className="flex gap-3 items-center w-full justify-center">
                <span className="text-sm text-muted-foreground font-medium">Email:</span>
                <button 
                  type="button"
                  className="text-sm font-mono px-3 py-1 rounded-lg bg-black/80 border border-primary/30 cursor-pointer shadow-sm transition-all duration-300 hover:scale-105 hover:bg-primary/30"
                  onClick={() => {
                    navigator.clipboard.writeText('soulera897@gmail.com');
                    toast({ title: "Copied!", description: "Email copied to clipboard" });
                  }}
                >
                  soulera897@gmail.com
                </button>
              </div>
              <div className="flex gap-3 items-center w-full justify-center">
                <span className="text-sm text-muted-foreground font-medium">Password:</span>
                <button 
                  type="button"
                  className="text-sm font-mono px-3 py-1 rounded-lg bg-black/80 border border-primary/30 cursor-pointer shadow-sm transition-all duration-300 hover:scale-105 hover:bg-primary/30"
                  onClick={() => {
                    navigator.clipboard.writeText('Souleragonnawin');
                    toast({ title: "Copied!", description: "Password copied to clipboard" });
                  }}
                >
                  Souleragonnawin
                </button>
              </div>
              <span className="text-xs text-muted-foreground mt-2 text-center">
                Use these credentials to log in for testing!
              </span>
            </div>
          </div>
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg mb-4">
              <Mic className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Welcome Back</h1>
            <p className="text-muted-foreground text-sm">Log in to your NoteFlow account</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input 
                placeholder="name@example.com" 
                type="email" 
                required 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <Input 
                placeholder="••••••••" 
                type="password" 
                required 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="bg-background border-border"
              />
            </div>
            
            <Button 
              type="submit"
              disabled={isLoading}
              className="w-full h-11 text-base rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02]"
            >
              {isLoading ? "Logging in..." : "Log In"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button 
            type="button"
            variant="outline" 
            className="w-full h-11 rounded-xl transition-all duration-300 hover:bg-accent"
            onClick={() => api.googleLogin()}
          >
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
            </svg>
            Google
          </Button>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary font-semibold hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
