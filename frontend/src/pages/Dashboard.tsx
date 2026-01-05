import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import NoteCard from "@/components/dashboard/NoteCard";
import { Button } from "@/components/ui/button";
import { FileText, Clock, Star, FolderOpen, Mic } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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
      staggerChildren: 0.1
    }
  }
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [notesRes, foldersRes] = await Promise.all([
        fetch('http://localhost:5000/notes', { credentials: 'include' }),
        fetch('http://localhost:5000/folders', { credentials: 'include' })
      ]);

      if (notesRes.status === 401 || foldersRes.status === 401) {
        navigate('/login');
        return;
      }

      const notesData = await notesRes.json();
      const foldersData = await foldersRes.json();

      if (notesData.success) setNotes(notesData.notes);
      if (foldersData.success) setFolders(foldersData.folders);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  const handleToggleFavorite = async (noteId: string) => {
    try {
      await fetch(`http://localhost:5000/notes/${noteId}/favorite`, {
        method: 'POST',
        credentials: 'include'
      });
      fetchData();
    } catch (error) {
      console.error("Failed to toggle favorite", error);
    }
  };

  const handleRename = async (noteId: string, newTitle: string) => {
    try {
      const response = await fetch(`http://localhost:5000/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: newTitle })
      });
      
      if (response.ok) {
        toast({ title: "Note renamed", description: "Your note has been renamed successfully." });
        fetchData();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to rename note", variant: "destructive" });
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/notes/${noteId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        toast({ title: "Note deleted", description: "Your note has been deleted." });
        fetchData();
      }
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

  const favoriteCount = notes.filter(n => n.is_favorite).length;

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader title="Dashboard" subtitle="Welcome back, here's your overview." />
        
        <main className="flex-1 p-8 overflow-y-auto">
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-6xl mx-auto space-y-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground mt-1">Welcome back, here's your overview.</p>
              </div>
              <Button onClick={() => navigate('/dashboard/record')} className="gap-2 rounded-xl shadow-lg shadow-primary/20">
                <Mic className="w-4 h-4" />
                New Recording
              </Button>
            </div>

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

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Recent Notes</h2>
                <Button 
                  variant="ghost" 
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => navigate('/dashboard/notes')}
                >
                  View All
                </Button>
              </div>

              {isLoading ? (
                <div className="text-center py-10 text-muted-foreground">Loading notes...</div>
              ) : notes.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground bg-card rounded-xl border border-border">
                  <p>No notes yet. Start recording to create one!</p>
                  <Button variant="link" onClick={() => navigate('/dashboard/record')}>Go to Recorder</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {notes.slice(0, 4).map((note) => (
                    <motion.div key={note.id} variants={item}>
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
                </div>
              )}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
