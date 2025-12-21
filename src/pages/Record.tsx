import DashboardSidebar from "@/components/dashboard/DashboardSidebar"
import DashboardHeader from "@/components/dashboard/DashboardHeader"
import { Button } from "@/components/ui/button"
import { Mic, Square } from "lucide-react"
import { useState } from "react"

const Record = () => {
  const [isRecording, setIsRecording] = useState(false)

  return (
    <div className="flex h-screen bg-background dark">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          title="Record" 
          subtitle="Start recording your lecture"
        />
        
        <main className="flex-1 overflow-auto p-6 flex items-center justify-center">
          <div className="text-center">
            <Button
              variant={isRecording ? "destructive" : "hero"}
              size="xl"
              className="w-32 h-32 rounded-full"
              onClick={() => setIsRecording(!isRecording)}
            >
              {isRecording ? (
                <Square className="w-12 h-12" />
              ) : (
                <Mic className="w-12 h-12" />
              )}
            </Button>
            <p className="mt-6 text-lg text-muted-foreground">
              {isRecording ? "Recording in progress..." : "Click to start recording"}
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Record
