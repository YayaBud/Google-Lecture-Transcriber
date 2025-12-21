import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import NoteCard from "@/components/dashboard/NoteCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Grid3X3, List } from "lucide-react";

// ... (keep your notes data array as is) ...
const notes = [
  { id: 1, title: "Introduction to Machine Learning", subject: "CS 229", date: "Today", duration: "52 min", preview: "Machine learning is a subset...", isFavorite: true },
  { id: 2, title: "Organic Chemistry", subject: "CHEM 201", date: "Yesterday", duration: "48 min", preview: "Nucleophilic substitution...", isFavorite: false },
  // ... rest of your notes
];

const Notes = () => {
  return (
    // FIX: Removed "dark" and hardcoded bg colors. Uses global theme bg.
    <div className="flex h-screen bg-background transition-colors duration-500">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          title="All Notes" 
          subtitle="Browse and manage all your lecture notes"
        />
        
        <main className="flex-1 overflow-auto p-6">
          <Tabs defaultValue="all" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <TabsList className="bg-secondary/50 p-1 rounded-xl">
                <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">All Notes</TabsTrigger>
                <TabsTrigger value="recent" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Recent</TabsTrigger>
                <TabsTrigger value="favorites" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Favorites</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-2">
                <div className="flex bg-secondary/50 p-1 rounded-lg border border-border">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md bg-background shadow-sm">
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md text-muted-foreground">
                    <List className="w-4 h-4" />
                  </Button>
                </div>
                <Button className="gap-2 rounded-full">
                  <Plus className="w-4 h-4" />
                  New Note
                </Button>
              </div>
            </div>

            <TabsContent value="all" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    title={note.title}
                    subject={note.subject}
                    date={note.date}
                    duration={note.duration}
                    preview={note.preview}
                    isFavorite={note.isFavorite}
                  />
                ))}
              </div>
            </TabsContent>
            
            {/* Add other TabsContent for 'recent' and 'favorites' if needed */}
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Notes;
