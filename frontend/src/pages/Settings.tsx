import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/use-toast";
import { api, tokenManager } from '../lib/api';
import { useState, useEffect } from "react";
import { LogOut, Moon, Sun, User } from "lucide-react";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get current theme
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
    
    // Get user info
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const data = await api.getAuthStatus();
      if (data.authenticated) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user info', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      tokenManager.remove(); // ✅ Clear token
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
      
      // Small delay to show toast
      setTimeout(() => {
        navigate('/login');
      }, 500);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API fails, clear local auth and redirect
      tokenManager.remove();
      navigate('/login');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', newTheme);
    
    toast({
      title: "Theme updated",
      description: `Switched to ${newTheme} mode.`,
    });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader 
          title="Settings" 
          subtitle="Manage your account and preferences"
          showSearch={false}
        />
        
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-8">
            
            {/* Account Information */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Account Information</h2>
              </div>
              
              {isLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              ) : user ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground">Name</label>
                    <p className="text-foreground font-medium">
                      {user.first_name} {user.last_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Email</label>
                    <p className="text-foreground font-medium">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Auth Provider</label>
                    <p className="text-foreground font-medium capitalize">{user.auth_provider || 'Local'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Failed to load user information</p>
              )}
            </div>

            {/* Appearance */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                {theme === 'dark' ? (
                  <Moon className="w-5 h-5 text-primary" />
                ) : (
                  <Sun className="w-5 h-5 text-primary" />
                )}
                <h2 className="text-xl font-semibold text-foreground">Appearance</h2>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Theme</p>
                  <p className="text-sm text-muted-foreground">
                    Currently using {theme} mode
                  </p>
                </div>
                <Button onClick={toggleTheme} variant="outline" className="gap-2">
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-4 h-4" />
                      Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4" />
                      Dark Mode
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-card border border-destructive/50 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <LogOut className="w-5 h-5 text-destructive" />
                <h2 className="text-xl font-semibold text-foreground">Danger Zone</h2>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Log Out</p>
                  <p className="text-sm text-muted-foreground">
                    Sign out of your account
                  </p>
                </div>
                <Button 
                  onClick={handleLogout}
                  variant="destructive"
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </Button>
              </div>
            </div>

            {/* Debug Info (Remove in production) */}
            <div className="bg-muted/50 border border-border rounded-2xl p-6 space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Debug Info</h3>
              <div className="text-xs font-mono text-muted-foreground space-y-1">
                <p>Token stored: {tokenManager.get() ? '✅ Yes' : '❌ No'}</p>
                <p>User ID: {user?.id || 'N/A'}</p>
                <p>Auth Provider: {user?.auth_provider || 'N/A'}</p>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;