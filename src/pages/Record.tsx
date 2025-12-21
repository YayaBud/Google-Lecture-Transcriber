import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Mic, Square } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const Record = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState("00:00");

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  return (
    <div className="flex h-screen bg-background transition-colors duration-500">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          title="Record" 
          subtitle="Start recording your lecture"
        />
        
        {/* FIX: Ensure this container fills available space and centers content */}
        <main className="flex-1 flex items-center justify-center p-6 relative">
          <div className="w-full max-w-md flex flex-col items-center justify-center space-y-12">
            
            <div className="relative flex items-center justify-center">
              {/* Ripple Effect */}
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

              {/* Main Record Button - Centered */}
              <button
                onClick={toggleRecording}
                className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl hover:scale-105 active:scale-95 ${
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
                {isRecording ? "Recording in progress..." : "Click to start recording"}
              </h2>
              {isRecording && (
                <p className="text-3xl font-mono text-primary font-bold tracking-wider">
                  {duration}
                </p>
              )}
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Ensure your microphone is connected and permissions are granted.
              </p>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Record;
