import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import NoteCard from "@/components/dashboard/NoteCard";
import { Button } from "@/components/ui/button";
import { FileText, Clock, Star, FolderOpen, Mic } from "lucide-react";
import { motion, Variants } from "framer-motion"; // FIX: Import Variants type

const recentNotes = [
  {
    id: 1,
    title: "Introduction to Machine Learning",
    subject: "CS 229",
    date: "Today",
    duration: "52 min",
    preview: "Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience...",
    isFavorite: true,
  },
  {
    id: 2,
    title: "Organic Chemistry - Reactions",
    subject: "CHEM 201",
    date: "Yesterday",
    duration: "48 min",
    preview: "Today we covered nucleophilic substitution reactions. SN1 and SN2 mechanisms differ in their reaction order...",
    isFavorite: false,
  },
  {
    id: 3,
    title: "World History - Industrial Revolution",
    subject: "HIST 101",
    date: "2 days ago",
    duration: "45 min",
    preview: "The Industrial Revolution began in Britain in the late 18th century. Key factors included access to coal, iron...",
    isFavorite: false,
  },
  {
    id: 4,
    title: "Linear Algebra - Eigenvalues",
    subject: "MATH 304",
    date: "3 days ago",
    duration: "55 min",
    preview: "Eigenvalues and eigenvectors are fundamental concepts in linear algebra. For a square matrix A, λ is an eigenvalue...",
    isFavorite: true,
  },
];

// FIX: Add Variants type annotation
const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// FIX: Add Variants type annotation
const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring", 
      stiffness: 50 
    } 
  }
};

const Dashboard = () => {
  return (
    <div className="flex h-screen bg-background transition-colors duration-500">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          title="Dashboard" 
          subtitle="Welcome back! Here's your learning summary."
        />
        
        <main className="flex-1 overflow-auto p-6">
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-7xl mx-auto"
          >
            {/* Quick action - iPhone style pill button */}
            <motion.div variants={item} className="mb-8">
              <Button 
                size="lg" 
                className="gap-2 rounded-full shadow-lg hover:shadow-primary/25 h-12 px-8 transition-all duration-300 hover:scale-[1.02] bg-foreground text-background hover:bg-foreground/90"
              >
                <Mic className="w-5 h-5" />
                Start New Recording
              </Button>
            </motion.div>

            {/* Stats Grid - Bento Style */}
            <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              <StatsCard 
                title="Total Notes" 
                value="47" 
                change="+3 this week" 
                icon={FileText}
                trend="up"
              />
              <StatsCard 
                title="Hours Recorded" 
                value="36.5" 
                change="+2.5 hrs" 
                icon={Clock}
                trend="up"
              />
              <StatsCard 
                title="Favorites" 
                value="12" 
                icon={Star}
              />
              <StatsCard 
                title="Folders" 
                value="8" 
                icon={FolderOpen}
              />
            </motion.div>

            {/* Recent notes */}
            <motion.div variants={item}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-bold text-foreground tracking-tight">
                  Recent Notes
                </h2>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary rounded-full">
                  View All
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {recentNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    variants={item}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                    <NoteCard
                      title={note.title}
                      subject={note.subject}
                      date={note.date}
                      duration={note.duration}
                      preview={note.preview}
                      isFavorite={note.isFavorite}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
