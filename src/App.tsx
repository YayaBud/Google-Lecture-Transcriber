import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Notes from "./pages/Notes";
import Record from "./pages/Record";
import Login from "./pages/Login";   // Import this
import Signup from "./pages/Signup"; // Import this
import NotFound from "./pages/NotFound";
import { useEffect } from "react";

const queryClient = new QueryClient();

const ThemeInitializer = () => {
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeInitializer />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />   {/* Add this */}
          <Route path="/signup" element={<Signup />} /> {/* Add this */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/notes" element={<Notes />} />
          <Route path="/dashboard/record" element={<Record />} />
          <Route path="/dashboard/favorites" element={<Notes />} />
          <Route path="/dashboard/folders" element={<Notes />} />
          <Route path="/dashboard/settings" element={<Dashboard />} />
          <Route path="/dashboard/help" element={<Dashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
