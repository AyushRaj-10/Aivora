class StateTracker:
    def __init__(self):
        self.history = []

    def get_context(self):
        if not self.history:
            return "No previous context."
        return f"Previous emotion was {self.history[-1].get('emotion')}."

    def update(self, norm):
        self.history.append(norm)
