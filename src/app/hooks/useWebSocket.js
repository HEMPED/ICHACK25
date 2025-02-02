import { useEffect, useState } from "react";

const useWebSocket = (url) => {
  const [messages, setMessages] = useState([]);
  const [ws, setWs] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [playerId, setPlayerId] = useState(null);

  useEffect(() => {
    const socket = new WebSocket(url);

    socket.onopen = () => {
      console.log("✅ WebSocket connection opened");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📩 Received:", data);

      // Store messages
      setMessages((prevMessages) => [...prevMessages, data]);

      // Handle session creation
      if (data.event === "session_created") {
        setSessionId(data.session_id);
        setPlayerId(data.player_id);
      }

      // Handle joining a session
      if (data.event === "session_joined") {
        setSessionId(data.session_id);
        setPlayerId(data.player_id);
      }
    };

    socket.onerror = (error) => {
      console.error("❌ WebSocket Error:", error);
    };

    socket.onclose = () => {
      console.log("❌ WebSocket disconnected");
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [url]);

  /**
   * Send a JSON message to the WebSocket server.
   * @param {Object} message - The message object to send.
   */
  const sendMessage = (message) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not open.");
    }
  };

  /**
   * Create a new game session.
   * @param {string} playerName - Name of the player creating the session.
   */
  const createSession = (playerName) => {
    sendMessage({ action: "create_session", player_name: playerName });
  };

  /**
   * Join an existing game session.
   * @param {string} sessionId - The session ID to join.
   * @param {string} playerName - The name of the joining player.
   */
  const joinSession = (sessionId, playerName) => {
    sendMessage({ action: "join_session", session_id: sessionId, player_name: playerName });
  };

  /**
   * Submit a snippet for voting.
   * @param {string} snippet - The text snippet to submit.
   */
  const submitSnippet = (snippet) => {
    if (!sessionId) {
      console.warn("❌ You are not in a session.");
      return;
    }
    sendMessage({ action: "submit_snippet", snippet });
  };

  /**
   * Submit votes for snippets.
   * @param {Array} votes - An array of player IDs being voted for.
   */
  const submitVotes = (votes) => {
    if (!sessionId) {
      console.warn("You are not in a session.");
      return;
    }
    sendMessage({ action: "submit_votes", voter_id: playerId, votes });
  };

  return { messages, sendMessage, createSession, joinSession, submitSnippet, submitVotes, sessionId, playerId };
};

export default useWebSocket;