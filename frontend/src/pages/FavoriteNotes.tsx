import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import NoteCard from "../components/dashboard/NoteCard";
import { Button } from "../components/ui/button";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/use-toast";

// ✅ ADD THIS LINE
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Note {
  id: string;
  title: string;
  preview: string;
  created_at: number;
  google_doc_url?: string;
  is_favorite?: boolean;
}

const FavoriteNotes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotes = async () => {
    try {
      // ✅ UPDATED
      const response = await fetch(`${API_URL}/notes`, {
        credentials: 'include'
      });
      if (response.status === 401) {
        navigate('/login');
        return;
      }
      const data = await response.json();
      if (data.success) {
        // Filter only favorite notes
        const favoriteNotes = data.notes.filter((note: Note) => note.is_favorite);
        setNotes(favoriteNotes);
      }
    } catch (error) {
      console.error("Failed to fetch notes", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [navigate]);

  const handleToggleFavorite = async (noteId: string) => {
    try {
      // ✅ UPDATED
      await fetch(`${API_URL}/notes/${noteId}/favorite`, {
        method: 'POST',
        credentials: 'include'
      });
      fetchNotes();
    } catch (error) {
      console.error("Failed to toggle favorite", error);
    }
  };

  const handleRename = async (noteId: string, newTitle: string) => {
    try {
      // ✅ UPDATED
      const response = await fetch(`${API_URL}/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: newTitle })
      });
      
      if (response.ok) {
        toast({ 
          title: "Note renamed", 
          description: "Your note has been renamed successfully." 
        });
        fetchNotes();
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to rename note", 
        variant: "destructive" 
      });
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      // ✅ UPDATED
      const response = await fetch(`${API_URL}/notes/${noteId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        toast({ 
          title: "Note deleted", 
          description: "Your note has been deleted." 
        });
        fetchNotes();
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to delete note", 
        variant: "destructive" 
      });
    }
  };

  const handleNoteClick = (note: Note) => {
    if (note.google_doc_url) {
      window.open(note.google_doc_url, '_blank');
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          title="Favorite Notes" 
          subtitle="Quick access to your starred lecture notes"
        />
        
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-10">Loading favorite notes...</div>
            ) : notes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
                <p className="mb-2">No favorite notes yet.</p>
                <Button variant="link" onClick={() => navigate('/dashboard/notes')}>
                  Browse all notes
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
                {notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    id={note.id}
                    title={note.title}
                    subject="General"
                    date={new Date(note.created_at * 1000).toLocaleDateString()}
                    duration="--"
                    preview={note.preview}
                    isFavorite={note.is_favorite || false}
                    onToggleFavorite={() => handleToggleFavorite(note.id)}
                    onClick={() => handleNoteClick(note)}
                    onRename={(newTitle) => handleRename(note.id, newTitle)}
                    onDelete={() => handleDelete(note.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default FavoriteNotes;
