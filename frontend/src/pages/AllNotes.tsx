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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface Note {
  id: string;
  title: string;
  preview: string;
  created_at: number;
  google_doc_url?: string;
  is_favorite?: boolean;
}

/* ✅ FIXED: Properly typed auth headers */
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const AllNotes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const fetchNotes = async () => {
    try {
      const response = await fetch(`${API_URL}/notes`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });

      if (response.status === 401) {
        navigate("/login");
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
      return;
    }

    setFilteredNotes(
      notes.filter(
        (note) =>
          note.title.toLowerCase().includes(query.toLowerCase()) ||
          note.preview.toLowerCase().includes(query.toLowerCase())
      )
    );
  };

  const toggleSelectionMode = () => {
    setSelectionMode((prev) => !prev);
    setSelectedNotes(new Set());
  };

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNotes((prev) => {
      const next = new Set(prev);
      next.has(noteId) ? next.delete(noteId) : next.add(noteId);
      return next;
    });
  };

  const selectAllNotes = () => {
    setSelectedNotes(new Set(filteredNotes.map((n) => n.id)));
  };

  const deselectAllNotes = () => {
    setSelectedNotes(new Set());
  };

  const bulkDeleteNotes = async () => {
    try {
      await Promise.all(
        Array.from(selectedNotes).map((id) =>
          fetch(`${API_URL}/notes/${id}`, {
            method: "DELETE",
            credentials: "include",
            headers: getAuthHeaders(),
          })
        )
      );

      toast({
        title: "Notes deleted",
        description: `Successfully deleted ${selectedNotes.size} note(s).`,
      });

      setSelectedNotes(new Set());
      setSelectionMode(false);
      fetchNotes();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete some notes",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleToggleFavorite = async (noteId: string) => {
    await fetch(`${API_URL}/notes/${noteId}/favorite`, {
      method: "POST",
      credentials: "include",
      headers: getAuthHeaders(),
    });
    fetchNotes();
  };

  const handleRename = async (noteId: string, newTitle: string) => {
    const response = await fetch(`${API_URL}/notes/${noteId}`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ title: newTitle }),
    });

    if (response.ok) {
      toast({ title: "Note renamed" });
      fetchNotes();
    }
  };

  const handleDelete = async (noteId: string) => {
    const response = await fetch(`${API_URL}/notes/${noteId}`, {
      method: "DELETE",
      credentials: "include",
      headers: getAuthHeaders(),
    });

    if (response.ok) {
      toast({ title: "Note deleted" });
      fetchNotes();
    }
  };

  const handleNoteClick = (note: Note) => {
    if (selectionMode) {
      toggleNoteSelection(note.id);
    } else if (note.google_doc_url) {
      window.open(note.google_doc_url, "_blank");
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
          showSearch
        />

        <main className="flex-1 overflow-auto p-4 md:p-6">
          {/* UI unchanged – omitted here for brevity */}
        </main>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedNotes.size} note(s)?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={bulkDeleteNotes}
              className="bg-destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AllNotes;
