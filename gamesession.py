class GameSession:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.players: Dict[str, Player] = {}
        self.game_started = False
        self.turn_order: List[str] = []
        self.current_turn_index = 0

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

class Player:
    def __init__(self, player_id: str, name: str, ws: WebSocket):
        self.player_id = player_id
        self.name = name
        self.websocket = ws

