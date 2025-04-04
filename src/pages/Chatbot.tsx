import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {/* Chatbot Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700"
      >
        <Bot className="h-6 w-6" />
      </motion.button>

      {/* Chatbot Window */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="bg-white rounded-lg shadow-xl border border-gray-300 w-80 h-[500px] mt-3 relative"
        >
          <div className="flex justify-between items-center bg-indigo-600 text-white p-3 rounded-t-lg">
            <span className="font-semibold">AI Assistant</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white text-lg font-bold"
            >
              &times;
            </button>
          </div>
          <iframe
            src="https://www.chatbase.co/chatbot-iframe/fDzle9yleBIL9o8zRI6kS"
            width="100%"
            height="450px"
            frameBorder="0"
            className="rounded-b-lg"
          ></iframe>
        </motion.div>
      )}
    </div>
  );
};

export default Chatbot;
