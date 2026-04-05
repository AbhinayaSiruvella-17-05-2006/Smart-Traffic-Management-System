from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
from ultralytics import YOLO
import numpy as np

app = Flask(__name__)
CORS(app)

model = YOLO("yolov8n.pt")

VEHICLE_CLASSES = [2, 3, 5, 7]

def count_vehicles(file):
    try:
        file_bytes = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        if img is None:
            return 0
        results = model(img)[0]
        count = 0
        for box in results.boxes:
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            if cls in VEHICLE_CLASSES and conf > 0.4:
                count += 1
        return count
    except Exception as e:
        print(f"Error processing image: {e}")
        return 0

@app.route("/analyze", methods=["POST"])
def analyze():
    directions = ["north", "south", "east", "west"]
    raw_counts = {}

    for d in directions:
        file = request.files.get(d)
        if not file:
            return jsonify({"error": f"Image for {d} is missing"}), 400
        raw_counts[d.upper()] = count_vehicles(file)

    sorted_roads = sorted(raw_counts.items(), key=lambda x: x[1], reverse=True)

    sequence = []
    for road, count in sorted_roads:
        allocated_time = max(5, min(30, 5 + (count * 2)))
        sequence.append({"road": road, "time": allocated_time})

    return jsonify({
        "raw_counts": raw_counts,
        "sequence": sequence
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
