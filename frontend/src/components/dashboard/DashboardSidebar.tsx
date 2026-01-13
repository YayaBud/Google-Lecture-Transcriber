import {
  LayoutDashboard,
  FileText,
  Mic,
  Star,
  BookOpen,
  FolderOpen,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  MessageCircle,
} from "lucide-react";
import { gsap } from "gsap";
import { NavLink } from "../NavLink";
import { Button } from "../ui/button";
import { useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/use-toast";

const mainNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "All Notes", url: "/dashboard/notes", icon: FileText },
  { title: "Notes Flashcards", url: "/dashboard/flashcards", icon: BookOpen },
  { title: "Record", url: "/dashboard/record", icon: Mic },
  { title: "Favorites", url: "/dashboard/favorites", icon: Star },
  { title: "Subjects", url: "/dashboard/folders", icon: FolderOpen },
  { title: "AI Tutor", url: "/dashboard/chatbot", icon: MessageCircle },
];


const bottomNavItems = [
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
  { title: "Help", url: "/dashboard/help", icon: HelpCircle },
];

const DashboardSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const asideRef = useRef<HTMLElement | null>(null);
  const preLayersRef = useRef<HTMLDivElement | null>(null);
  const toggleIconRef = useRef<HTMLSpanElement | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const goHome = () => {
    closeMobileMenu();
    navigate("/");
  };

  const handleLogout = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await fetch(`${API_URL}/auth/logout`, {
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

  const toggleCollapsed = () => {
    if (isAnimating) return;

    // Only run the fancy animation on desktop; mobile uses the drawer.
    if (typeof window !== "undefined") {
      const isDesktop = window.matchMedia?.("(min-width: 768px)").matches;
      if (!isDesktop) {
        setCollapsed((v) => !v);
        return;
      }
    }

    const aside = asideRef.current;
    if (!aside) {
      setCollapsed((v) => !v);
      return;
    }

    setIsAnimating(true);

    const layers = Array.from(preLayersRef.current?.querySelectorAll(".ds-prelayer") ?? []);
    const labels = Array.from(aside.querySelectorAll<HTMLElement>(".ds-label"));
    const logoText = aside.querySelector<HTMLElement>(".ds-logoText");
    const animateTargets = logoText ? [logoText, ...labels] : labels;

    const iconEl = toggleIconRef.current;
    if (iconEl) {
      gsap.killTweensOf(iconEl);
    }

    const wExpanded = 256; // Tailwind w-64
    const wCollapsed = 64; // Tailwind md:w-16

    const primeLayers = (fromX: number) => {
      if (!layers.length) return;
      gsap.set(layers, { xPercent: fromX, autoAlpha: 1 });
    };

    const clearLayers = () => {
      if (!layers.length) return;
      gsap.set(layers, { autoAlpha: 0, clearProps: "xPercent" });
    };

    if (collapsed) {
      // EXPAND
      const startW = aside.getBoundingClientRect().width;
      gsap.set(aside, { width: startW });
      setCollapsed(false);

      requestAnimationFrame(() => {
        // Sidebar is on the LEFT, so we sweep LEFT -> RIGHT
        primeLayers(-110);
        if (animateTargets.length) {
          gsap.set(animateTargets, { yPercent: 140, rotate: 10, autoAlpha: 0 });
        }

        if (iconEl) {
          gsap.to(iconEl, { rotate: 0, duration: 0.35, ease: "power3.inOut", overwrite: "auto" });
        }

        const tl = gsap.timeline({
          onComplete: () => {
            gsap.set(aside, { clearProps: "width" });
            clearLayers();
            setIsAnimating(false);
          },
        });

        if (layers.length) {
          // Layer wipe in
          tl.to(layers, { xPercent: 0, duration: 0.5, ease: "power4.out", stagger: 0.07 }, 0);
        }

        // Panel expands under the wipe
        tl.to(aside, { width: wExpanded, duration: 0.65, ease: "power4.out" }, 0.1);

        if (animateTargets.length) {
          tl.to(
            animateTargets,
            {
              yPercent: 0,
              rotate: 0,
              autoAlpha: 1,
              duration: 0.9,
              ease: "power4.out",
              stagger: { each: 0.06, from: "start" },
            },
            0.28
          );
        }

        if (layers.length) {
          // Layer wipe out
          tl.to(layers, { xPercent: 110, autoAlpha: 0, duration: 0.38, ease: "power3.in", stagger: 0.06 }, 0.5);
        }
      });

      return;
    }

    // COLLAPSE
    const startW = aside.getBoundingClientRect().width;
    gsap.set(aside, { width: startW });
    // Sidebar is on the LEFT, so we sweep LEFT -> RIGHT
    primeLayers(-110);

    if (iconEl) {
      gsap.to(iconEl, { rotate: 225, duration: 0.8, ease: "power4.out", overwrite: "auto" });
    }

    const tl = gsap.timeline({
      onComplete: () => {
        setCollapsed(true);
        gsap.set(aside, { clearProps: "width" });
        clearLayers();
        setIsAnimating(false);
      },
    });

    // Wipe in (covers labels), then shrink, then wipe out.
    if (layers.length) {
      tl.to(layers, { xPercent: 0, duration: 0.45, ease: "power4.out", stagger: 0.07 }, 0);
    }

    if (animateTargets.length) {
      tl.to(
        animateTargets,
        {
          yPercent: 140,
          rotate: 10,
          autoAlpha: 0,
          duration: 0.25,
          ease: "power3.in",
          stagger: { each: 0.04, from: "end" },
        },
        0.12
      );
    }

    tl.to(aside, { width: wCollapsed, duration: 0.38, ease: "power3.in" }, 0.2);

    if (layers.length) {
      tl.to(layers, { xPercent: 110, autoAlpha: 0, duration: 0.35, ease: "power3.in", stagger: 0.06 }, 0.32);
    }
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
        ref={asideRef}
        className={cn(
          "relative overflow-hidden border-r border-border flex flex-col transition-all duration-300 bg-card/50 backdrop-blur-xl",
          // Positioning: drawer on mobile, in-flow on desktop
          "fixed top-0 left-0 bottom-0 z-50 md:relative md:z-auto",
          // Height
          "h-screen",
          // Display: toggle on mobile, always visible on desktop
          mobileOpen ? "flex" : "hidden",
          "md:flex",
          // Width: always full on mobile, collapsible on desktop
          "w-64",
          collapsed ? "md:w-16" : "md:w-64"
        )}
      >
        {/* GSAP sweep layers */}
        <div ref={preLayersRef} className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
          {/* Hidden by default (prevents the constant overlay/film look) */}
          <div
            className="ds-prelayer absolute inset-0 opacity-0"
            style={{ background: "#ffffff" }}
          />
          <div
            className="ds-prelayer absolute inset-0 opacity-0"
            style={{ background: "#000000" }}
          />
          <div
            className="ds-prelayer absolute inset-0 opacity-0"
            style={{ background: "#ffffff" }}
          />
        </div>

        <div className="relative z-10 flex h-full flex-col">
          {/* Logo */}
          <div className="p-4 flex items-center justify-between border-b border-border shrink-0">
            <div
              className={cn(
                "flex items-center overflow-hidden cursor-pointer",
                collapsed ? "gap-0" : "gap-2"
              )}
              role="button"
              tabIndex={0}
              onClick={goHome}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  goHome();
                }
              }}
              aria-label="Go to landing page"
            >
              <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                <Mic className="w-4 h-4" />
              </div>
              <span
                className={cn(
                  "ds-logoText font-display font-bold text-lg text-foreground whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-300",
                  collapsed ? "max-w-0 opacity-0" : "max-w-[10rem] opacity-100"
                )}
                aria-hidden={collapsed}
              >
                NoteFlow
              </span>
            </div>

            {/* Desktop collapse button - hidden on mobile */}
            <Button
              variant="ghost"
              size="icon"
              disabled={isAnimating}
              className={cn(
                "hidden md:flex h-8 w-8 text-muted-foreground hover:text-foreground shrink-0",
                collapsed && "ml-auto",
                isAnimating && "opacity-60"
              )}
              onClick={toggleCollapsed}
            >
              <span ref={toggleIconRef} className="inline-flex will-change-transform">
                {collapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </span>
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
                  "flex items-center px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200 overflow-hidden",
                  collapsed ? "justify-center" : "gap-3"
                )}
                activeClassName="bg-primary/10 text-primary font-medium"
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span
                  className={cn(
                    "ds-label truncate overflow-hidden transition-[max-width,opacity] duration-300",
                    collapsed ? "max-w-0 opacity-0" : "max-w-[14rem] opacity-100"
                  )}
                  aria-hidden={collapsed}
                >
                  {item.title}
                </span>
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
                  "flex items-center px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200 overflow-hidden",
                  collapsed ? "justify-center" : "gap-3"
                )}
                activeClassName="bg-primary/10 text-primary font-medium"
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span
                  className={cn(
                    "ds-label truncate overflow-hidden transition-[max-width,opacity] duration-300",
                    collapsed ? "max-w-0 opacity-0" : "max-w-[14rem] opacity-100"
                  )}
                  aria-hidden={collapsed}
                >
                  {item.title}
                </span>
              </NavLink>
            ))}

            <button
              onClick={() => {
                handleLogout();
                closeMobileMenu();
              }}
              className={cn(
                "w-full flex items-center px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors overflow-hidden",
                collapsed ? "justify-center" : "gap-3"
              )}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span
                className={cn(
                  "ds-label truncate overflow-hidden transition-[max-width,opacity] duration-300",
                  collapsed ? "max-w-0 opacity-0" : "max-w-[14rem] opacity-100"
                )}
                aria-hidden={collapsed}
              >
                Log out
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;
