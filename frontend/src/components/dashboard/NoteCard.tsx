import { Star, Clock, Calendar, MoreVertical, Pencil, Trash2 } from "lucide-react";
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
  onToggleFavorite?: () => void;
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

  useEffect(() => {
    setIsFavorite(initialFavorite);
  }, [initialFavorite]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    if (onToggleFavorite) {
      onToggleFavorite();
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

  return (
    <>
      <div 
        onClick={onClick}
        className="h-full p-5 rounded-3xl bg-card border border-border/50 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 to-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div>
          <div className="flex items-start justify-between mb-3">
            <span className="px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium border border-border/50">
              {subject}
            </span>
            <div className="flex items-center gap-1">
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

          <h3 className="font-display font-bold text-lg text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
            {preview}
          </p>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border/50 pt-4 mt-auto">
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
