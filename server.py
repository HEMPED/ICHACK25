import uuid
import random
from typing import Dict, List
from gamesession import GameSession, Player
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

app = FastAPI()

# -----------------------------------------------------------
# IN-MEMORY STORE
# -----------------------------------------------------------

sessions: Dict[str, GameSession] = {}

# -----------------------------------------------------------
# WEBSOCKET COMMUNICATION
# -----------------------------------------------------------

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    A single /ws endpoint to handle:
      1) "create_session" requests
      2) "join_session" requests
      3) Broadcasting messages when session fills up (4 players) and starts
    """
    await websocket.accept()
    player_id = str(uuid.uuid4())  # A unique ID for this connection
    
    # We’ll keep track of which session_id a player joined.
    joined_session_id = None

    try:
        while True:
            # Expect the client to send us JSON with actions, e.g.:
            # {
            #   "action": "create_session" | "join_session" | "next_turn" | ...
            #   "session_id": "...", (for join_session only)
            #   "player_name": "someName" (optional)
            # }
            data = await websocket.receive_json()

            action = data.get("action")

            # 1. CREATE SESSION
            if action == "create_session":
                session_id = str(uuid.uuid4())
                new_session = GameSession(session_id)
                sessions[session_id] = new_session

                # Join immediately as the first player
                player_name = data.get("player_name", "Player")
                player = Player(player_id, player_name, websocket)
                new_session.add_player(player)
                joined_session_id = session_id

                await websocket.send_json({
                    "event": "session_created",
                    "session_id": session_id,
                    "player_id": player_id,
                    "message": f"New session {session_id} created, joined as {player_id}"
                })
                
            elif action == "join_session":
                session_id = data.get("session_id")
                player_name = data.get("player_name", "Player")

                if session_id not in sessions:
                    await websocket.send_json({
                        "event": "error",
                        "error": f"Session {session_id} does not exist."
                    })
                    continue

                session = sessions[session_id]

                if session.is_full():
                    # Session already has 4 players
                    await websocket.send_json({
                        "event": "error",
                        "error": f"Session {session_id} is already full."
                    })
                    continue

                # Add this player to the session
                player = Player(player_id, player_name, websocket)
                session.add_player(player)
                
                joined_session_id = session_id

                await websocket.send_json({
                    "event": "session_joined",
                    "session_id": session_id,
                    "player_id": player_id,
                    "message": f"Joined session {session_id} as {player_id}",
                    "existing_players": [{"player_id": p.player_id, "player_name": p.name} for p in session.players.values()]
                })

                await broadcast_to_session(session, {
                    "event": "player_joined",
                    "player_id": player_id,
                    "player_name": player_name
                })

                # Check if session is full => start the game
                if session.is_full() and not session.game_started:
                    session.start_game()
                    await broadcast_to_session(session, {
                        "event": "game_started",
                        "session_id": session.session_id,
                        "turn_order": session.turn_order,
                        "current_turn_player": session.get_current_player_id()
                    })


            # 3. (Optional) NEXT TURN (Example of how you might move the turn)
            elif action == "next_turn":
                if joined_session_id is None:
                    # Not in any session
                    await websocket.send_json({
                        "event": "error",
                        "error": "You are not in a session."
                    })
                    continue

                session = sessions[joined_session_id]
                if not session.game_started:
                    await websocket.send_json({
                        "event": "error",
                        "error": "Game has not started yet."
                    })
                    continue

                # Only let the current turn player call next_turn (or just skip checks in a quick prototype)
                if session.get_current_player_id() != player_id:
                    await websocket.send_json({
                        "event": "error",
                        "error": "It is not your turn."
                    })
                    continue

                # Move to the next turn
                session.next_turn()
                await broadcast_to_session(session, {
                    "event": "turn_updated",
                    "session_id": session.session_id,
                    "current_turn_player": session.get_current_player_id(),
                    "start_prompt": generate_prompt()
                })

            # 4. SUBMIT_SNIPPET
            elif action == "submit_snippet":
                # Expect: { "action": "submit_snippet", "snippet": "some text" }
                if joined_session_id is None:
                    await websocket.send_json({
                        "event": "error",
                        "error": "You are not in a session."
                    })
                    continue

                session = sessions[joined_session_id]

                # Check if it's the current turn player's snippet
                if session.get_current_player_id() != player_id:
                    await websocket.send_json({
                        "event": "error",
                        "error": "It is not your turn to submit a snippet."
                    })
                    continue

                snippet_text = data.get("snippet", "")
                if not snippet_text:
                    await websocket.send_json({
                        "event": "error",
                        "error": "Snippet text is empty."
                    })
                    continue

                # Store the snippet in session
                session.set_snippet(snippet_text, player_id)

                # Broadcast snippet to everyone
                await broadcast_to_session(session, {
                    "event": "snippet_submitted",
                    "player_id": player_id,
                    "snippet_text": snippet_text
                })

                # Now, the other players can vote. We might not move the turn yet;
                # we wait for "submit_vote" from each player.

            # 5. SUBMIT_VOTE
            elif action == "submit_votes":
                # Expect: { "action": "submit_vote", voter_id: "some_id", votes: ["id", "id", "id"] }
                if joined_session_id is None:
                    await websocket.send_json({
                        "event": "error",
                        "error": "You are not in a session."
                    })
                    continue

                session = sessions[joined_session_id]

                # Record the vote
                session.record_vote(data.get("voter_id", data.get("votes")))

                # Optionally broadcast "vote_received"
                await broadcast_to_session(session, {
                    "event": "vote_received",
                    "voter_id": player_id,
                    "vote_value": vote_value
                })

                # Check if all players have voted
                if session.all_votes_in():
                    tally = session.tally_votes_and_finalize()
                    
                    # Broadcast final results for this snippet
                    await broadcast_to_session(session, {
                        "event": "votes_finalized",
                        "snippet_player_id": session.current_snippet["player_id"],
                        "snippet_text": session.current_snippet["text"],
                        "tally": tally
                    })

                    # In many games, after finalizing votes, we move to the next turn:
                    session.next_turn()
                    await broadcast_to_session(session, {
                        "event": "turn_updated",
                        "session_id": session.session_id,
                        "current_turn_player": session.get_current_player_id()
                    })

            else:
                # Unrecognized action
                await websocket.send_json({
                    "event": "error",
                    "error": "Unrecognized action"
                })

            

    except WebSocketDisconnect:
        # Handle disconnect — remove player from session, etc.
        if joined_session_id and joined_session_id in sessions:
            session = sessions[joined_session_id]
            session.remove_player(player_id)
            # If the session is now empty, optionally remove it from 'sessions'
            if len(session.players) == 0:
                del sessions[joined_session_id]
        # Connection closed, so we can’t send any more messages to this websocket.
    except Exception as e:
        # For debugging
        print(f"Error: {e}")
        # Same cleanup logic for removing player
        if joined_session_id and joined_session_id in sessions:
            session = sessions[joined_session_id]
            session.remove_player(player_id)
            if len(session.players) == 0:
                del sessions[joined_session_id]


async def broadcast_to_session(session: GameSession, message: dict):
    """
    Send a JSON message to all players in a given session.
    """
    for p in session.players.values():
        try:
            await p.websocket.send_json(message)
        except:
            # Ignore send errors for a disconnected client
            pass
