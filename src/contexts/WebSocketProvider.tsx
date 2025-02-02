"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type WebSocketContextType = {
  messages: any[];
  sendMessage: (message: object) => void;
};

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const url = "ws:172.30.181.229:8000/ws";

  useEffect(() => {
    if (!ws) {
      const socket = new WebSocket(url);

      socket.onopen = () => {
        console.log("✅ WebSocket Connected");
        setRetryCount(0);
      };
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("📩 Received:", data);
        setMessages((prev) => [...prev, data]);
      };
      socket.onerror = (error) => console.error("❌ WebSocket Error:", error);
      socket.onclose = () => {
        console.log("❌ WebSocket Disconnected");
        if (retryCount < 5) {
            setTimeout(() => {
              setRetryCount((prev) => prev + 1);
              setWs(new WebSocket(url));
            }, 2000); // Reconnect after 2 seconds
          }
      };

      setWs(socket);
    }
  }, [ws]);

  const sendMessage = (message: object) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not open.");
    }
  };

  return (
    <WebSocketContext.Provider value={{ messages, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
