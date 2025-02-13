import uuid
import random
from typing import Dict, List
from gamesession import GameSession, Player
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from promptgeneration import PromptGenerator

from comicmaker import make_2x2_collage, generate_comic_story

app = FastAPI()

# -----------------------------------------------------------
# IN-MEMORY STORE
# -----------------------------------------------------------

sessions: Dict[str, GameSession] = {}

# -----------------------------------------------------------
# WEBSOCKET COMMUNICATION
# -----------------------------------------------------------

session_keys = sessions.keys()

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
                #generate random 5 letter string made of only letters
                session_id = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ', k=5))
                while session_id in session_keys:
                    session_id = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ', k=5))
                session_id = session_id
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


                player = Player(player_id, player_name, websocket)
                
                joined_session_id = session_id

                await broadcast_to_session(session, {
                    "event": "player_joined",
                    "player_id": player_id,
                    "player_name": player_name,
                    "existing_players": [{"player_id": p.player_id, "player_name": p.name} for p in session.players.values()]
                })

                await websocket.send_json({
                    "event": "session_joined",
                    "session_id": session_id,
                    "player_id": player_id,
                    "player_name": player_name,
                    "message": f"Joined session {session_id} as {player_id}",
                    "existing_players": [{"player_id": p.player_id, "player_name": p.name} for p in session.players.values()]
                })

                session.add_player(player)
                print("Player joined session", session_id)

                # Check if session is full => start the game
                if session.is_full() and not session.game_started:
                    session.start_game()
                    await broadcast_to_session(session, {
                        "event": "game_started",
                        "session_id": session.session_id,
                        "starting_prompt": session.starting_prompt
                    })

            elif action == "get_existing_players":
                await websocket.send_json({
                    "event": "existing_sessions",
                    "players": [{"player_id": p.player_id, "player_name": p.name} for p in session.players.values()]
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

                snippet_text = data.get("snippet", "")
                if not snippet_text:
                    await websocket.send_json({
                        "event": "error",
                        "error": "Snippet text is empty."
                    })
                    continue

                # Store the snippet in session
                all_snippets_in = session.set_snippet(snippet_text, player_id)

                await websocket.send_json({
                    "event": "snippet_submitted",
                    "message": "Snippet submitted successfully."
                })

                if all_snippets_in:
                    # Broadcast snippet to everyone
                    await broadcast_to_session(session, {
                        "event": "all_snippets_submitted",
                        "snippets": session.snippet_results
                    })

            elif action == "get_player_id":
                await websocket.send_json({
                    "event": "player_id",
                    "player_id": player_id
                })


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
                session.record_vote(player_id, data.get("votes"))

                # Optionally broadcast "vote_received"
                await broadcast_to_session(session, {
                    "event": "vote_received",
                    "voter_id": player_id,
                    "vote_value": data.get("votes")
                })

                # Check if all players have voted
                if session.all_votes_in():
                    winning_snippet = session.tally_votes_and_finalize()
                    
                    # Broadcast final results for this snippet
                    await broadcast_to_session(session, {
                        "event": "votes_finalized",
                        "winning_snippet": winning_snippet
                    })

                    session.reset_votes()

                    if session.rounds == 0:
                        

                        await broadcast_to_session(session, {
                            "event": "game_over",
                            "message": "Game over!",
                        })

                        try:
                            make_2x2_collage(generate_comic_story(session.story))
                        except Exception as e:
                            print(f"Error: {e}")

                        





            elif action ==  "get_winning_votees":
                        winners = session.get_winning_votees()
                        await websocket.send_json({
                            "event": "winning_votees",
                            "winners": winners
                        })
                        session.reset_game()


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
