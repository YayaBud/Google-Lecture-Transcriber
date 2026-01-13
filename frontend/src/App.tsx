import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import AllNotes from "./pages/AllNotes";
import FavoriteNotes from "./pages/FavoriteNotes";
import Record from "./pages/Record";
import FolderDetail from "./pages/FolderDetail";
import Folders from "./pages/Folders";
import Help from "./pages/Help";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import { useEffect } from "react";
import NotesFlashcards from "./pages/NotesFlashcards";
import Chatbot from "./pages/Chatbot";

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
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/notes" element={<AllNotes />} />
            <Route path="/dashboard/flashcards" element={<NotesFlashcards />} />
            <Route path="/dashboard/record" element={<Record />} />
            <Route path="/dashboard/favorites" element={<FavoriteNotes />} />
            <Route path="/dashboard/folders/:folderId" element={<FolderDetail />} />
            <Route path="/dashboard/folders" element={<Folders />} />
            <Route path="/dashboard/settings" element={<Settings />} />
            <Route path="/dashboard/help" element={<Help />} />
            <Route path="/dashboard/chatbot" element={<Chatbot />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
