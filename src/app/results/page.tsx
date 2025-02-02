"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useWebSocket } from "@/contexts/WebSocketProvider";

interface Winner {
  player_name: string;
  votes: number;
}

export default function ResultsPage() {
  const { sendMessage, messages } = useWebSocket();
  const [winners, setWinners] = useState<Winner[]>([]);
  const [waiting, setWaiting] = useState(true);

  // We'll map indices to "1st Place", "2nd Place", "3rd Place"
  const places = ["1st Place", "2nd Place", "3rd Place"];

  useEffect(() => {
    if (waiting) {
      if (messages.length < 1) {
        // Request the winners from the server
        sendMessage({ action: "get_winning_votees" });
      } else {
        const latestMessage = messages[messages.length - 1];
        if (latestMessage.event === "winning_votees") {
          let newwinners: Winner[] = [];
          const res = latestMessage.winners; // e.g.: [["Alice", 10], ["Bob", 8], ["Carol", 6]]
          for (let result of res) {
            newwinners.push({ player_name: result[0], votes: result[1] });
          }
          setWinners(newwinners);
          setWaiting(false);
        } else {
          sendMessage({ action: "get_winning_votees" });
        }
      }
    }
  }, [messages, sendMessage, waiting]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-4">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-3xl font-bold mb-8"
      >
        Results
      </motion.h1>

      {/* This container is now flex-col and items-center to horizontally center each winner’s box */}
      <div className="flex flex-col items-center space-y-4">
        {winners.slice(0, 3).map((winner, i) => {
          // Conditionally size the boxes for 1st/2nd/3rd place
          let boxClasses = "bg-gray-800 rounded p-4 text-center ";
          if (i === 0) {
            // 1st place
            boxClasses += "w-72 h-36";
          } else if (i === 1) {
            // 2nd place
            boxClasses += "w-64 h-32";
          } else {
            // 3rd place
            boxClasses += "w-56 h-28";
          }

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={boxClasses}
            >
              <div className="text-xl font-semibold">
                {places[i] || `${i + 1}th Place`}
              </div>
              <div className="text-lg mt-1">{winner.player_name}</div>
              <div className="text-sm text-gray-400">
                {winner.votes} Score
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
