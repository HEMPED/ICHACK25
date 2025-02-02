"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { useWebSocket } from "@/contexts/WebSocketProvider";
import { useRouter, useSearchParams } from "next/navigation";

interface SnippetDict {
  [playerId: string]: string;
}

interface PlayerSnippet {
  id: string;
  text: string;
}

export default function VotingPage() {
  const { sendMessage, messages } = useWebSocket();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [startingPrompt, setStartingPrompt] = useState("");
  const [snippets, setSnippets] = useState<PlayerSnippet[]>([]);
  const [votes, setVotes] = useState<PlayerSnippet[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [waiting, setWaiting] = useState(true);

  useEffect(() => {
    const promptParam = searchParams.get("starting_prompt") || "";
    setStartingPrompt(promptParam);

    // Check if we're still waiting for snippet data
    if (waiting) {
      if (messages.length > 0) {
        const latestMessage = messages[messages.length - 1];

        if (latestMessage.event === "all_snippets_submitted") {
          const m = latestMessage.snippets as SnippetDict;
          console.log("📩 Received:", m);

          const newSnippets = Object.entries(m).map(([id, text]) => ({ id, text }));
          setSnippets(newSnippets);
        }
        else if (latestMessage.event === "player_id") {
          // Remove this player's own snippet (since they shouldn't vote on themselves)
          const playerId = latestMessage.player_id;
          const updatedSnippets = [...snippets].filter(snip => snip.id !== playerId);

          console.log("🥜 Updated snippet list:", updatedSnippets);
          setSnippets(updatedSnippets);

          // Mark waiting as false so UI can appear
          setWaiting(false);
        } else {
          sendMessage({ action: "get_player_id" });
        }
      } else {
        // If no messages yet, request the player ID
        sendMessage({ action: "get_player_id" });
      }
    }
  }, [searchParams, messages, sendMessage, snippets, waiting]);

  const handleSnippetClick = (playerSnippet: PlayerSnippet) => {
    if (votes.length >= 3) return;

    const newVotes = [...votes, playerSnippet];
    setVotes(newVotes);

    // Once we reach 3 votes, send to server and show checkmark
    if (newVotes.length === 3) {
      sendMessage({
        action: "submit_votes",
        votes: newVotes.map((v) => ({ id: v.id, text: v.text })),
      });
      setSubmitted(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-900 text-white relative"
    >
      {/* Checkmark Overlay on Submission */}
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

      {/* Show a loading message/spinner while waiting */}
      {waiting && !submitted && (
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-xl font-semibold"
        >
          Waiting for players to submit...
        </motion.h2>
      )}

      {/* Show voting UI only if not waiting and not submitted */}
      {!waiting && !submitted && (
        <>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 px-4"
          >
            {startingPrompt}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-2 gap-4 max-w-md"
          >
            {snippets.slice(0, 4).map((playerSnippet, index) => (
              <motion.button
                key={playerSnippet.id}
                onClick={() => handleSnippetClick(playerSnippet)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded shadow-md text-center"
              >
                {playerSnippet.text}
              </motion.button>
            ))}
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
