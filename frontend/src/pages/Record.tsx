import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Mic, Square, Loader2, FileText, Upload, Download } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useToast } from "../hooks/use-toast";
import ReactMarkdown from 'react-markdown';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Record = () => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState("");
  const [notes, setNotes] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [volume, setVolume] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const analyzeVolume = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume from frequency data
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const average = sum / bufferLength;
    
    // Normalize to 0-100 range with better sensitivity
    const normalizedVolume = Math.min(100, (average / 128) * 100);
    
    setVolume(normalizedVolume);
    
    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(analyzeVolume);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 48000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        } 
      });
      
      // Set up audio analysis
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      source.connect(analyserRef.current);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
        
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        setVolume(0);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      
      analyzeVolume();
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone",
      });
    } catch (error) {
      console.error("Microphone error:", error);
      toast({
        title: "Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      toast({
        title: "Recording stopped",
        description: "Processing your audio...",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/') || file.type === 'video/webm' || file.type === 'video/mp4') {
        setSelectedFile(file);
        setAudioBlob(file);
        toast({
          title: "File selected",
          description: `${file.name} ready to transcribe`,
        });
      } else {
        toast({
          title: "Invalid file",
          description: "Please select an audio or video file",
          variant: "destructive",
        });
      }
    }
  };

  const transcribeAudio = async () => {
    if (!audioBlob) {
      toast({
        title: "No audio",
        description: "Please record or upload audio first",
        variant: "destructive",
      });
      return;
    }

    setIsTranscribing(true);
    const formData = new FormData();
    formData.append('audio', audioBlob, selectedFile?.name || 'recording.webm');

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/transcribe`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      setTranscript(data.transcript);
      
      toast({
        title: "Transcription complete",
        description: `Transcribed ${data.length} characters in ${data.duration}`,
      });
    } catch (error) {
      console.error("Transcription error:", error);
      toast({
        title: "Error",
        description: "Failed to transcribe audio",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const generateNotes = async () => {
    if (!transcript) {
      toast({
        title: "No transcript",
        description: "Please transcribe audio first",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/generate-notes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ transcript }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const data = await response.json();
      setNotes(data.notes);
      
      toast({
        title: "Notes generated",
        description: "AI has created structured notes from your transcript",
      });
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Error",
        description: "Failed to generate notes",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const pushToGoogleDocs = async () => {
    if (!notes) {
      toast({
        title: "No notes",
        description: "Please generate notes first",
        variant: "destructive",
      });
      return;
    }

    setIsPushing(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/push-to-docs`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 
          notes,
          title: `Lecture Notes ${new Date().toLocaleDateString()}`
        }),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (data.needs_auth) {
        const authResponse = await fetch(`${API_URL}/auth/google`, {
          credentials: 'include'
        });
        const authData = await authResponse.json();
        window.location.href = authData.auth_url;
        return;
      }

      if (data.success) {
        toast({
          title: "Pushed to Google Docs",
          description: "Your notes are now in Google Docs",
        });
        window.open(data.doc_url, '_blank');
      }
    } catch (error) {
      console.error("Push to docs error:", error);
      toast({
        title: "Error",
        description: "Failed to push to Google Docs",
        variant: "destructive",
      });
    } finally {
      setIsPushing(false);
    }
  };

  const downloadTranscript = () => {
    if (!transcript) return;
    
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadNotes = () => {
    if (!notes) return;
    
    const blob = new Blob([notes], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes-${new Date().toISOString()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          title="Record Lecture" 
          subtitle="Record or upload audio to generate notes"
        />
        
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Recording Card */}
            <Card>
              <CardHeader>
                <CardTitle>Audio Input</CardTitle>
                <CardDescription>Record live or upload an audio/video file</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg border-border hover:border-primary/50 transition-colors">
                      {isRecording ? (
                        <div className="text-center space-y-4">
                          {/* Advanced Circular Visualizer */}
                          <div className="relative w-48 h-48 mx-auto">
                            {/* Outer glow ring */}
                            <div 
                              className="absolute inset-0 rounded-full blur-xl transition-all duration-150"
                              style={{
                                background: `radial-gradient(circle, rgba(239, 68, 68, ${volume / 200}) 0%, transparent 70%)`,
                                transform: `scale(${1 + volume / 300})`
                              }}
                            />
                            
                            {/* Multiple rotating rings */}
                            {[0, 1, 2].map((index) => (
                              <svg 
                                key={index}
                                className="absolute inset-0 w-full h-full -rotate-90"
                                style={{
                                  animation: `spin ${6 + index * 2}s linear infinite`,
                                  opacity: 0.3 + (volume / 300)
                                }}
                              >
                                <circle
                                  cx="96"
                                  cy="96"
                                  r={80 - index * 8}
                                  fill="none"
                                  stroke="url(#gradient)"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeDasharray={`${(volume / 100) * (502 - index * 50)} ${502 - index * 50}`}
                                  className="transition-all duration-100"
                                />
                                <defs>
                                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#ef4444" />
                                    <stop offset="50%" stopColor="#f97316" />
                                    <stop offset="100%" stopColor="#eab308" />
                                  </linearGradient>
                                </defs>
                              </svg>
                            ))}
                            
                            {/* Center mic with pulsing effect */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div 
                                className="relative w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-2xl transition-all duration-100"
                                style={{
                                  transform: `scale(${1 + volume / 400})`,
                                  boxShadow: `0 0 ${Math.max(20, volume / 2)}px rgba(239, 68, 68, 0.8), 0 0 ${Math.max(40, volume)}px rgba(239, 68, 68, 0.4)`
                                }}
                              >
                                {/* Animated pulse rings */}
                                {volume > 20 && (
                                  <>
                                    <div 
                                      className="absolute inset-0 rounded-full bg-red-400/30 animate-ping"
                                      style={{ animationDuration: '1s' }}
                                    />
                                    <div 
                                      className="absolute inset-0 rounded-full bg-orange-400/20 animate-ping"
                                      style={{ animationDuration: '1.5s' }}
                                    />
                                  </>
                                )}
                                <Mic className="w-12 h-12 text-white relative z-10" />
                              </div>
                            </div>
                            
                            {/* Floating particles */}
                            {volume > 30 && [0, 1, 2, 3, 4, 5].map((i) => (
                              <div
                                key={i}
                                className="absolute w-2 h-2 bg-gradient-to-br from-red-400 to-orange-400 rounded-full"
                                style={{
                                  top: '50%',
                                  left: '50%',
                                  animation: `float-particle ${1.5 + i * 0.3}s ease-in-out infinite`,
                                  animationDelay: `${i * 0.2}s`,
                                  opacity: volume / 150
                                }}
                              />
                            ))}
                          </div>
                          
                          <div className="space-y-3">
                            <p className="text-4xl font-mono font-bold tracking-wider">
                              {formatTime(recordingTime)}
                            </p>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Recording in progress...</p>
                              <div className="flex items-center justify-center gap-2">
                                <div className="h-1.5 w-1.5 bg-red-500 rounded-full animate-pulse" />
                                <p className="text-xs font-mono text-red-500">
                                  LIVE • {Math.round(volume)}%
                                </p>
                              </div>
                            </div>
                            {/* Volume bar */}
                            <div className="w-48 h-2 bg-muted rounded-full overflow-hidden mx-auto">
                              <div 
                                className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 transition-all duration-100 rounded-full"
                                style={{ width: `${volume}%` }}
                              />
                            </div>
                          </div>
                          
                          <Button 
                            onClick={stopRecording} 
                            variant="destructive" 
                            size="lg" 
                            className="gap-2"
                          >
                            <Square className="w-4 h-4" fill="currentColor" />
                            Stop Recording
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center space-y-4">
                          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                            <Mic className="w-10 h-10 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">Start Recording</p>
                            <p className="text-sm text-muted-foreground">Click to begin recording audio</p>
                          </div>
                          <Button onClick={startRecording} size="lg" className="gap-2">
                            <Mic className="w-4 h-4" />
                            Start Recording
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <span className="text-muted-foreground font-medium">OR</span>
                  </div>

                  <div className="flex-1">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg border-border hover:border-primary/50 transition-colors cursor-pointer"
                    >
                      <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Upload className="w-10 h-10 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium">Upload File</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          {selectedFile ? selectedFile.name : "Click to select audio/video file"}
                        </p>
                      </div>
                      <Button variant="outline" size="lg" className="gap-2">
                        <Upload className="w-4 h-4" />
                        Choose File
                      </Button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*,video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>

                {audioBlob && (
                  <div className="flex justify-center pt-4 border-t">
                    <Button 
                      onClick={transcribeAudio} 
                      disabled={isTranscribing}
                      size="lg"
                      className="gap-2"
                    >
                      {isTranscribing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Transcribing...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4" />
                          Transcribe Audio
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transcript Card */}
            {transcript && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Transcript</CardTitle>
                      <CardDescription>Your audio converted to text</CardDescription>
                    </div>
                    <Button onClick={downloadTranscript} variant="outline" size="sm" className="gap-2">
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-muted/50 rounded-lg max-h-64 overflow-auto">
                    <p className="whitespace-pre-wrap text-sm">{transcript}</p>
                  </div>
                  <div className="flex justify-center mt-4">
                    <Button 
                      onClick={generateNotes} 
                      disabled={isGenerating}
                      size="lg"
                      className="gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating Notes...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4" />
                          Generate Notes
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes Card */}
            {notes && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Generated Notes</CardTitle>
                      <CardDescription>AI-structured lecture notes</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={downloadNotes} variant="outline" size="sm" className="gap-2">
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                      <Button 
                        onClick={pushToGoogleDocs} 
                        disabled={isPushing}
                        size="sm"
                        className="gap-2"
                      >
                        {isPushing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Pushing...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Push to Docs
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-muted/50 rounded-lg max-h-96 overflow-auto">
                    <ReactMarkdown>{notes}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      <style>{`
        @keyframes float-particle {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) translateX(0) scale(1);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) rotate(360deg) translateX(80px) scale(0);
            opacity: 0;
          }
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default Record;