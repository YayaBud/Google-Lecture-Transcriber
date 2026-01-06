import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Mic, Square, Download, FileText, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';

const Record = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [notes, setNotes] = useState("");
  const [noteId, setNoteId] = useState<string | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  
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
      console.log("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Microphone access granted.");

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkLevelInterval = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        setMicLevel(average);
      }, 100);
      
      // @ts-ignore
      mediaRecorderRef.current = { ...mediaRecorderRef.current, checkLevelInterval, audioContext };

      let options = { mimeType: 'audio/webm' };
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
         options = { mimeType: 'audio/webm;codecs=opus' };
      }
      
      console.log("Starting recording with options:", options);
      const mediaRecorder = new MediaRecorder(stream, options);
      // @ts-ignore
      mediaRecorderRef.current = mediaRecorder;
      // @ts-ignore
      mediaRecorder.checkLevelInterval = checkLevelInterval;
      // @ts-ignore
      mediaRecorder.audioContext = audioContext;
      
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log(`Received audio chunk: ${event.data.size} bytes`);
        }
      };

      mediaRecorder.onstop = async () => {
        clearInterval(checkLevelInterval);
        if (audioContext.state !== 'closed') {
            audioContext.close();
        }
        
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        console.log(`MediaRecorder stopped. Total chunks: ${audioChunksRef.current.length}`);
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        let ext = 'webm';
        if (mimeType.includes('mp4')) ext = 'mp4';
        else if (mimeType.includes('wav')) ext = 'wav';
        else if (mimeType.includes('ogg')) ext = 'ogg';

        console.log(`Recording stopped. MimeType: ${mimeType}, Extension: ${ext}, Size: ${audioBlob.size}`);
        await transcribeAudio(audioBlob, ext);
        
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
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
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // @ts-ignore
      if (mediaRecorderRef.current.checkLevelInterval) {
         // @ts-ignore
         clearInterval(mediaRecorderRef.current.checkLevelInterval);
      }
      // @ts-ignore
      if (mediaRecorderRef.current.audioContext && mediaRecorderRef.current.audioContext.state !== 'closed') {
         // @ts-ignore
         mediaRecorderRef.current.audioContext.close();
      }
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob, ext: string) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, `recording.${ext}`);

      const response = await fetch('http://localhost:5000/transcribe', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();
      
      if (data.success) {
        console.log("Transcript received:", data.transcript);
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
        variant: "destructive"
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
        credentials: 'include',
        body: JSON.stringify({ transcript }),
      });

      const data = await response.json();
      
      if (data.success) {
        setNotes(data.notes);
        if (data.note_id) setNoteId(data.note_id);
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
        variant: "destructive"
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
          title: `Lecture Notes - ${new Date().toLocaleDateString()}`,
          note_id: noteId
        }),
      });

      const data = await response.json();
      
      if (data.needs_auth) {
        const authResponse = await fetch('http://localhost:5000/auth/google', {
          credentials: 'include',
        });
        const authData = await authResponse.json();
        window.open(authData.auth_url, '_blank');
        return;
      }
      
      if (data.success) {
        setDocUrl(data.doc_url);
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
        variant: "destructive"
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
        {/* Changed title from "Record" to empty string */}
        <DashboardHeader 
          title="" 
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
                      ? "bg-destructive hover:bg-destructive/90 shadow-destructive/25" 
                      : "bg-primary hover:bg-primary/90 shadow-primary/25"
                  }`}
                >
                  {isRecording ? (
                    <Square className="w-12 h-12 text-primary-foreground fill-current" />
                  ) : (
                    <Mic className="w-12 h-12 text-primary-foreground" />
                  )}
                </button>
              </div>

              {isRecording && (
                <div className="w-64 h-2 bg-secondary rounded-full overflow-hidden mx-auto">
                    <div 
                        className={`h-full transition-all duration-100 ${micLevel > 0 ? 'bg-green-500' : 'bg-destructive'}`}
                        style={{ width: `${Math.min(100, (micLevel / 255) * 300)}%` }}
                    />
                </div>
              )}
              {isRecording && micLevel === 0 && (
                  <p className="text-destructive text-sm font-bold animate-pulse">
                      No audio detected! Check your microphone.
                  </p>
              )}

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
                className="bg-card border border-border rounded-2xl p-6 space-y-4"
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
                className="bg-card border border-border rounded-2xl p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground">AI Generated Notes</h3>
                  <div className="flex gap-2">
                    {docUrl && (
                      <Button
                        onClick={() => window.open(docUrl, '_blank')}
                        size="sm"
                        variant="secondary"
                        className="gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Open in Docs
                      </Button>
                    )}
                    <Button
                      onClick={pushToGoogleDocs}
                      size="sm"
                      variant="outline"
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {docUrl ? 'Update Doc' : 'Push to Google Docs'}
                    </Button>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none dark:prose-invert text-foreground">
                  <ReactMarkdown>{notes}</ReactMarkdown>
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
