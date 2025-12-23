import { Mic, Wand2, FileText, CheckCircle2 } from "lucide-react";

const steps = [
  {
    icon: Mic,
    title: "Start Recording",
    description: "Open NoteFlow and hit record when your lecture begins. Works with in-person or online classes.",
  },
  {
    icon: Wand2,
    title: "AI Processes",
    description: "Our AI transcribes speech in real-time, identifies key concepts, and structures your notes.",
  },
  {
    icon: FileText,
    title: "Review & Edit",
    description: "Get beautifully formatted notes with summaries, highlights, and action items ready to review.",
  },
  {
    icon: CheckCircle2,
    title: "Study & Share",
    description: "Use your notes to study, share with classmates, or export to your favorite tools.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Simple as{" "}
            <span className="text-gradient">1-2-3-4</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Get started in seconds. No complex setup, no learning curve.
          </p>
        </div>

        <div className="relative">
          {/* Connection line - hidden on mobile */}
          <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="relative text-center"
              >
                {/* Step number */}
                <div className="relative inline-flex mb-6">
                  <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-soft">
                    <step.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-card border-2 border-primary flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{index + 1}</span>
                  </div>
                </div>
                
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
