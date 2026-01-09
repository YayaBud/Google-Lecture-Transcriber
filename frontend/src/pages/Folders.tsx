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
import { api } from '../lib/api';

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
      const [foldersData, notesData] = await Promise.all([
        api.getFolders(),
        api.getNotes()
      ]);

      if (foldersData.success) {
        setFolders(foldersData.folders);
      }
      if (notesData.success) {
        setAllNotes(notesData.notes);
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

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await api.createFolder(newFolderName);
      if (response) {
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
      const response = await api.renameFolder(renamingFolder.id, newFolderName);
      if (response) {
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
      const response = await api.deleteFolder(deletingFolder.id);
      if (response) {
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
      const response = await api.addNotesToFolder(selectedFolder.id, selectedNoteIds);
      if (response) {
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
    e.stopPropagation();
    setSelectedFolder(folder);
    setSelectedNoteIds([]);
    setShowAddNotesDialog(true);
  };

  const handleFolderClick = (folder: Folder) => {
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

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader 
          title="Subjects" 
          subtitle="Organize your notes into folders"
          showSearch={false}
        />

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Search and Create Button */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search folders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card border-border"
                />
              </div>
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                New Folder
              </Button>
            </div>

            {/* Folders Grid */}
            {isLoading ? (
              <div className="text-center py-10 text-muted-foreground">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Loading folders...</p>
              </div>
            ) : filteredFolders.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                {searchQuery ? (
                  <>
                    <p className="text-lg font-medium mb-2">No folders found</p>
                    <p className="text-sm text-muted-foreground mb-4">Try a different search term</p>
                    <Button onClick={() => setSearchQuery("")} variant="outline">
                      Clear Search
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium mb-2">No folders yet</p>
                    <p className="text-sm text-muted-foreground mb-4">Create your first folder to organize notes</p>
                    <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Create Folder
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFolders.map((folder, index) => (
                  <motion.div
                    key={folder.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer group relative"
                    onClick={() => handleFolderClick(folder)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FolderOpen className="w-6 h-6 text-primary" />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          align="end"
                          className="bg-card border-border shadow-xl"
                        >
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            openAddNotesDialog(folder, e as any);
                          }}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Notes
                          </DropdownMenuItem>
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
                            className="text-red-500 focus:text-red-600 focus:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{folder.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {folder.note_ids.length} note{folder.note_ids.length !== 1 ? 's' : ''}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for your new folder
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowCreateDialog(false);
                setNewFolderName("");
              }}>
                Cancel
              </Button>
              <Button onClick={handleCreateFolder}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Folder Dialog */}
      <Dialog open={!!renamingFolder} onOpenChange={(open) => !open && setRenamingFolder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
            <DialogDescription>
              Enter a new name for this folder
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRenameFolder()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setRenamingFolder(null);
                setNewFolderName("");
              }}>
                Cancel
              </Button>
              <Button onClick={handleRenameFolder}>Rename</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Folder Confirmation - FIXED RED BUTTON */}
      <AlertDialog open={!!deletingFolder} onOpenChange={(open) => !open && setDeletingFolder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingFolder?.name}"? This will not delete the notes inside.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteFolder} 
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Notes Dialog */}
      <Dialog open={showAddNotesDialog} onOpenChange={setShowAddNotesDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Notes to "{selectedFolder?.name}"</DialogTitle>
            <DialogDescription>
              Select notes to add to this folder
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {allNotes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No notes available</p>
            ) : (
              allNotes.map(note => (
                <div
                  key={note.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer"
                  onClick={() => toggleNoteSelection(note.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedNoteIds.includes(note.id)}
                    onChange={() => toggleNoteSelection(note.id)}
                    className="w-4 h-4"
                  />
                  <span className="flex-1">{note.title}</span>
                </div>
              ))
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setShowAddNotesDialog(false);
              setSelectedNoteIds([]);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddNotesToFolder}
              disabled={selectedNoteIds.length === 0}
            >
              Add {selectedNoteIds.length > 0 && `(${selectedNoteIds.length})`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Folders;
