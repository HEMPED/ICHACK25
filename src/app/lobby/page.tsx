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
    if (messages.length > 0) {
        if (lobbyId === "PLACEHOLDER") {
            setLobbyId(searchParams.get("sessionId"));
        }
        const latestMessage = messages[messages.length - 1];
        if (latestMessage.event === "player_joined") {
            var NewPlayers = players;
            console.log("NewPlayers", NewPlayers);
            // append the new player to the list
            for (let i = 0; i < 5; i++) {
                console.log("NewPlayers[i]", NewPlayers[i]);
                if (NewPlayers[i] === "") {
                  console.log("New player joined:", latestMessage.player_name);
                  NewPlayers[i] = latestMessage.player_name;
                  break; // Stop once a spot is filled
                }
              }
            setPlayers(NewPlayers);
            if (players[4] !== "") {
                router.push(`/game?sessionId=${latestMessage.session_id}`);
            }
        } else if (latestMessage.event === "session_joined" && messages.length != 1) {
            var newPlayers = latestMessage.existing_players.map((player: any) => player.player_name || "");
            newPlayers.push(latestMessage.player_name);
            if (newPlayers.length === 5) {
                router.push(`/game?sessionId=${latestMessage.session_id}`);
            } else {
                while (newPlayers.length < 5) {
                    newPlayers.push("");
                }
            }
            setPlayers(newPlayers);
        }
        setServerMessage(latestMessage);
        setShow(true);
    }
    }, [messages]);

    return (
    <div className="flex flex-col items-center justify-center h-screen p-4 bg-gray-900 text-white">
        {!show ? (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-bold text-gray-200 text-center"
        >
            Waiting for a message from the server...
        </motion.div>
        ) : (
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
        )}
    </div>
    );
}
