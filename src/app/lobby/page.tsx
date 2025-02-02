"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useWebSocket } from "@/contexts/WebSocketProvider";
import { useRouter } from "next/navigation";

import { useSearchParams } from 'next/navigation'

export default function Lobby() {
    const searchParams = useSearchParams()
    const router = useRouter();
    const { messages } = useWebSocket();
    const [serverMessage, setServerMessage] = useState<string | null>(null);
    const [show, setShow] = useState(false);
    const [players, setPlayers] = useState<string[]>(Array(5).fill(""));
    const [lobbyId, setLobbyId] = useState<string | null>("PLACEHOLDER");

    // Listen for WebSocket messages
    useEffect(() => {
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
        Lobby - Waiting for Players <br /> {lobbyId}
    </div>
    <div className="w-full max-w-md space-y-2">
        {players.map((player, index) => (
        <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`py-4 px-6 text-lg rounded-lg shadow-md text-center transition ${player ? "bg-green-500" : "bg-red-500"}`}
        >
            {player || "Waiting for player..."}
        </motion.div>
        ))}
    </div>
    </motion.div>
    </div>
    );
}
