import { Star, Clock, Calendar } from "lucide-react";
import { useState } from "react";

interface NoteCardProps {
  title: string;
  subject: string;
  date: string;
  duration: string;
  preview: string;
  isFavorite: boolean;
  onClick?: () => void;
}

const NoteCard = ({ title, subject, date, duration, preview, isFavorite: initialFavorite, onClick, onToggleFavorite }: NoteCardProps & { onToggleFavorite?: () => void }) => {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);

  // Sync local state if prop changes (e.g. from parent refresh)
  if (initialFavorite !== isFavorite) {
      setIsFavorite(initialFavorite);
  }

  return (
    <div 
      onClick={onClick}
      className="h-full p-5 rounded-3xl bg-card border border-border/50 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
    >
      {/* Top Gradient Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 to-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div>
        <div className="flex items-start justify-between mb-3">
          <span className="px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium border border-border/50">
            {subject}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Optimistic update
              setIsFavorite(!isFavorite);
              if (onToggleFavorite) onToggleFavorite();
            }}
            className="p-1.5 rounded-full hover:bg-secondary transition-colors"
          >
            <Star
              className={`w-4 h-4 transition-all duration-300 ${
                isFavorite ? "fill-yellow-400 text-yellow-400 scale-110" : "text-muted-foreground"
              }`}
            />
          </button>
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
  );
};

export default NoteCard;
