import { Star, Clock, Calendar, MoreVertical, Pencil, Trash2, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";


interface NoteCardProps {
  id: string;
  title: string;
  subject: string;
  date: string;
  duration: string;
  preview: string;
  isFavorite: boolean;
  onClick?: () => void;
  onToggleFavorite?: (noteId: string) => Promise<void>;
  onRename?: (newTitle: string) => void;
  onDelete?: () => void;
}


const NoteCard = ({ 
  id,
  title, 
  subject, 
  date, 
  duration, 
  preview, 
  isFavorite: initialFavorite, 
  onClick, 
  onToggleFavorite,
  onRename,
  onDelete 
}: NoteCardProps) => {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(title);
  const [isDownloading, setIsDownloading] = useState(false);


  useEffect(() => {
    setIsFavorite(initialFavorite);
  }, [initialFavorite]);


  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    if (onToggleFavorite) {
      onToggleFavorite(id);
    }
  };


  const handleRename = () => {
    if (onRename && newTitle.trim()) {
      onRename(newTitle.trim());
      setIsRenameOpen(false);
    }
  };


  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && confirm('Are you sure you want to delete this note?')) {
      onDelete();
    }
  };


  const handleDownloadPDF = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloading(true);
    
    try {
      const response = await fetch(`http://localhost:5000/notes/${id}/export-pdf`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        alert('Failed to export PDF: ' + (error.error || 'Unknown error'));
        setIsDownloading(false);
        return;
      }
      
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      if (contentDisposition && contentDisposition.includes('filename=')) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ PDF downloaded:', filename);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error downloading PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };


  return (
    <>
      <div 
        onClick={onClick}
        className="h-full min-h-[240px] p-5 rounded-3xl bg-card border border-border/50 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
      >
        {/* Top gradient line on hover */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 to-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="flex-1">
          {/* Header with subject badge and action buttons */}
          <div className="flex items-start justify-between mb-3">
            <span className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium border border-border/50">
              {subject}
            </span>
            <div className="flex items-center gap-1">
              {/* Favorite button */}
              <button
                onClick={handleFavoriteClick}
                className="p-1.5 rounded-full hover:bg-secondary transition-colors"
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Star
                  className={`w-4 h-4 transition-all duration-300 ${
                    isFavorite ? "fill-yellow-400 text-yellow-400 scale-110" : "text-muted-foreground"
                  }`}
                />
              </button>

              {/* Download PDF button */}
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="p-1.5 rounded-full hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Download as PDF"
                title="Download as PDF"
              >
                <Download
                  className={`w-4 h-4 text-muted-foreground transition-all ${
                    isDownloading ? 'animate-pulse' : 'hover:text-primary'
                  }`}
                />
              </button>
              
              {/* More options dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    setIsRenameOpen(true);
                  }}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Note title */}
          <h3 className="font-display font-bold text-lg text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          
          {/* Note preview */}
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {preview || "No preview available"}
          </p>
        </div>
        
        {/* Footer with date and duration */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border/50 pt-4 mt-4">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{duration}</span>
          </div>
        </div>
      </div>


      {/* Rename Dialog */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Rename Note</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter new title"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};


export default NoteCard;
