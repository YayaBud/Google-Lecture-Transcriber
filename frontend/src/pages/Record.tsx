import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Mic, Square, Loader2, FileText, Upload, Download, Play, Pause } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useToast } from "../hooks/use-toast";
import ReactMarkdown from 'react-markdown';


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';


const Record = () => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState("");
  const [notes, setNotes] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [hasTranscribed, setHasTranscribed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioLoadState, setAudioLoadState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isSeeking, setIsSeeking] = useState(false);
  const seekDebounceRef = useRef<NodeJS.Timeout | null>(null);
 
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wasPlayingRef = useRef<boolean>(false);


  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (seekDebounceRef.current) {
        clearTimeout(seekDebounceRef.current);
      }
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      wasPlayingRef.current = false;
    };
  }, []);


  // ✅ FIXED: Effect to monitor audio loading
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      setAudioLoadState('loading');
      
      // ✅ Use readyState check instead of stale state
      const timeoutId = setTimeout(() => {
        // ✅ Check if audio element has loaded data
        if (audioRef.current && audioRef.current.readyState < 2) {
          console.error('🎵 Audio load timeout!');
          setAudioLoadState('error');
          toast({
            title: "Audio Load Failed",
            description: "The audio file could not be loaded. Please try transcribing again.",
            variant: "destructive"
          });
        }
      }, 5000);
      
      loadTimeoutRef.current = timeoutId;
    }
    
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [audioUrl]);


  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
     
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
      };


      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
     
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);


      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not access microphone",
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
    if (!isFinite(seconds) || seconds < 0) {
      return '0:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
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
      console.log('🔐 Token:', token ? 'Present' : 'Missing');
      
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
      setHasTranscribed(true);


      if (data.audio_url) {
        const fullAudioUrl = `${API_URL}${data.audio_url}`;
        setAudioUrl(fullAudioUrl);
        console.log('🎵 Audio URL:', fullAudioUrl);
      }
     
      toast({
        title: "Transcription complete",
        description: `Transcribed ${data.length} characters in ${data.duration}`,
      });
    } catch (error) {
      console.error('Transcription error:', error);
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
      console.error('Generate notes error:', error);
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
      
      const saveResponse = await fetch(`${API_URL}/generate-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ transcript }),
        credentials: 'include'
      });


      if (!saveResponse.ok) {
        throw new Error('Failed to save note');
      }


      const saveData = await saveResponse.json();
      const noteId = saveData.note_id;


      if (!noteId) {
        throw new Error('No note ID received');
      }


      const exportResponse = await fetch(`${API_URL}/notes/${noteId}/export-google-docs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });


      const exportData = await exportResponse.json();
      
      if (exportData.needs_auth) {
        const shouldReconnect = window.confirm(
          'Your Google account needs to be connected to sync notes to Google Docs.\n\nWould you like to connect now?'
        );
        
        if (shouldReconnect) {
          window.location.href = `${API_URL}/auth/google`;
        }
        return;
      }


      if (exportData.success && exportData.google_doc_url) {
        toast({
          title: "Pushed to Google Docs",
          description: "Your notes are now in Google Docs",
        });
        window.open(exportData.google_doc_url, '_blank');
      } else {
        throw new Error('Failed to export to Google Docs');
      }
    } catch (error) {
      console.error('Push to docs error:', error);
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


  const togglePlayPause = () => {
    if (!audioRef.current || !duration) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((error) => {
        console.error('🎵 Play error:', error);
        toast({
          title: "Playback Error",
          description: "Could not play audio",
          variant: "destructive"
        });
      });
    }
  };


  // ✅ FIX #2: Skip onChange during mouse/touch seeking
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSeeking) return; // ✅ CRITICAL FIX: Skip if dragging
    
    if (!audioRef.current || !duration) return;
    const time = parseFloat(e.target.value);
    
    const clampedTime = Math.max(0, Math.min(time, duration));
    setCurrentTime(clampedTime);
    
    if (seekDebounceRef.current) {
      clearTimeout(seekDebounceRef.current);
    }
    
    seekDebounceRef.current = setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.currentTime = clampedTime;
      }
    }, 50);
  };


  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    e.preventDefault();
    setIsSeeking(true);
    
    wasPlayingRef.current = !audioRef.current.paused;
    if (wasPlayingRef.current) {
      audioRef.current.pause();
    }
  };


  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration || !isSeeking) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    
    const x = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(x / rect.width, 1));
    const newTime = percentage * duration;
    
    setCurrentTime(newTime);
    audioRef.current.currentTime = newTime;
  };


  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsSeeking(false);
    
    if (wasPlayingRef.current && audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.error('🎵 Play error:', error);
        toast({
          title: "Playback Error",
          description: "Could not resume audio",
          variant: "destructive"
        });
      });
    }
    wasPlayingRef.current = false;
  };


  // ✅ FIX #1: Proper element reference in mouse handler
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    e.preventDefault();
    setIsSeeking(true);
    
    wasPlayingRef.current = !audioRef.current.paused;
    if (wasPlayingRef.current) {
      audioRef.current.pause();
    }


    // ✅ CRITICAL FIX: Store element reference correctly
    const progressBar = e.currentTarget;


    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!audioRef.current || !duration) return;
      
      // ✅ Use stored reference (not stale e.currentTarget)
      const rect = progressBar.getBoundingClientRect();
      const x = moveEvent.clientX - rect.left;
      const percentage = Math.max(0, Math.min(x / rect.width, 1));
      const newTime = percentage * duration;
      
      setCurrentTime(newTime);
      audioRef.current.currentTime = newTime;
    };


    const handleMouseUp = () => {
      setIsSeeking(false);
      
      if (wasPlayingRef.current && audioRef.current) {
        audioRef.current.play().catch((error) => {
          console.error('🎵 Play error:', error);
        });
      }
      wasPlayingRef.current = false;


      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };


    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
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
                          <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center animate-pulse">
                            <Mic className="w-10 h-10 text-destructive" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-2xl font-mono font-bold">{formatTime(recordingTime)}</p>
                            <p className="text-sm text-muted-foreground">Recording in progress...</p>
                          </div>
                          <Button onClick={stopRecording} variant="destructive" size="lg" className="gap-2">
                            <Square className="w-4 h-4" />
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


            {/* ✅ PRODUCTION-READY: Transcript Card with Audio Player */}
            {hasTranscribed && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Transcript</CardTitle>
                      <CardDescription>Your audio converted to text - Edit as needed</CardDescription>
                    </div>
                    <Button onClick={downloadTranscript} variant="outline" size="sm" className="gap-2">
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* ✅ PRODUCTION-READY: Audio Player with All Critical Fixes */}
                  {audioUrl && (
                    <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">🎵 Audio Playback</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {/* ✅ IMPROVED: Show different states */}
                          {audioLoadState === 'loading' && 'Loading...'}
                          {audioLoadState === 'error' && (
                            <span className="text-destructive">Failed to load</span>
                          )}
                          {audioLoadState === 'loaded' && `${formatTime(currentTime)} / ${formatTime(duration)}`}
                        </span>
                      </div>
                      
                      {/* ✅ ADD: Error message */}
                      {audioLoadState === 'error' && (
                        <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                          ⚠️ Audio failed to load. The file may be corrupted or inaccessible.
                        </div>
                      )}
                      
                      {/* Custom Audio Controls */}
                      <div className="flex items-center gap-3">
                        <Button
                          onClick={togglePlayPause}
                          size="sm"
                          variant="outline"
                          className="h-10 w-10 rounded-full p-0 flex-shrink-0 hover:scale-105 transition-transform"
                          disabled={audioLoadState !== 'loaded'}
                        >
                          {isPlaying ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4 ml-0.5" />
                          )}
                        </Button>
                        
                        {/* ✅ ALL FIXES APPLIED: Progress Bar */}
                        <div 
                          className={`flex-1 relative h-2 group touch-none ${
                            audioLoadState !== 'loaded' ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          onTouchStart={audioLoadState === 'loaded' ? handleTouchStart : undefined}
                          onTouchMove={audioLoadState === 'loaded' ? handleTouchMove : undefined}
                          onTouchEnd={audioLoadState === 'loaded' ? handleTouchEnd : undefined}
                          onMouseDown={audioLoadState === 'loaded' ? handleMouseDown : undefined}
                        >
                          <div className="absolute inset-0 rounded-full bg-muted" />
                          
                          <div 
                            className="absolute left-0 top-0 bottom-0 rounded-full bg-primary pointer-events-none"
                            style={{
                              width: duration > 0 ? `${Math.min((currentTime / duration) * 100, 100)}%` : '0%',
                              transition: isSeeking ? 'none' : 'width 100ms ease-linear'
                            }}
                          />
                          
                          <div 
                            className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-md pointer-events-none transition-opacity duration-200 ${
                              isSeeking ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}
                            style={{
                              left: duration > 0 ? `calc(${Math.min((currentTime / duration) * 100, 100)}% - 6px)` : '0%',
                              transition: isSeeking ? 'left 50ms ease-out' : 'left 100ms ease-linear, opacity 200ms'
                            }}
                          />
                          
                          <input
                            type="range"
                            min="0"
                            max={duration || 100}
                            value={currentTime || 0}
                            onChange={handleSeek}
                            step="0.01"
                            disabled={!duration}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                      
                      <audio
                        ref={audioRef}
                        src={audioUrl}
                        preload="metadata"
                        onLoadedMetadata={(e) => {
                          const audio = e.currentTarget;
                          if (audio.duration && isFinite(audio.duration)) {
                            setDuration(audio.duration);
                            setAudioLoadState('loaded');
                            if (loadTimeoutRef.current) {
                              clearTimeout(loadTimeoutRef.current);
                            }
                            console.log('🎵 Audio loaded successfully, duration:', audio.duration);
                          } else {
                            console.error('🎵 Invalid duration:', audio.duration);
                            setAudioLoadState('error');
                          }
                        }}
                        onCanPlay={() => {
                          console.log('🎵 Audio can play');
                          setAudioLoadState('loaded');
                          if (loadTimeoutRef.current) {
                            clearTimeout(loadTimeoutRef.current);
                          }
                        }}
                        onTimeUpdate={(e) => {
                          if (!isSeeking) {
                            const audio = e.currentTarget;
                            if (isFinite(audio.currentTime)) {
                              setCurrentTime(audio.currentTime);
                            }
                          }
                        }}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => {
                          setIsPlaying(false);
                          setCurrentTime(0);
                        }}
                        onError={(e) => {
                          console.error('🎵 Audio error:', e);
                          setAudioLoadState('error');
                          if (loadTimeoutRef.current) {
                            clearTimeout(loadTimeoutRef.current);
                          }
                          toast({
                            title: "Audio Error",
                            description: "Failed to load audio file. Check console for details.",
                            variant: "destructive"
                          });
                        }}
                        onStalled={() => {
                          console.warn('🎵 Audio stalled');
                        }}
                        onSuspend={() => {
                          console.warn('🎵 Audio suspended');
                        }}
                        crossOrigin="anonymous"
                        className="hidden"
                      />
                    </div>
                  )}
          
                  <div className="space-y-2">
                    <textarea
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      className="w-full p-4 bg-muted/50 rounded-lg max-h-64 min-h-[200px] overflow-auto text-sm resize-y border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Your transcript will appear here. You can edit it before generating notes."
                    />
                    <p className="text-xs text-muted-foreground">
                      💡 Tip: You can edit the transcript before generating notes
                    </p>
                  </div>


                  <div className="flex justify-center">
                    <Button
                      onClick={generateNotes}
                      disabled={isGenerating || !transcript}
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
    </div>
  );
};


export default Record;
