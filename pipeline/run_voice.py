import json
from normalizer import normalize_line
from context.state_tracker import StateTracker
from llm.director import direct_line
from formatter.voice_param_mapper import map_voice_params
from tts.tts_router import route_tts

def run(scene_file):
    with open(scene_file) as f:
        scene = json.load(f)

    tracker = StateTracker()

    for i, line in enumerate(scene["lines"]):
        print(f"\nLine {i+1}")

        norm = normalize_line(line)
        context = tracker.get_context()

        directed = direct_line(norm, context)
        print("Directed:", directed)

        params = map_voice_params(norm["emotion"], norm["intensity"])

        filename = f"output/output_line_{i}.wav"
        route_tts(directed, params, filename)

        tracker.update(norm)

    print("\nDone!")

if __name__ == "__main__":
    run("scene.json")