import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import { motion, AnimatePresence } from "framer-motion";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import NoteCard from "../components/dashboard/NoteCard";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import {
  Plus,
  Grid3X3,
  List,
  Star,
  MoreVertical,
  Pencil,
  Trash2,
  CheckSquare,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/use-toast";
import { cn } from "../lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Note {
  id: string;
  title: string;
  preview: string;
  created_at: number;
  google_doc_url?: string;
  is_favorite?: boolean;
}

// ✅ Helper function to get auth headers with proper typing
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('auth_token');
  if (!token) return {};
  return { 'Authorization': `Bearer ${token}` };
};

const AllNotes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const fetchNotes = async () => {
    try {
      const response = await fetch(`${API_URL}/notes`, {
        credentials: 'include',
        headers: getAuthHeaders()
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

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedNotes(new Set());
  };

  const toggleNoteSelection = (noteId: string) => {
    const newSelected = new Set(selectedNotes);
    if (newSelected.has(noteId)) {
      newSelected.delete(noteId);
    } else {
      newSelected.add(noteId);
    }
    setSelectedNotes(newSelected);
  };

  const selectAllNotes = () => {
    const allNoteIds = new Set(filteredNotes.map(note => note.id));
    setSelectedNotes(allNoteIds);
  };

  const deselectAllNotes = () => {
    setSelectedNotes(new Set());
  };

  const bulkDeleteNotes = async () => {
    try {
      const deletePromises = Array.from(selectedNotes).map(noteId =>
        fetch(`${API_URL}/notes/${noteId}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: getAuthHeaders()
        })
      );

      await Promise.all(deletePromises);

      toast({
        title: "Notes deleted",
        description: `Successfully deleted ${selectedNotes.size} note(s).`
      });

      setSelectedNotes(new Set());
      setSelectionMode(false);
      fetchNotes();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete some notes",
        variant: "destructive"
      });
    }
    setShowDeleteDialog(false);
  };

  const handleToggleFavorite = async (noteId: string) => {
    try {
      await fetch(`${API_URL}/notes/${noteId}/favorite`, {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders()
      });
      fetchNotes();
    } catch (error) {
      console.error("Failed to toggle favorite", error);
    }
  };

  const handleRename = async (noteId: string, newTitle: string) => {
    try {
      const response = await fetch(`${API_URL}/notes/${noteId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
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
      const response = await fetch(`${API_URL}/notes/${noteId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getAuthHeaders()
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
    if (selectionMode) {
      toggleNoteSelection(note.id);
    } else if (note.google_doc_url) {
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
          showSearch={true}
        />
        
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="space-y-6">

            <AnimatePresence>
              {selectionMode && selectedNotes.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="sticky top-0 z-40 w-full flex justify-center py-3 bg-background/95 backdrop-blur-sm border-b border-border mb-4"
                >
                  <div className="bg-card text-foreground px-4 md:px-6 py-2.5 rounded-full shadow-xl border-2 border-primary/20 flex items-center gap-2 md:gap-4">
                    <span className="font-medium text-sm md:text-base">
                      {selectedNotes.size} selected
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={deselectAllNotes}
                        className="h-8 text-xs md:text-sm"
                      >
                        Deselect All
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setShowDeleteDialog(true)}
                        className="h-8 gap-1 md:gap-2 text-xs md:text-sm"
                      >
                        <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">Delete Selected</span>
                        <span className="sm:hidden">Delete</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={toggleSelectionMode}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
              <div className="flex items-center gap-2">
                {selectionMode ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllNotes}
                      className="gap-2"
                    >
                      <CheckSquare className="w-4 h-4" />
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleSelectionMode}
                      className="gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectionMode}
                    className="gap-2"
                  >
                    <CheckSquare className="w-4 h-4" />
                    Select
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-secondary/50 p-1 rounded-lg border border-border">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                      "h-8 w-8 rounded-md",
                      viewMode === 'grid' ? "bg-background shadow-sm" : "text-muted-foreground"
                    )}
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                      "h-8 w-8 rounded-md",
                      viewMode === 'list' ? "bg-background shadow-sm" : "text-muted-foreground"
                    )}
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
                <Button className="gap-2 rounded-full" onClick={() => navigate('/dashboard/record')}>
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">New Note</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-10">Loading notes...</div>
            ) : filteredNotes.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
                <p className="mb-2">{searchQuery ? "No notes match your search." : "No notes found."}</p>
                {!searchQuery && (
                  <Button variant="link" onClick={() => navigate('/dashboard/record')}>
                    Create your first note
                  </Button>
                )}
              </div>
            ) : (
              <>
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
                    {filteredNotes.map((note) => (
                      <div key={note.id} className="relative group">
                        {selectionMode && (
                          <div className="absolute top-3 left-3 z-10">
                            <Checkbox
                              checked={selectedNotes.has(note.id)}
                              onCheckedChange={() => toggleNoteSelection(note.id)}
                              className="w-5 h-5 bg-background border-2 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary shadow-md"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        )}
                        <NoteCard
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
                      </div>
                    ))}
                  </div>
                )}

                {viewMode === 'list' && (
                  <div className="space-y-2">
                    {filteredNotes.map((note) => (
                      <div
                        key={note.id}
                        onClick={() => handleNoteClick(note)}
                        className={cn(
                          "flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-card rounded-xl border transition-all cursor-pointer group",
                          selectedNotes.has(note.id)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:shadow-md hover:border-primary/20"
                        )}
                      >
                        {selectionMode && (
                          <Checkbox
                            checked={selectedNotes.has(note.id)}
                            onCheckedChange={() => toggleNoteSelection(note.id)}
                            className="w-5 h-5 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}

                        {!selectionMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(note.id);
                            }}
                            className="shrink-0"
                          >
                            <Star
                              className={cn(
                                "w-4 h-4 md:w-5 md:h-5 transition-all",
                                note.is_favorite 
                                  ? "fill-yellow-400 text-yellow-400" 
                                  : "text-muted-foreground hover:text-yellow-400"
                              )}
                            />
                          </button>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm md:text-base text-foreground truncate group-hover:text-primary transition-colors">
                            {note.title}
                          </h3>
                          <p className="text-xs md:text-sm text-muted-foreground truncate">
                            {note.preview}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                          <span className="hidden sm:inline">{new Date(note.created_at * 1000).toLocaleDateString()}</span>
                        </div>
                        
                        {!selectionMode && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                const newTitle = prompt('Enter new title:', note.title);
                                if (newTitle) handleRename(note.id, newTitle);
                              }}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Are you sure you want to delete this note?')) {
                                    handleDelete(note.id);
                                  }
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedNotes.size} note(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected notes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={bulkDeleteNotes} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AllNotes;