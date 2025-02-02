"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion"; // Import AnimatePresence for smooth transitions
import { CheckCircleIcon } from "@heroicons/react/24/solid"; // Heroicons for checkmark
import { useWebSocket } from "@/contexts/WebSocketProvider";
import { useRouter, useSearchParams } from "next/navigation";

export default function SubmissionPage() {
  const { sendMessage, messages } = useWebSocket();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [startingPrompt, setStartingPrompt] = useState("");
  const [snippet, setSnippet] = useState("");
  const [submitted, setSubmitted] = useState(false);
  // Get prompt from URL params
  useEffect(() => {
    const promptFromParams = searchParams.get("startingPrompt") || "";
    setStartingPrompt(promptFromParams);
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage.event === "all_snippets_submitted") {
        // The server sends a dictionary like:
        // { "player1ID": "some snippet", "player2ID": "another snippet", ... }
        const { snippets } = latestMessage; // dictionary

        // Encode the dictionary as a JSON string for the next page
        const encodedSnippets = encodeURIComponent(JSON.stringify(snippets));

        router.push(`/voting?starting_prompt=${encodeURIComponent(startingPrompt)}&snippets=${encodedSnippets}`);
      }
    }
  }, [messages, router, startingPrompt]);

  // Limit input to 5 words
  const handleSnippetChange = (e: ChangeEvent<HTMLInputElement>) => {
    const words = e.target.value.trim().split(/\s+/);
    if (words.length > 5) {
      e.target.value = words.slice(0, 5).join(" ");
    }
    setSnippet(e.target.value);
  };

  // Submit snippet via WebSocket
  const handleSubmit = () => {
    sendMessage({ action: "submit_snippet", snippet });

    // Show checkmark and prevent further submissions
    setSubmitted(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-900 text-white relative"
    >
      {/* Checkmark Animation - Covers Screen on Submit */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center bg-gray-900"
          >
            <CheckCircleIcon className="w-32 h-32 text-green-500" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content (Hidden when Submitted) */}
      {!submitted && (
        <>
          {/* Animated Heading */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 px-4">
            {startingPrompt}
          </h1>

          {/* Input and Button Section */}
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <input
              type="text"
              value={snippet}
              onChange={handleSnippetChange}
              placeholder="Enter 5 words..."
              className="border border-gray-300 text-black rounded px-4 py-2 w-full"
            />
            <button
              onClick={handleSubmit}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full"
            >
              Submit
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}
