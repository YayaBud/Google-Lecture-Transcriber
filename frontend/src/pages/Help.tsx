import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    question: "How do I record a lecture?",
    answer: "Navigate to the 'Record' page from the sidebar. Click the microphone icon to start recording. Once finished, click stop to process the audio."
  },
  {
    question: "Can I edit my notes?",
    answer: "Currently, notes are generated automatically. You can push them to Google Docs to edit them there."
  },
  {
    question: "How do I connect to Google Docs?",
    answer: "When you click 'Push to Docs' on a note, you will be prompted to sign in with your Google account if you haven't already."
  },
  {
    question: "Is my data private?",
    answer: "Yes, your recordings and notes are stored securely and are only accessible by you."
  },
  {
    question: "Can I organize my notes into folders?",
    answer: "Yes! Go to the 'Folders' section to create new folders and organize your lecture notes by subject or semester."
  }
];

const Help = () => {
  return (
    <div className="flex h-screen bg-background transition-colors duration-500">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          title="Help & Support" 
          subtitle="Frequently asked questions and guides"
        />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger>{faq.question}</AccordionTrigger>
                      <AccordionContent>
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Help;
