import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import NoteCard from "../components/dashboard/NoteCard";
import { Button } from "../components/ui/button";
import { ArrowLeft, FolderOpen } from "lucide-react";
import { motion } from "framer-motion";
import { api } from '../lib/api';

interface Note {
  id: string;
  title: string;
  preview: string;
  created_at: number;
  updated_at: number;
  is_favorite?: boolean;
  google_doc_url?: string;
}

interface Folder {
  id: string;
  name: string;
  note_ids: string[];
  created_at?: number;
}

const FolderDetail = () => {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [folder, setFolder] = useState<Folder | null>(location.state?.folder || null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFolderAndNotes = async () => {
      try {
        const [notesData, foldersData] = await Promise.all([
          api.getNotes(),
          api.getFolders()
        ]);

        // If we don't have folder data from navigation state, fetch it
        if (!folder && foldersData.success) {
          const currentFolder = foldersData.folders.find((f: Folder) => f.id === folderId);
          setFolder(currentFolder || null);
        }

        // Filter notes that are in this folder
        if (notesData.success && (folder || foldersData.success)) {
          const currentFolder = folder || foldersData.folders.find((f: Folder) => f.id === folderId);
          if (currentFolder) {
            const folderNotes = notesData.notes.filter((note: Note) => 
              currentFolder.note_ids.includes(note.id)
            );
            setNotes(folderNotes);
          }
        }
      } catch (error) {
        console.error("Failed to fetch folder details", error);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFolderAndNotes();
  }, [folderId, folder, navigate]);

  const handleToggleFavorite = async (noteId: string) => {
    try {
      const data = await api.toggleFavorite(noteId);
      setNotes(prev => prev.map(note => 
        note.id === noteId ? { ...note, is_favorite: data.is_favorite } : note
      ));
    } catch (error) {
      console.error("Failed to toggle favorite", error);
    }
  };

  const handleNoteClick = (note: Note) => {
    if (note.google_doc_url) {
      // Open Google Doc in new tab
      window.open(note.google_doc_url, '_blank');
    } else {
      // Show alert if no Google Doc exists
      alert('This note has not been pushed to Google Drive yet.');
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

  if (!folder) {
    return (
      <div className="min-h-screen bg-background flex">
        <DashboardSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Folder not found</h2>
            <Button onClick={() => navigate('/dashboard/folders')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Subjects
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader 
          title={folder.name} 
          subtitle={`${notes.length} note${notes.length !== 1 ? 's' : ''} in this folder`}
          showSearch={false}
        />

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Back Button */}
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard/folders')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Subjects
            </Button>

            {/* Folder Info Card */}
            <div className="bg-card border border-border rounded-xl p-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FolderOpen className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{folder.name}</h2>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
                    {folder.created_at && (
                      <>
                        <span>•</span>
                        <span>Created {new Date(folder.created_at * 1000).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Grid */}
            {notes.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-lg font-medium mb-2">No notes in this folder yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Add notes from the Subjects page
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {notes.map((note, index) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <NoteCard
                      id={note.id}
                      title={note.title}
                      subject={folder.name}
                      preview={note.preview}
                      date={new Date(note.created_at * 1000).toLocaleDateString()}
                      duration={new Date(note.created_at * 1000).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                      isFavorite={note.is_favorite || false}
                      onClick={() => handleNoteClick(note)}
                      onToggleFavorite={() => handleToggleFavorite(note.id)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default FolderDetail;
