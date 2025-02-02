"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useWebSocket } from "@/contexts/WebSocketProvider";

export default function Game() {
  const { messages } = useWebSocket();
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  // Listen for WebSocket messages
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      setServerMessage(latestMessage);
    }
  }, [messages]);

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4 bg-gray-900 text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center space-y-6"
      >
        <div className="text-2xl font-bold text-gray-200 text-center">
          f
        </div>
        <div className="flex flex-wrap gap-6">
          {["Option 1", "Option 2", "Option 3", "Option 4"].map((text, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-8 text-xl rounded-lg shadow-md transition"
            >
              {text}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
