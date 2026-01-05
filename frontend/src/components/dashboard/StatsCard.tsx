import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  onClick?: () => void;
}

const StatsCard = ({ title, value, icon: Icon, trend, onClick }: StatsCardProps) => {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "p-6 rounded-2xl bg-card border border-border/50 hover:shadow-lg transition-all duration-300",
        onClick && "cursor-pointer hover:border-primary/30 hover:bg-card/80"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-xl bg-primary/10">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
      
      <h3 className="text-sm font-medium text-muted-foreground mb-1">
        {title}
      </h3>
      
      <p className="text-3xl font-bold text-foreground mb-2">
        {value}
      </p>
      
      {trend && (
        <p className="text-xs text-muted-foreground">
          {trend}
        </p>
      )}
    </div>
  );
};

export default StatsCard;
