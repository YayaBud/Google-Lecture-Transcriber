import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Send, Loader2, Sparkles, BookOpen, MessageCircle, Bot, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useToast } from "../hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Note {
  id: string;
  title: string;
  preview: string;
  created_at: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const Chatbot = () => {
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/notes`, {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!response.ok) throw new Error('Failed to fetch notes');

      const data = await response.json();
      if (data.success) {
        setNotes(data.notes);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notes',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note);
    setMessages([{
      role: 'assistant',
      content: `Hi! I'm your AI tutor. I've loaded "${note.title}". Ask me anything about this note!`,
      timestamp: new Date()
    }]);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !selectedNote) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_URL}/notes/${selectedNote.id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          question: input,
          history: messages.slice(-6).map(m => ({
            question: m.role === 'user' ? m.content : '',
            answer: m.role === 'assistant' ? m.content : ''
          })).filter(h => h.question || h.answer)
        })
      });

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: 'Failed to get response. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          title="AI Tutor"
          subtitle="Chat with AI about your lecture notes"
        />

        <main className="flex-1 overflow-hidden p-4 md:p-6">
          <div className="h-full flex gap-4">
            
            {/* Left Sidebar - Note Selection */}
            <Card className="w-80 flex flex-col overflow-hidden">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Select a Note
                </CardTitle>
                <CardDescription>Choose which note to discuss</CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-2">
                {isLoadingNotes ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : notes.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    <p>No notes found.</p>
                    <p className="mt-2">Create a note first!</p>
                  </div>
                ) : (
                  notes.map((note) => (
                    <motion.div
                      key={note.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <button
                        onClick={() => handleNoteSelect(note)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedNote?.id === note.id
                            ? 'border-primary bg-primary/10 shadow-md'
                            : 'border-border hover:border-primary/50 hover:bg-accent'
                        }`}
                      >
                        <h3 className="font-semibold text-sm truncate mb-1">
                          {note.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {note.preview}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(note.created_at * 1000).toLocaleDateString()}
                        </p>
                      </button>
                    </motion.div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Right Side - Chat Interface */}
            <Card className="flex-1 flex flex-col overflow-hidden">
              {!selectedNote ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <MessageCircle className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Select a Note to Start</h2>
                  <p className="text-muted-foreground max-w-md">
                    Choose a note from the sidebar to begin chatting with your AI tutor. 
                    Ask questions, get explanations, or request quizzes!
                  </p>
                </div>
              ) : (
                <>
                  {/* Chat Header */}
                  <CardHeader className="border-b">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="truncate">
                          {selectedNote.title}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <Bot className="w-3 h-3" />
                          AI Tutor is ready to help
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages Area */}
                  <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                    <AnimatePresence initial={false}>
                      {messages.map((msg, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              msg.role === 'user' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                            }`}>
                              {msg.role === 'user' ? (
                                <User className="w-4 h-4" />
                              ) : (
                                <Bot className="w-4 h-4" />
                              )}
                            </div>

                            {/* Message Bubble */}
                            <div className={`rounded-2xl p-4 ${
                              msg.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted border border-border'
                            }`}>
                              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                {msg.content}
                              </p>
                              <p className={`text-xs mt-2 ${
                                msg.role === 'user' ? 'opacity-70' : 'text-muted-foreground'
                              }`}>
                                {msg.timestamp.toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="flex gap-3 max-w-[80%]">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                          <div className="bg-muted border border-border rounded-2xl p-4">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                  </CardContent>

                  {/* Input Area */}
                  <div className="border-t p-4 bg-background">
                    <div className="flex gap-2">
                      <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask a question about this note..."
                        disabled={isLoading}
                        className="flex-1"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading}
                        size="icon"
                        className="shrink-0"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Try: "Summarize the main points" or "Quiz me on this topic"
                    </p>
                  </div>
                </>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Chatbot;
