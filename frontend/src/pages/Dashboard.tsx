import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import StatsCard from "../components/dashboard/StatsCard";
import NoteCard from "../components/dashboard/NoteCard";
import { Button } from "../components/ui/button";
import { motion, Variants } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/use-toast";
import { FileText, Clock, Star, FolderOpen, Mic, Search } from "lucide-react";
import { Input } from "../components/ui/input";
import { api } from '../lib/api';
import { DebugAuth } from '../components/DebugAuth';

interface Note {
  id: string;
  title: string;
  preview: string;
  created_at: number;
  google_doc_url?: string;
  is_favorite?: boolean;
}

interface Folder {
  id: string;
  name: string;
  note_ids: string[];
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      const [notesData, foldersData] = await Promise.all([
        api.getNotes(),
        api.getFolders()
      ]);

      if (notesData.success) {
        setNotes(notesData.notes);
      }
      if (foldersData.success) {
        setFolders(foldersData.folders);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  const handleToggleFavorite = async (noteId: string) => {
    try {
      await api.toggleFavorite(noteId);
      fetchData();
    } catch (error) {
      console.error("Failed to toggle favorite", error);
    }
  };

  const handleRename = async (noteId: string, newTitle: string) => {
    try {
      await api.updateNote(noteId, newTitle);
      toast({ title: "Note renamed", description: "Your note has been renamed successfully." });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to rename note", variant: "destructive" });
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      await api.deleteNote(noteId);
      toast({ title: "Note deleted", description: "Your note has been deleted." });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete note", variant: "destructive" });
    }
  };

  const handleNoteClick = (note: Note) => {
    if (note.google_doc_url) {
      window.open(note.google_doc_url, '_blank');
    } else {
      console.log('Note has no Google Doc URL yet');
    }
  };

  // Filter notes based on search query
  const filteredNotes = notes.filter(note => {
    const query = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(query) ||
      note.preview.toLowerCase().includes(query)
    );
  });

  const favoriteCount = notes.filter(n => n.is_favorite).length;

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader 
          title="Dashboard" 
          subtitle="Welcome back, here's your overview."
          showSearch={false}
        />
        
        {/* Search bar below header */}
        <div className="px-8 pt-6 pb-2">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>
        </div>

        <main className="flex-1 p-8 overflow-y-auto relative">
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-6xl mx-auto space-y-8"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div variants={item}>
                <StatsCard 
                  title="Total Notes" 
                  value={notes.length.toString()} 
                  icon={FileText} 
                  trend="All time"
                  onClick={() => navigate('/dashboard/notes')}
                />
              </motion.div>
              <motion.div variants={item}>
                <StatsCard 
                  title="Hours Recorded" 
                  value="--" 
                  icon={Clock} 
                  trend="Coming soon" 
                />
              </motion.div>
              <motion.div variants={item}>
                <StatsCard 
                  title="Favorites" 
                  value={favoriteCount.toString()} 
                  icon={Star} 
                  trend="Starred notes"
                  onClick={() => navigate('/dashboard/favorites')}
                />
              </motion.div>
              <motion.div variants={item}>
                <StatsCard 
                  title="Subjects" 
                  value={folders.length.toString()} 
                  icon={FolderOpen} 
                  trend={folders.length > 0 ? folders.map(f => f.name).join(', ') : "No subjects"}
                  onClick={() => navigate('/dashboard/folders')}
                />
              </motion.div>
            </div>

            {/* Recent Notes Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">
                  {searchQuery ? "Search Results" : "Recent Notes"}
                </h2>
                {!searchQuery && (
                  <Button 
                    variant="ghost" 
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => navigate('/dashboard/notes')}
                  >
                    View All
                  </Button>
                )}
              </div>

              {isLoading ? (
                <div className="text-center py-10 text-muted-foreground">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Loading notes...</p>
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  {searchQuery ? (
                    <>
                      <p className="text-lg font-medium mb-2">No results found</p>
                      <p className="text-sm mb-4">Try a different search term</p>
                      <Button onClick={() => setSearchQuery("")} variant="outline">
                        Clear Search
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-medium mb-2">No notes yet</p>
                      <p className="text-sm mb-4">Start recording to create your first note!</p>
                      <Button onClick={() => navigate('/dashboard/record')} className="gap-2">
                        <Mic className="w-4 h-4" />
                        Start Recording
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {/* Grid with animation container */}
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    variants={container}
                    initial="hidden"
                    animate="show"
                    key={searchQuery} // Re-trigger animation on search
                  >
                    {(searchQuery ? filteredNotes : filteredNotes.slice(0, 4)).map((note) => (
                      <motion.div 
                        key={note.id} 
                        variants={item}
                      >
                        <NoteCard 
                          id={note.id}
                          title={note.title}
                          subject="General"
                          date={new Date(note.created_at * 1000).toLocaleDateString()}
                          duration="N/A"
                          preview={note.preview}
                          isFavorite={note.is_favorite || false}
                          onToggleFavorite={() => handleToggleFavorite(note.id)}
                          onClick={() => handleNoteClick(note)}
                          onRename={(newTitle) => handleRename(note.id, newTitle)}
                          onDelete={() => handleDelete(note.id)}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>

          {/* Floating Record Button */}
          <Button
            onClick={() => navigate('/dashboard/record')}
            className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50 md:hidden"
            size="icon"
          >
            <Mic className="w-6 h-6" />
          </Button>
        </main>

        {/* 🐛 DEBUG COMPONENT - Shows auth info at bottom of screen */}
        <DebugAuth />
      </div>
    </div>
  );
};

export default Dashboard;
