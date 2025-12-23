import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Folder, Plus, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Note {
  id: string;
  title: string;
}

interface Folder {
  id: string;
  name: string;
  note_ids: string[];
  created_at: number;
}

const Folders = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

      if (foldersData.success) setFolders(foldersData.folders);
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

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNotes(prev => 
      prev.includes(noteId) 
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    );
  };

  return (
    <div className="flex h-screen bg-background transition-colors duration-500">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          title="Folders" 
          subtitle="Organize your notes into collections"
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
                    className="p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-all cursor-pointer group"
                  >
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
    </div>
  );
};

export default Folders;
