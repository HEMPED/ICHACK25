"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { motion } from "framer-motion";
import { useWebSocket } from "@/contexts/WebSocketProvider";
import { useRouter, useSearchParams } from "next/navigation";

export default function SubmissionPage() {
  const { sendMessage } = useWebSocket(); // Or { socket, messages, sendMessage }, depending on your WebSocket context
  const router = useRouter();
  const searchParams = useSearchParams();

  const [startingPrompt, setStartingPrompt] = useState("");
  const [snippet, setSnippet] = useState("");
  const [animationComplete, setAnimationComplete] = useState(false);

  // Grab the prompt from query params (passed from the lobby)
  useEffect(() => {
    const promptFromParams = searchParams.get("startingPrompt") || "";
    setStartingPrompt(promptFromParams);
  }, [searchParams]);

  // When the prompt animation completes, reveal the text input
  const handleAnimationComplete = () => {
    setAnimationComplete(true);
  };

  // Only allow user to type 5 words
  const handleSnippetChange = (e: ChangeEvent<HTMLInputElement>) => {
    const words = e.target.value.trim().split(/\s+/);
    if (words.length > 5) {
      // Either block more words or truncate them:
      e.target.value = words.slice(0, 5).join(" ");
    }
    setSnippet(e.target.value);
  };

  // Submit snippet to the server via WebSocket
  const handleSubmit = () => {
    // Send snippet if your context’s socket is connected
    sendMessage({
      action: "submit_snippet",
      snippet,
    });
  };

  return (
    <div className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 text-center">
      {/* Animate the prompt from the center to the top, scaling up */}
      <motion.div
        initial={{ y: 0, scale: 1 }}
        animate={{ y: -150, scale: 1.1 }}
        transition={{ duration: 1 }}
        onAnimationComplete={handleAnimationComplete}
        className="text-3xl font-bold mb-4 text-center"
      >
        {startingPrompt}
      </motion.div>

      {/* Once animation completes, show the input and button */}
      {animationComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center mt-8"
        >
          <input
            type="text"
            value={snippet}
            onChange={handleSnippetChange}
            placeholder="Enter 5 words..."
            className="border border-gray-300 text-black rounded px-4 py-2 w-64 mb-4"
          />
          <button
            onClick={handleSubmit}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Submit
          </button>
        </motion.div>
      )}
    </div>
  );
}
