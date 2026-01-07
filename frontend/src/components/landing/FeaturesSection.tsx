import { Mic, Brain, FolderOpen, Search, Clock, Share2 } from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Live Transcription",
    description: "Real-time speech-to-text conversion with 99% accuracy. Supports multiple languages and accents.",
  },
  {
    icon: Brain,
    title: "AI Summarization",
    description: "Automatically extracts key points, concepts, and action items from your lectures.",
  },
  {
    icon: FolderOpen,
    title: "Smart Organization",
    description: "Notes are automatically categorized by subject, date, and topics for easy retrieval.",
  },
  {
    icon: Search,
    title: "Semantic Search",
    description: "Find any concept across all your notes instantly with AI-powered search.",
  },
  {
    icon: Clock,
    title: "Timestamped Notes",
    description: "Jump to any moment in the lecture. Notes are synced with audio timestamps.",
  },
  {
    icon: Share2,
    title: "Easy Sharing",
    description: "Share notes with classmates or export to your favorite tools like Notion or Docs.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Everything You Need to{" "}
            <span className="text-gradient">Ace Your Classes</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful features designed specifically for students who want to focus on understanding, not note-taking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-elevated hover:scale-[1.03] hover:-translate-y-1 opacity-0 translate-y-8 animate-feature-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-125 transition-transform duration-300 group-hover:shadow-lg">
                <feature.icon className="w-6 h-6 text-primary drop-shadow-[0_0_8px_rgba(59,130,246,0.7)]" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
