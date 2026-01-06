import { 
  LayoutDashboard, 
  FileText, 
  Mic, 
  Star, 
  FolderOpen, 
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const mainNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "All Notes", url: "/dashboard/notes", icon: FileText },
  { title: "Record", url: "/dashboard/record", icon: Mic },
  { title: "Favorites", url: "/dashboard/favorites", icon: Star },
  { title: "Subjects", url: "/dashboard/folders", icon: FolderOpen },
];

const bottomNavItems = [
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
  { title: "Help", url: "/dashboard/help", icon: HelpCircle },
];

const DashboardSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/auth/logout', {
        credentials: 'include'
      });
      toast({
        title: "Logged out",
        description: "See you soon!",
      });
      navigate('/login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button - Only visible on mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50 h-10 w-10 bg-background border border-border shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </Button>

      {/* Mobile Overlay - Click to close */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "border-r border-border flex flex-col transition-all duration-300 bg-card/50 backdrop-blur-xl",
          // Desktop behavior
          "hidden md:flex h-screen",
          collapsed ? "w-16" : "w-64",
          // Mobile behavior - drawer from left, FULL HEIGHT
          "md:relative fixed top-0 left-0 bottom-0 z-50",
          mobileOpen ? "flex" : "hidden md:flex",
          "w-64" // Always full width on mobile when open
        )}
      >
        {/* Logo */}
        <div className="p-4 flex items-center justify-between border-b border-border shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                <Mic className="w-4 h-4" />
              </div>
              <span className="font-display font-bold text-lg text-foreground">
                NoteFlow
              </span>
            </div>
          )}
          
          {/* Desktop collapse button - hidden on mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Main nav - Now scrollable if needed */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === "/dashboard"}
              onClick={closeMobileMenu}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200",
                collapsed && "md:justify-center"
              )}
              activeClassName="bg-primary/10 text-primary font-medium"
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom nav - Fixed at bottom */}
        <div className="p-3 border-t border-border space-y-1 shrink-0">
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              onClick={closeMobileMenu}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200",
                collapsed && "md:justify-center"
              )}
              activeClassName="bg-primary/10 text-primary font-medium"
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          ))}
          
          <button
            onClick={() => {
              handleLogout();
              closeMobileMenu();
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors",
              collapsed && "md:justify-center"
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;
