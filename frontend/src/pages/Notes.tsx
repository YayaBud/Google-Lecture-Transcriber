import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import NoteCard from "@/components/dashboard/NoteCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Grid3X3, List } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Note {
  id: string;
  title: string;
  preview: string;
  created_at: number;
  google_doc_url?: string;
  is_favorite?: boolean;
}

const Notes = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

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
          await fetch(`http://localhost:5000/notes/${noteId}/favorite`, {
              method: 'POST',
              credentials: 'include'
          });
          // Refresh notes to get updated state
          fetchNotes();
      } catch (error) {
          console.error("Failed to toggle favorite", error);
      }
  };

  const filteredNotes = notes.filter(note => {
      if (activeTab === 'favorites') return note.is_favorite;
      return true;
  });

  return (
    // FIX: Removed "dark" and hardcoded bg colors. Uses global theme bg.
    <div className="flex h-screen bg-background transition-colors duration-500">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          title="All Notes" 
          subtitle="Browse and manage all your lecture notes"
        />
        
        <main className="flex-1 overflow-auto p-6">
          <Tabs defaultValue="all" className="space-y-6" onValueChange={setActiveTab}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <TabsList className="bg-secondary/50 p-1 rounded-xl">
                <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">All Notes</TabsTrigger>
                <TabsTrigger value="favorites" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Favorites</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-2">
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
            </div>

            <TabsContent value="all" className="mt-0">
              {isLoading ? (
                <div>Loading notes...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {filteredNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      title={note.title}
                      subject="General" 
                      date={new Date(note.created_at * 1000).toLocaleDateString()}
                      duration="--" 
                      preview={note.preview}
                      isFavorite={note.is_favorite || false}
                      onToggleFavorite={() => handleToggleFavorite(note.id)}
                    />
                  ))}
                  {filteredNotes.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      No notes found.
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="favorites" className="mt-0">
               {isLoading ? (
                <div>Loading notes...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {filteredNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      title={note.title}
                      subject="General" 
                      date={new Date(note.created_at * 1000).toLocaleDateString()}
                      duration="--" 
                      preview={note.preview}
                      isFavorite={note.is_favorite || false}
                      onToggleFavorite={() => handleToggleFavorite(note.id)}
                    />
                  ))}
                  {filteredNotes.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      No favorite notes found.
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Notes;
