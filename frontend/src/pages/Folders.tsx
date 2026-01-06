import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { FolderOpen, Search, Plus, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "../hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
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


interface Folder {
  id: string;
  name: string;
  note_ids: string[];
}

interface Note {
  id: string;
  title: string;
}

const Folders = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddNotesDialog, setShowAddNotesDialog] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [renamingFolder, setRenamingFolder] = useState<Folder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);

  const fetchData = async () => {
    try {
      const [foldersRes, notesRes] = await Promise.all([
        fetch('http://localhost:5000/folders', { credentials: 'include' }),
        fetch('http://localhost:5000/notes', { credentials: 'include' })
      ]);

      if (foldersRes.status === 401 || notesRes.status === 401) {
        navigate('/login');
        return;
      }

      const foldersData = await foldersRes.json();
      const notesData = await notesRes.json();

      if (foldersData.success) {
        setFolders(foldersData.folders);
      }
      if (notesData.success) {
        setAllNotes(notesData.notes);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await fetch('http://localhost:5000/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newFolderName })
      });

      if (response.ok) {
        toast({ title: "Folder created", description: `"${newFolderName}" has been created.` });
        setNewFolderName("");
        setShowCreateDialog(false);
        fetchData();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create folder", variant: "destructive" });
    }
  };

  const handleRenameFolder = async () => {
    if (!renamingFolder || !newFolderName.trim()) return;

    try {
      const response = await fetch(`http://localhost:5000/folders/${renamingFolder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newFolderName })
      });

      if (response.ok) {
        toast({ title: "Folder renamed", description: `Renamed to "${newFolderName}".` });
        setRenamingFolder(null);
        setNewFolderName("");
        fetchData();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to rename folder", variant: "destructive" });
    }
  };

  const handleDeleteFolder = async () => {
    if (!deletingFolder) return;

    try {
      const response = await fetch(`http://localhost:5000/folders/${deletingFolder.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast({ title: "Folder deleted", description: "Folder has been removed." });
        setDeletingFolder(null);
        fetchData();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete folder", variant: "destructive" });
    }
  };

  const handleAddNotesToFolder = async () => {
    if (!selectedFolder || selectedNoteIds.length === 0) return;

    try {
      const response = await fetch(`http://localhost:5000/folders/${selectedFolder.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ note_ids: selectedNoteIds })
      });

      if (response.ok) {
        toast({ 
          title: "Notes added", 
          description: `${selectedNoteIds.length} note(s) added to "${selectedFolder.name}".` 
        });
        setShowAddNotesDialog(false);
        setSelectedNoteIds([]);
        setSelectedFolder(null);
        fetchData();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to add notes to folder", variant: "destructive" });
    }
  };

  const openAddNotesDialog = (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent folder click
    setSelectedFolder(folder);
    setSelectedNoteIds([]);
    setShowAddNotesDialog(true);
  };

  const handleFolderClick = (folder: Folder) => {
    // Navigate to folder detail page with folder data
    navigate(`/dashboard/folders/${folder.id}`, { state: { folder } });
  };

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNoteIds(prev => 
      prev.includes(noteId) 
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    );
  };

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableNotes = allNotes.filter(note => 
    !selectedFolder?.note_ids.includes(note.id)
  );

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader 
          title="Subjects" 
          subtitle="Organize your notes into subject collections"
          showSearch={false}
        />

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search subjects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card border-border"
                />
              </div>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Folder
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-10 text-muted-foreground">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Loading folders...</p>
              </div>
            ) : filteredFolders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
                <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-lg font-medium mb-2">
                  {searchQuery ? "No folders found" : "No folders yet"}
                </p>
                <p className="text-sm mb-4">
                  {searchQuery ? "Try a different search term" : "Create a folder to organize your notes"}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Folder
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFolders.map((folder) => (
                  <motion.div
                    key={folder.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleFolderClick(folder)}
                    className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FolderOpen className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{folder.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {folder.note_ids.length} note{folder.note_ids.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setRenamingFolder(folder);
                            setNewFolderName(folder.name);
                          }}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingFolder(folder);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={(e) => openAddNotesDialog(folder, e)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Notes
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Dialogs remain the same */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>Enter a name for your new folder</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateFolder}>Create</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renamingFolder} onOpenChange={() => setRenamingFolder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
            <DialogDescription>Enter a new name for this folder</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleRenameFolder()}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRenamingFolder(null)}>Cancel</Button>
            <Button onClick={handleRenameFolder}>Rename</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddNotesDialog} onOpenChange={setShowAddNotesDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Add Notes to "{selectedFolder?.name}"</DialogTitle>
            <DialogDescription>Select notes to add to this folder</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 overflow-y-auto max-h-96">
            {availableNotes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                All notes are already in this folder
              </p>
            ) : (
              availableNotes.map(note => (
                <div
                  key={note.id}
                  onClick={() => toggleNoteSelection(note.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedNoteIds.includes(note.id)
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedNoteIds.includes(note.id)
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    }`}>
                      {selectedNoteIds.includes(note.id) && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium">{note.title}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {selectedNoteIds.length} note{selectedNoteIds.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAddNotesDialog(false)}>Cancel</Button>
              <Button 
                onClick={handleAddNotesToFolder}
                disabled={selectedNoteIds.length === 0}
              >
                Add {selectedNoteIds.length > 0 && `(${selectedNoteIds.length})`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingFolder} onOpenChange={() => setDeletingFolder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingFolder?.name}"? Notes will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFolder} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Folders;
