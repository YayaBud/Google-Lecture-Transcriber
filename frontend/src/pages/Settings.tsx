import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useToast } from "../hooks/use-toast";
import { User, Mail, Lock, LogOut } from "lucide-react";
import { api } from '../lib/api';

interface UserProfile {
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
}

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProfile = async () => {
    try {
      const data = await api.getAuthStatus();
      if (data.authenticated && data.user) {
        setProfile(data.user);
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error("Failed to fetch profile", error);
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/auth/logout`;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <DashboardSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader 
          title="Settings" 
          subtitle="Manage your account preferences"
          showSearch={false}
        />

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Profile Section */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Profile Information</h2>
                  <p className="text-sm text-muted-foreground">Update your personal details</p>
                </div>
              </div>

              <div className="space-y-4">
                {profile?.firstName !== undefined && profile?.lastName !== undefined ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="firstName" className="text-sm font-medium">First Name</label>
                        <Input
                          id="firstName"
                          value={profile?.firstName || ''}
                          onChange={(e) => setProfile(prev => prev ? {...prev, firstName: e.target.value} : null)}
                          placeholder="John"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="firstName" className="text-sm font-medium">Last Name</label>
                        <Input
                          id="lastName"
                          value={profile?.lastName || ''}
                          onChange={(e) => setProfile(prev => prev ? {...prev, lastName: e.target.value} : null)}
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="text-sm font-medium">Name</label>
                    <Input
                      id="name"
                      value={profile?.name || ''}
                      onChange={(e) => setProfile(prev => prev ? {...prev, name: e.target.value} : null)}
                      placeholder="John Doe"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      className="pl-10 bg-muted"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <Button 
                  onClick={() => {
                    toast({
                      title: "Coming soon",
                      description: "Profile update feature will be available soon."
                    });
                  }}
                  disabled={isSaving}
                  className="w-full"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>

            {/* Security Section */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Security</h2>
                  <p className="text-sm text-muted-foreground">Manage your password and security settings</p>
                </div>
              </div>

              <div className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    toast({
                      title: "Coming soon",
                      description: "Password change feature will be available soon."
                    });
                  }}
                >
                  Change Password
                </Button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-card border border-destructive/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-destructive">Danger Zone</h2>
                  <p className="text-sm text-muted-foreground">Irreversible actions</p>
                </div>
              </div>

              <div className="space-y-4">
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
