from flask import request, jsonify
import cv2
import numpy as np



model =None
def get_model():
    global model
    if model is None:
        from ultralytics import YOLO
        model=YOLO("yolov8n.pt")
    return model

VEHICLE_CLASSES = [2, 3, 5, 7]

def count_vehicles(file):
    try:
        file_bytes = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        if img is None:
            return 0
        results = get_model()(img)[0]
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

