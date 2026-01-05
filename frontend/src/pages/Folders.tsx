import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Folder, Plus, FileText, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Note {
  id: string;
  title: string;
}

interface FolderType {
  id: string;
  name: string;
  note_ids: string[];
  created_at: number;
}

const Folders = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameFolderId, setRenameFolderId] = useState("");
  const [renameFolderName, setRenameFolderName] = useState("");

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
        // Filter out notes that no longer exist
        const updatedFolders = foldersData.folders.map((folder: FolderType) => ({
          ...folder,
          note_ids: folder.note_ids.filter((noteId: string) => 
            notesData.notes.some((note: Note) => note.id === noteId)
          )
        }));
        setFolders(updatedFolders);
      }
      if (notesData.success) setNotes(notesData.notes);
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
        body: JSON.stringify({
          name: newFolderName,
          note_ids: selectedNotes
        }),
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: "Folder created", description: "Your new folder is ready." });
        setNewFolderName("");
        setSelectedNotes([]);
        setIsDialogOpen(false);
        fetchData();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create folder", variant: "destructive" });
    }
  };

  const handleRenameFolder = async () => {
    if (!renameFolderName.trim()) return;

    try {
      const response = await fetch(`http://localhost:5000/folders/${renameFolderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: renameFolderName }),
        credentials: 'include'
      });

      if (response.ok) {
        toast({ title: "Folder renamed", description: "Your folder has been renamed." });
        setIsRenameOpen(false);
        setRenameFolderId("");
        setRenameFolderName("");
        fetchData();
      } else {
        toast({ title: "Error", description: "Failed to rename folder", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to rename folder", variant: "destructive" });
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Are you sure you want to delete this folder?')) return;

    try {
      const response = await fetch(`http://localhost:5000/folders/${folderId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast({ title: "Folder deleted", description: "Your folder has been deleted." });
        fetchData();
      } else {
        toast({ title: "Error", description: "Failed to delete folder", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete folder", variant: "destructive" });
    }
  };

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNotes(prev => 
      prev.includes(noteId) 
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    );
  };

  const openRenameDialog = (folder: FolderType) => {
    setRenameFolderId(folder.id);
    setRenameFolderName(folder.name);
    setIsRenameOpen(true);
  };

  return (
    <div className="flex h-screen bg-background transition-colors duration-500">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          title="Subjects" 
          subtitle="Organize your notes into subject collections"
        />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-end">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Folder
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Folder Name</label>
                      <Input 
                        placeholder="e.g., Biology 101" 
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Add Notes (Optional)</label>
                      <div className="max-h-[200px] overflow-y-auto border rounded-md p-2 space-y-2">
                        {notes.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-2">No notes available</p>
                        ) : (
                          notes.map(note => (
                            <div key={note.id} className="flex items-center space-x-2">
                              <Checkbox 
                                id={note.id} 
                                checked={selectedNotes.includes(note.id)}
                                onCheckedChange={() => toggleNoteSelection(note.id)}
                              />
                              <label 
                                htmlFor={note.id} 
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {note.title}
                              </label>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateFolder}>Create Folder</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {isLoading ? (
              <div>Loading folders...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {folders.map((folder) => (
                  <div 
                    key={folder.id}
                    className="p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-all group relative"
                  >
                    <div className="absolute top-4 right-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openRenameDialog(folder)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteFolder(folder.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Folder className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{folder.name}</h3>
                        <p className="text-sm text-muted-foreground">{folder.note_ids.length} notes</p>
                      </div>
                    </div>
                    
                    {folder.note_ids.length > 0 && (
                      <div className="space-y-2 mt-4 pt-4 border-t border-border/50">
                        {folder.note_ids.slice(0, 3).map(noteId => {
                          const note = notes.find(n => n.id === noteId);
                          return note ? (
                            <div key={noteId} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <FileText className="w-3 h-3" />
                              <span className="truncate">{note.title}</span>
                            </div>
                          ) : null;
                        })}
                        {folder.note_ids.length > 3 && (
                          <p className="text-xs text-muted-foreground pl-5">
                            +{folder.note_ids.length - 3} more
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {folders.length === 0 && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    No folders created yet.
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Rename Dialog */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={renameFolderName}
              onChange={(e) => setRenameFolderName(e.target.value)}
              placeholder="Enter new folder name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameFolder();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameFolder}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Folders;
