import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check local storage or system preference
    const saved = localStorage.getItem("theme")
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const initialDark = saved ? saved === "dark" : systemDark
    
    setIsDark(initialDark)
    document.documentElement.classList.toggle("dark", initialDark)
  }, [])

  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle("dark", next)
    localStorage.setItem("theme", next ? "dark" : "light")
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggle} 
      className="rounded-full w-10 h-10 bg-background/50 backdrop-blur-sm border border-border hover:bg-accent transition-all duration-300"
    >
      <div className="relative w-5 h-5">
        <Sun className={`absolute inset-0 w-full h-full transition-all duration-500 ${isDark ? 'rotate-90 opacity-0 scale-50' : 'rotate-0 opacity-100 scale-100'}`} />
        <Moon className={`absolute inset-0 w-full h-full transition-all duration-500 ${isDark ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-50'}`} />
      </div>
    </Button>
  )
}
