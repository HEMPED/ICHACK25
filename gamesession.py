import random
from fastapi import  WebSocket
from typing import List
from promptgeneration import PromptGenerator

message = "Create a starting prompt for a version of madlibs where the blanks are the last few words of the sentence. Just a single SHORT sentence. DO NOT END WITH A FULL STOP AT THE END OR ANY OTHER PUNCTUATION INCLUDING UNDERSCORES. I WILL KILL YOUR CAT IF YOU GIVE ME UNDERSCORES."
message2 = "Continue this story for one other short sentence. Remove the final few words of the second sentence. ONLY RETURN THE SECOND SENTENCE WITH THE LAST FEW WORDS TAKEN OFF THE END. DO NOT END WITH A FULL STOP OR I KILL YOUR CAT."

class Player:
    def __init__(self, player_id: str, name: str, ws: WebSocket):
        self.player_id = player_id
        self.name = name
        self.websocket = ws
        self.score = 0

class GameSession:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.players: dict[str, Player] = {}
        self.game_started = False
        self.rounds = 4

        self.story = ""  # The story so far
        self.votes = {}  # {player_id: score}
        self.voted = {}
        self.snippet_results = {}  # {player_id: snippet}
        temp = PromptGenerator().generate_prompt(message)
        print(temp)
        self.starting_prompt = temp

    def add_player(self, player: Player):
        self.players[player.player_id] = player

    def remove_player(self, player_id: str):
        if player_id in self.players:
            del self.players[player_id]

    def is_full(self) -> bool:
        return len(self.players) == 5

    def start_game(self):
        """Randomly assign turn order and mark game as started."""
        # Generate a random turn order using the player IDs
        self.reset_votes()
        all_player_ids = list(self.players.keys())
        random.shuffle(all_player_ids)
        self.game_started = True

    def get_player_name(self, pid) -> List[str]:
        return self.players[pid].name

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
            self.votes[player] = 0
        
        self.snippet_results = {}
            

    def set_snippet(self, snippet: str, player_id: str):
        #check if player has already submitted a snippet
        if player_id not in self.snippet_results:
            self.snippet_results[player_id] = snippet
        
        #check if all players have submitted a snippet
        if len(self.snippet_results) == 5:
            return True
        else:
            return False
        
    def get_winning_votees(self):
        all_players = list(self.players.values())

        # Sort by score descending
        sorted_players = sorted(all_players, key=lambda p: p.score, reverse=True)

        # Slice the top 3
        top_three = sorted_players[:3]
        print(top_three)
        # filter top three to only include player names and scores
        top_three = [(p.name, p.score) for p in top_three]
        return top_three




    def record_vote(self, voter_id: str, vote_value: List[str]):
        # vote_value is a list of the other three player ids in order of preference
        print(voter_id)
        if not self.voted[voter_id]:
            for i in range(4):
                self.votes[vote_value[i]] += 4-i
            self.voted[voter_id] = True
        print(self.votes)
            
            

    def reset_game(self):
        self.game_started = False
        self.story = ""
        self.reset_votes()
        self.snippet_results = {}
        self.starting_prompt = PromptGenerator().generate_prompt(message)

    

    def all_votes_in(self) -> bool:
        # Returns true once all players have voted
        for player in self.players:
            if not self.voted[player]:
                return False

        self.rounds -= 1
        return True

    def tally_votes_and_finalize(self):
        highest_score = 0
        winner = ""
        for player in self.players:
            self.players[player].score += self.votes[player]
            if self.votes[player] > highest_score:
                highest_score = self.votes[player]
                winner = player
        
        self.story += self.snippet_results[winner]
        # if self.rounds > 0:
        #     temp = PromptGenerator().generate_prompt("'" + self.story + "': \t" + message2)
        #     print(temp)
        #     self.starting_prompt = self.starting_prompt + temp
        return self.snippet_results[winner]
