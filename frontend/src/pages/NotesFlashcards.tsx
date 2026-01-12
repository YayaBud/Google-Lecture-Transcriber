import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Sparkles,
} from "lucide-react";

import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { api, tokenManager } from "../lib/api";
import { cn } from "../lib/utils";

interface Note {
  id: string;
  title: string;
  preview: string;
  created_at: number;
  google_doc_url?: string;
  is_favorite?: boolean;
}

type Flashcard = {
  id: string;
  front: string;
  back: string;
  meta?: string;
};

function createFlashcardsFromNote(note: Note): Flashcard[] {
  const baseId = note.id;
  const title = note.title?.trim() || "Untitled";
  const preview = note.preview?.trim() || "";

  const previewSentence = preview.split(/(?<=[.!?])\s+/).filter(Boolean)[0] || preview;

  return [
    {
      id: `${baseId}:1`,
      front: `What is this note about?`,
      back: previewSentence || "No preview available yet.",
      meta: title,
    },
    {
      id: `${baseId}:2`,
      front: `Key takeaway`,
      back: preview ? preview : "Add content to generate richer flashcards.",
      meta: title,
    },
    {
      id: `${baseId}:3`,
      front: `Quick quiz: summarize in one sentence`,
      back: "Try: one-sentence summary + 2 keywords.",
      meta: title,
    },
  ];
}

const NotesFlashcards = () => {
  const navigate = useNavigate();

  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const notesData = await api.getNotes();
        if (notesData?.success) {
          const fetchedNotes: Note[] = notesData.notes || [];
          setNotes(fetchedNotes);
          setSelectedNoteId((prev) => prev ?? fetchedNotes[0]?.id ?? null);
        }
      } catch (error) {
        const token = tokenManager.get();
        if (!token) {
          navigate("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotes();
  }, [navigate]);

  const filteredNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        (n.preview || "").toLowerCase().includes(q)
    );
  }, [notes, query]);

  const selectedNote = useMemo(() => {
    if (!selectedNoteId) return null;
    return notes.find((n) => n.id === selectedNoteId) || null;
  }, [notes, selectedNoteId]);

  const cards = useMemo(() => {
    if (!selectedNote) return [];
    return createFlashcardsFromNote(selectedNote);
  }, [selectedNote]);

  useEffect(() => {
    // Reset carousel state when changing note
    setCardIndex(0);
    setIsFlipped(false);
  }, [selectedNoteId]);

  const currentCard = cards[cardIndex] || null;

  const goPrev = () => {
    setIsFlipped(false);
    setCardIndex((i) => (cards.length ? (i - 1 + cards.length) % cards.length : 0));
  };

  const goNext = () => {
    setIsFlipped(false);
    setCardIndex((i) => (cards.length ? (i + 1) % cards.length : 0));
  };

  const shuffle = () => {
    if (!cards.length) return;
    setIsFlipped(false);
    setCardIndex(Math.floor(Math.random() * cards.length));
  };

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          title="Notes Flashcards"
          subtitle="Study your notes as quick flashcards"
          showSearch={false}
        />

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="space-y-6">
            <Card className="rounded-3xl border-border/50 bg-card">
              <CardHeader className="pb-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Pick a note</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Select a note to generate flashcards.
                      </p>
                    </div>
                  </div>

                  <div className="w-full lg:w-[420px]">
                    <div className="relative">
                      <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search notes..."
                        className="bg-background/50 border-border/50"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {isLoading ? (
                  <div className="py-10 text-center text-muted-foreground">
                    Loading notes...
                  </div>
                ) : filteredNotes.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">
                    No notes found.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filteredNotes.map((note) => {
                      const selected = note.id === selectedNoteId;
                      return (
                        <button
                          key={note.id}
                          type="button"
                          onClick={() => setSelectedNoteId(note.id)}
                          className={cn(
                            "text-left rounded-2xl border p-4 transition-all",
                            "bg-background/40 hover:bg-background/70",
                            selected
                              ? "border-primary bg-primary/5"
                              : "border-border/50"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-semibold text-foreground truncate">
                                {note.title || "Untitled"}
                              </div>
                              <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {note.preview || "No preview available."}
                              </div>
                            </div>
                            {selected && (
                              <div className="shrink-0 h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Sparkles className="h-4 w-4 text-primary" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/50 bg-card">
              <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl">Flashcards</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedNote
                        ? `From: ${selectedNote.title || "Untitled"}`
                        : "Select a note to start."}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={shuffle}
                      disabled={!cards.length}
                      className="gap-2"
                    >
                      <Shuffle className="h-4 w-4" />
                      Shuffle
                    </Button>
                    {selectedNote?.google_doc_url && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(selectedNote.google_doc_url!, "_blank")}
                      >
                        Open note
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {!selectedNote ? (
                  <div className="py-10 text-center text-muted-foreground">
                    Select a note to see flashcards.
                  </div>
                ) : cards.length === 0 || !currentCard ? (
                  <div className="py-10 text-center text-muted-foreground">
                    No flashcards available.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm text-muted-foreground">
                        Card {cardIndex + 1} of {cards.length}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {currentCard.meta}
                      </div>
                    </div>

                    {/* Flashcard */}
                    <button
                      type="button"
                      onClick={() => setIsFlipped((v) => !v)}
                      className={cn(
                        "w-full rounded-3xl border border-border/50 bg-background/40",
                        "p-6 md:p-8 text-left transition-all",
                        "hover:bg-background/70",
                        "min-h-[220px]"
                      )}
                      aria-label="Flip flashcard"
                    >
                      <div className="text-xs text-muted-foreground">
                        {isFlipped ? "Back" : "Front"}
                      </div>
                      <div className="mt-3 text-lg md:text-xl font-semibold text-foreground leading-relaxed">
                        {isFlipped ? currentCard.back : currentCard.front}
                      </div>
                      <div className="mt-4 text-sm text-muted-foreground">
                        Click to flip
                      </div>
                    </button>

                    <div className="flex items-center justify-between gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={goPrev}
                        disabled={!cards.length}
                        className="gap-2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Prev
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsFlipped(false)}
                        disabled={!cards.length}
                      >
                        Reset
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={goNext}
                        disabled={!cards.length}
                        className="gap-2"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                      <Card className="rounded-2xl border-border/50 bg-background/40">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Snippet</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                          {selectedNote.preview || "No snippet yet."}
                        </CardContent>
                      </Card>
                      <Card className="rounded-2xl border-border/50 bg-background/40">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                          Coming soon: automatic summaries.
                        </CardContent>
                      </Card>
                      <Card className="rounded-2xl border-border/50 bg-background/40">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Quiz</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                          Coming soon: practice questions.
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NotesFlashcards;
