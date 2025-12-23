import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import NoteCard from "@/components/dashboard/NoteCard";
import { Button } from "@/components/ui/button";
import { FileText, Clock, Star, FolderOpen, Mic } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Note {
  id: string;
  title: string;
  preview: string;
  created_at: number;
  google_doc_url?: string;
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await fetch('http://localhost:5000/notes', {
          credentials: 'include'
        });
        if (response.status === 401) {
            navigate('/login');
            return;
        }
        const data = await response.json();
        if (data.success) {
          setNotes(data.notes);
        }
      } catch (error) {
        console.error("Failed to fetch notes", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotes();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader title="Dashboard" subtitle="Welcome back, here's your overview." />
        
        <main className="flex-1 p-8 overflow-y-auto">
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-6xl mx-auto space-y-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground mt-1">Welcome back, here's your overview.</p>
              </div>
              <Button onClick={() => navigate('/dashboard/record')} className="gap-2 rounded-xl shadow-lg shadow-primary/20">
                <Mic className="w-4 h-4" />
                New Recording
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div variants={item}>
                <StatsCard 
                  title="Total Notes" 
                  value={notes.length.toString()} 
                  icon={FileText} 
                  trend="All time" 
                />
              </motion.div>
              <motion.div variants={item}>
                <StatsCard 
                  title="Hours Recorded" 
                  value="--" 
                  icon={Clock} 
                  trend="Coming soon" 
                />
              </motion.div>
              <motion.div variants={item}>
                <StatsCard 
                  title="Favorites" 
                  value="0" 
                  icon={Star} 
                  trend="Coming soon" 
                />
              </motion.div>
              <motion.div variants={item}>
                <StatsCard 
                  title="Subjects" 
                  value="1" 
                  icon={FolderOpen} 
                  trend="General" 
                />
              </motion.div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Recent Notes</h2>
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">View All</Button>
              </div>

              {isLoading ? (
                <div className="text-center py-10 text-muted-foreground">Loading notes...</div>
              ) : notes.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground bg-card rounded-xl border border-border">
                    <p>No notes yet. Start recording to create one!</p>
                    <Button variant="link" onClick={() => navigate('/dashboard/record')}>Go to Recorder</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {notes.map((note) => (
                    <motion.div key={note.id} variants={item}>
                      <NoteCard 
                        title={note.title}
                        subject="General" // We can add subject later
                        date={new Date(note.created_at * 1000).toLocaleDateString()}
                        duration="N/A" // We need to store duration
                        preview={note.preview}
                        isFavorite={false}
                        onClick={() => {
                            if (note.google_doc_url) {
                                window.open(note.google_doc_url, '_blank');
                            }
                        }}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
