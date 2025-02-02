"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useWebSocket } from "@/contexts/WebSocketProvider";

export default function Home() {
  const { messages, sendMessage } = useWebSocket();
  const [gameCode, setGameCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];

      if (latestMessage.event === "session_created") {
        console.log("✅ Session created:", latestMessage.session_id);
        // join the session
        sendMessage({ action: "join_session", session_id: latestMessage.session_id, player_name: playerName });
      }
      else if (latestMessage.event === "session_joined") {
        console.log("✅ Session joined:", latestMessage.session_id);
        router.push(`/lobby?sessionId=${latestMessage.session_id}`);
      }
    }
  }, [messages, router]);

  /**
   * Create a new game session.
   */
  const handleCreateGame = () => {
    if (!playerName.trim()) {
      alert("Enter a player name before creating a game.");
      return;
    }
    sendMessage({ action: "create_session", player_name: playerName });
    // router.push(`/lobby?sessionId=${latestMessage.session_id}&playerId=${latestMessage.player_id}`);
  };

  /**
   * Join an existing game session.
   */
  const handleJoinGame = () => {
    if (!gameCode.trim() || !playerName.trim()) {
      alert("Enter a valid game code and player name.");
      return;
    }
    sendMessage({ action: "join_session", session_id: gameCode, player_name: playerName });
    // router.push(`/lobby?sessionId=${gameCode}`);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-96">
        <h1 className="text-2xl font-bold text-center mb-4">Welcome</h1>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Enter Your Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full p-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Enter Game Code"
            value={gameCode}
            onChange={(e) => setGameCode(e.target.value)}
            className="w-full p-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleJoinGame}
            className="w-full p-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold"
          >
            Join Game
          </button>
          <div className="flex items-center justify-center">
            <span className="text-gray-400">or</span>
          </div>
          <button
            onClick={handleCreateGame}
            className="w-full p-2 bg-green-600 hover:bg-green-500 rounded-lg font-semibold"
          >
            Create Game
          </button>
        </div>
      </div>
    </div>
  );
}
