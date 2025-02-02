"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { useWebSocket } from "@/contexts/WebSocketProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { sub } from "framer-motion/client";

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
  const [snippetsReceived, setSnippetsReceived] = useState(false);

  useEffect(() => {
    const promptParam = searchParams.get("starting_prompt") || "";
    setStartingPrompt(promptParam);

    if (submitted && messages.length > 0) {
      const latestMessage = messages[messages.length - 1];

      if (latestMessage.event === "votes_finalized") {
        let newStartingPrompt = startingPrompt + " " + latestMessage.winning_snippet;
        router.push(`/game?startingPrompt=${newStartingPrompt}`);
      } else if (latestMessage.event === "game_over") {
        const encoded = encodeURIComponent(JSON.stringify(latestMessage.winners));
        router.push(`/results`);
      }
    }

    if (!snippetsReceived && messages.length > 0) {
      const latestMessage = messages[messages.length - 1];

      if (latestMessage.event === "all_snippets_submitted") {
        const snippetsDict: SnippetDict = latestMessage.snippets;
        const snippetsArr = Object.entries(snippetsDict).map(([id, text]) => ({
          id,
          text,
        }));
        setSnippets(snippetsArr);
        setSnippetsReceived(true);
      }
    }

    if (waiting && messages.length > 0) {
      const latestMessage = messages[messages.length - 1];

      if (latestMessage.event === "player_id") {
        const playerId = latestMessage.player_id;
        setSnippets((prevSnippets) =>
          prevSnippets.filter((snip) => snip.id !== playerId)
        );
        setWaiting(false);
      } else {
        sendMessage({ action: "get_player_id" });
      }
    }
  }, [searchParams, messages, sendMessage, waiting, snippetsReceived]);

  const handleSnippetClick = (playerSnippet: PlayerSnippet) => {
    if (votes.length >= 4 || votes.some((v) => v.id === playerSnippet.id)) return;

    const newVotes = [...votes, playerSnippet];
    setVotes(newVotes);

    if (newVotes.length === 4) {
      sendMessage({
        action: "submit_votes",
        votes: newVotes.map((v) => v.id),
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

      {/* Show a loading message while waiting */}
      {waiting && snippetsReceived && (
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
      {!waiting && snippetsReceived && !submitted && (
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
            className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-lg"
          >
            {snippets.map((playerSnippet, index) => {
              const isVoted = votes.some((v) => v.id === playerSnippet.id);
              return (
                <motion.button
                  key={playerSnippet.id}
                  onClick={() => handleSnippetClick(playerSnippet)}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`py-4 px-6 rounded shadow-md text-center transition-all 
                    ${
                      isVoted
                        ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  style={{
                    minHeight: "3rem",
                    padding: "1rem",
                    fontSize: `clamp(1rem, 2vw, 1.5rem)`,
                  }}
                  disabled={isVoted}
                >
                  {playerSnippet.text}
                </motion.button>
              );
            })}
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
