import random
from fastapi import  WebSocket
from typing import List

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

        self.story = ""  # The story so far
        self.votes = {}  # {player_id: score}
        self.voted = {}
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
        self.reset_votes()
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

    def reset_votes(self):
        for player in self.players:
            self.voted[player] = False
        self.votes = {}

    #TODO: acc implement proper voting system
    def record_vote(self, voter_id: str, vote_value: List[str]):
        # vote_value is a list of the other three player ids in order of preference
        if not self.voted[voter_id]:
            for i in range(3):
                self.votes[vote_value[i]] += 4-i
            self.voted[voter_id] = True
            

    def all_votes_in(self) -> bool:
        # Returns true once all players have voted
        for player in self.players:
            if not self.voted[player]:
                return False

        return True

    def tally_votes_and_finalize(self):
        highest_score = 0
        winner = ""
        for player in self.players:
            if self.votes[player] > highest_score:
                highest_score = self.votes[player]
                winner = player
        
        return winner

