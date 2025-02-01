import random
from fastapi import  WebSocket

class Player:
    def __init__(self, player_id: str, name: str, ws: WebSocket):
        self.player_id = player_id
        self.name = name
        self.websocket = ws

class GameSession:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.players: dict[str, Player] = {}
        self.game_started = False
        self.turn_order: list[str] = []
        self.current_turn_index = 0

        self.story = ""  # The story so far
        self.votes = {}  # {player_id: "good"/"bad"/"neutral"}
        self.snippet_results = []  # store results of past snippets if needed

    def add_player(self, player: Player):
        self.players[player.player_id] = player

    def remove_player(self, player_id: str):
        if player_id in self.players:
            del self.players[player_id]

    def is_full(self) -> bool:
        return len(self.players) == 4

    def start_game(self):
        """Randomly assign turn order and mark game as started."""
        # Generate a random turn order using the player IDs
        all_player_ids = list(self.players.keys())
        random.shuffle(all_player_ids)
        self.turn_order = all_player_ids
        self.game_started = True
        self.current_turn_index = 0

    def get_current_player_id(self) -> str:
        return self.turn_order[self.current_turn_index] if self.game_started else ""

    def next_turn(self):
        if self.game_started:
            self.current_turn_index = (self.current_turn_index + 1) % len(self.turn_order)


    def add_to_story(self, snippet: str):
        self.story += snippet

    #TODO: acc implement proper voting system
    def record_vote(self, voter_id: str, vote_value: str):
        # Save the vote
        self.votes[voter_id] = vote_value

    def all_votes_in(self) -> bool:
        # Example condition: all players have voted, or all except the snippet’s author
        # For simplicity, require all 4 players. 
        # If you only want the *other* 3 players, you'd do len(votes) == 3.
        return len(self.votes) == len(self.players)

    def tally_votes_and_finalize(self):
        # For example, finalize the snippet round
        # Tally how many "good", "bad", "neutral" you got
        good_count = sum(1 for v in self.votes.values() if v == "good")
        bad_count = sum(1 for v in self.votes.values() if v == "bad")
        neutral_count = sum(1 for v in self.votes.values() if v == "neutral")
        
        # Save the snippet + votes to snippet_results if you want
        self.snippet_results.append({
            "snippet": self.current_snippet,
            "votes": self.votes,
            "summary": {
                "good": good_count,
                "bad": bad_count,
                "neutral": neutral_count
            }
        })
        
        # Return the tally so we can broadcast results
        return {
            "good": good_count,
            "bad": bad_count,
            "neutral": neutral_count
        }


