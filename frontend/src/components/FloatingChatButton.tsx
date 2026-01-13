import { MessageCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { motion } from 'framer-motion';

const FloatingChatButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show button on chatbot page itself
  if (location.pathname === '/dashboard/chatbot') {
    return null;
  }

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: 'spring',
        stiffness: 260,
        damping: 20,
        delay: 0.5
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <Button
        onClick={() => navigate('/dashboard/chatbot')}
        className="h-14 w-14 rounded-full shadow-2xl hover:shadow-primary/50 transition-all duration-300 bg-gradient-to-br from-primary to-primary/80 hover:from-primary hover:to-primary group"
        size="icon"
      >
        <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
        
        {/* Pulse animation ring */}
        <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
      </Button>
      
      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-popover text-popover-foreground text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Chat with AI Tutor
        <div className="absolute top-full right-4 w-2 h-2 bg-popover rotate-45 -mt-1" />
      </div>
    </motion.div>
  );
};

export default FloatingChatButton;
