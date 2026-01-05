import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import NoteCard from "@/components/dashboard/NoteCard";
import { Button } from "@/components/ui/button";
import { Plus, Grid3X3, List } from "lucide-react";
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

const AllNotes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchNotes = async () => {
    try {
      const response = await fetch('http://localhost:5000/notes', {
        credentials: 'include'
      });
      if (response.status === 401) {
        navigate('/login');
        return;
      }
      const data = await response.json();
      if (data.success) {
        setNotes(data.notes);
        setFilteredNotes(data.notes);
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredNotes(notes);
    } else {
      const filtered = notes.filter(note =>
        note.title.toLowerCase().includes(query.toLowerCase()) ||
        note.preview.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredNotes(filtered);
    }
  };

  const handleToggleFavorite = async (noteId: string) => {
    try {
      await fetch(`http://localhost:5000/notes/${noteId}/favorite`, {
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
      const response = await fetch(`http://localhost:5000/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: newTitle })
      });
      
      if (response.ok) {
        toast({ title: "Note renamed", description: "Your note has been renamed successfully." });
        fetchNotes();
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
        fetchNotes();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete note", variant: "destructive" });
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
          title="All Notes" 
          subtitle="Browse and manage all your lecture notes"
          onSearch={handleSearch}
        />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            <div className="flex justify-end items-center gap-2">
              <div className="flex bg-secondary/50 p-1 rounded-lg border border-border">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md bg-background shadow-sm">
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md text-muted-foreground">
                  <List className="w-4 h-4" />
                </Button>
              </div>
              <Button className="gap-2 rounded-full" onClick={() => navigate('/dashboard/record')}>
                <Plus className="w-4 h-4" />
                New Note
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-10">Loading notes...</div>
            ) : filteredNotes.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
                <p className="mb-2">{searchQuery ? "No notes match your search." : "No notes found."}</p>
                {!searchQuery && (
                  <Button variant="link" onClick={() => navigate('/dashboard/record')}>Create your first note</Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {filteredNotes.map((note) => (
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

export default AllNotes;
