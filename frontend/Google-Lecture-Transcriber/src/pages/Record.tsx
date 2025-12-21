import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Mic, Square, Download, FileText, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Record = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await transcribeAudio(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      
      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone",
      });
    } catch (error) {
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone permissions",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const response = await fetch('http://localhost:5000/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        console.log("Transcript received:", data.transcript);
        console.log("Transcript length:", data.transcript.length);
        console.log("Transcript type:", typeof data.transcript);
        setTranscript(data.transcript);
        toast({
          title: "Transcription complete",
          description: "Audio has been converted to text",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Transcription failed",
        description: "Please try recording again",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const generateNotes = async () => {
    if (!transcript) return;
    
    setIsGeneratingNotes(true);
    try {
      const response = await fetch('http://localhost:5000/generate-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      });

      const data = await response.json();
      
      if (data.success) {
        setNotes(data.notes);
        toast({
          title: "Notes generated",
          description: "AI has created structured notes from your lecture",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Note generation failed",
        description: "Please try again",
      });
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  const pushToGoogleDocs = async () => {
    if (!notes) return;
    
    try {
      const response = await fetch('http://localhost:5000/push-to-docs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          notes,
          title: `Lecture Notes - ${new Date().toLocaleDateString()}`
        }),
      });

      const data = await response.json();
      
      if (data.needs_auth) {
        // Get auth URL
        const authResponse = await fetch('http://localhost:5000/auth/google', {
          credentials: 'include',
        });
        const authData = await authResponse.json();
        window.open(authData.auth_url, '_blank');
        return;
      }
      
      if (data.success) {
        toast({
          title: "Pushed to Google Docs",
          description: "Notes saved successfully",
        });
        window.open(data.doc_url, '_blank');
      }
    } catch (error) {
      toast({
        title: "Failed to push to Google Docs",
        description: "Please try again",
      });
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex h-screen bg-background transition-colors duration-500">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          title="Record" 
          subtitle="Start recording your lecture"
        />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Recording Section */}
            <div className="flex flex-col items-center justify-center space-y-8 py-12">
              <div className="relative flex items-center justify-center">
                {isRecording && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div 
                      animate={{ scale: [1, 2], opacity: [0.3, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute w-full h-full rounded-full bg-primary/20"
                    />
                    <motion.div 
                      animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      className="absolute w-full h-full rounded-full bg-primary/20"
                    />
                  </div>
                )}

                <button
                  onClick={toggleRecording}
                  disabled={isProcessing}
                  className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isRecording 
                      ? "bg-red-500 hover:bg-red-600 shadow-red-500/25" 
                      : "bg-primary hover:bg-primary/90 shadow-primary/25"
                  }`}
                >
                  {isRecording ? (
                    <Square className="w-12 h-12 text-white fill-current" />
                  ) : (
                    <Mic className="w-12 h-12 text-white" />
                  )}
                </button>
              </div>

              <div className="text-center space-y-4">
                <h2 className="text-2xl font-display font-bold text-foreground">
                  {isProcessing ? "Processing audio..." : isRecording ? "Recording in progress..." : "Click to start recording"}
                </h2>
                {isRecording && (
                  <p className="text-3xl font-mono text-primary font-bold tracking-wider">
                    {formatDuration(duration)}
                  </p>
                )}
                {isProcessing && (
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                )}
              </div>
            </div>

            {/* Transcript Section */}
            {transcript && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-secondary/30 border border-border rounded-2xl p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground">Transcript</h3>
                  <Button
                    onClick={generateNotes}
                    disabled={isGeneratingNotes}
                    size="sm"
                    className="gap-2"
                  >
                    {isGeneratingNotes ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        Generate Notes
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {transcript}
                </p>
              </motion.div>
            )}

            {/* Notes Section */}
            {notes && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-secondary/30 border border-border rounded-2xl p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground">AI Generated Notes</h3>
                  <Button
                    onClick={pushToGoogleDocs}
                    size="sm"
                    variant="outline"
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Push to Google Docs
                  </Button>
                </div>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <pre className="whitespace-pre-wrap font-sans">{notes}</pre>
                </div>
              </motion.div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

export default Record;
