from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import cv2
from ultralytics import YOLO
import os
import numpy as np
import base64
import json
import threading
import time

app = Flask(__name__)
CORS(app)

# MODEL
model = None

def get_model():
    global model
    if model is None:
        from ultralytics import YOLO
        model = YOLO("yolov8n.pt")
    return model

VEHICLE_MAP = {
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck"
}






# GLOBAL STATE
counted_ids = set()
track_history = {}
vehicle_counts = {"car": 0, "motorcycle": 0, "bus": 0, "truck": 0}

# Video control state
video_playing = True
video_stopped = False
video_lock = threading.Lock()
video_duration = 0
video_current_frame = 0
video_total_frames = 0
video_fps = 30
video_finished = False
seek_to_position = -1


def reset_all():
    global counted_ids, track_history, vehicle_counts, video_playing, video_stopped
    global video_finished, video_current_frame, seek_to_position
    counted_ids = set()
    track_history = {}
    vehicle_counts = {k: 0 for k in vehicle_counts}
    video_playing = True
    video_stopped = False
    video_finished = False
    video_current_frame = 0
    seek_to_position = -1


@app.route("/upload_video", methods=["POST"])
def upload_video():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file"}), 400

    reset_all()
    import tempfile

    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
    file.save(temp_file.name)
    global video_path
    video_path = temp_file.name

    global video_duration, video_total_frames, video_fps
    cap = cv2.VideoCapture(video_path)
    video_fps = cap.get(cv2.CAP_PROP_FPS) or 30
    video_total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    video_duration = video_total_frames / video_fps if video_fps > 0 else 0
    cap.release()

    return jsonify({"message": "Uploaded", "duration": video_duration})


def generate_frames():
    global video_playing, video_stopped, video_current_frame, video_finished, seek_to_position

    if not os.path.exists(video_path):
        return

    cap = cv2.VideoCapture(video_path)
    frame_count = 0
    skip = 3

    while cap.isOpened():
        with video_lock:
            if seek_to_position >= 0:
                target_frame = int(seek_to_position * video_total_frames)
                cap.set(cv2.CAP_PROP_POS_FRAMES, target_frame)
                frame_count = target_frame
                seek_to_position = -1
                counted_ids.clear()
                track_history.clear()
                for k in vehicle_counts:
                    vehicle_counts[k] = 0

        if not video_playing:
            time.sleep(0.05)
            continue

        if video_stopped:
            break

        success, frame = cap.read()
        if not success:
            video_finished = True
            break

        frame_count += 1
        video_current_frame = frame_count

        if frame_count % skip != 0:
            continue

        frame = cv2.resize(frame, (640, 360))

        results = get_model().track(
            frame,
            persist=True,
            imgsz=640,
            conf=0.4,
            tracker="bytetrack.yaml",
            verbose=False
        )

        for r in results:
            boxes = r.boxes
            if boxes is None:
                continue

            for box in boxes:
                cls = int(box.cls[0])
                conf = float(box.conf[0])

                if box.id is None:
                    continue

                track_id = int(box.id[0])

                if cls in VEHICLE_MAP and conf > 0.4:
                    label = VEHICLE_MAP[cls]

                    if track_id not in track_history:
                        track_history[track_id] = []

                    track_history[track_id].append(label)

                    if len(track_history[track_id]) > 5:
                        track_history[track_id].pop(0)

                    if track_id not in counted_ids:
                        labels = track_history[track_id]
                        if labels.count(label) >= 3:
                            vehicle_counts[label] += 1
                            counted_ids.add(track_id)

                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    cv2.putText(frame, f"{label} {conf:.0%}", (x1, y1 - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

        y_offset = 30
        for key, value in vehicle_counts.items():
            if value > 0:
                cv2.putText(frame, f"{key}: {value}", (10, y_offset),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                y_offset += 30

        total = sum(vehicle_counts.values())
        if total > 0:
            cv2.putText(frame, f"Total: {total}", (10, y_offset + 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)

        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

    cap.release()
    

    try:
      if os.path.exists(video_path):
        os.remove(video_path)
    except:
         pass

@app.route("/video_feed")
def video_feed():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route("/stop_video", methods=["POST"])
def stop_video():
    global video_playing
    video_playing = False
    return jsonify({"status": "paused"})


@app.route("/resume_video", methods=["POST"])
def resume_video():
    global video_playing
    video_playing = True
    return jsonify({"status": "playing"})


@app.route("/seek_video", methods=["POST"])
def seek_video():
    global seek_to_position, video_playing
    data = request.get_json()
    position = data.get("position", 0)
    seek_to_position = max(0, min(1, position))
    video_playing = True
    return jsonify({"status": "seeking", "position": position})


@app.route("/stats")
def stats():
    progress = video_current_frame / video_total_frames if video_total_frames > 0 else 0
    current_time = video_current_frame / video_fps if video_fps > 0 else 0
    return jsonify({
        "counts": vehicle_counts,
        "progress": min(progress, 1.0),
        "current_time": current_time,
        "duration": video_duration,
        "finished": video_finished
    })


@app.route("/upload_image", methods=["POST"])
def upload_image():
    file = request.files.get("file")
    points = request.form.get("points")

    if not file:
        return jsonify({"error": "No file"}), 400

    file_bytes = np.frombuffer(file.read(), np.uint8)
    frame = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    try:
        if points:
            polygon = np.array(json.loads(points), dtype=np.int32)
        else:
            h, w = frame.shape[:2]
            polygon = np.array([[0, 0], [w, 0], [w, h], [0, h]], dtype=np.int32)
    except Exception:
        h, w = frame.shape[:2]
        polygon = np.array([[0, 0], [w, 0], [w, h], [0, h]], dtype=np.int32)

    results = get_model()(frame, imgsz=1280, conf=0.15, iou=0.5)[0]
    image_counts = {}

    cv2.polylines(frame, [polygon], True, (255, 0, 0), 2)
    overlay = frame.copy()
    cv2.fillPoly(overlay, [polygon], (255, 0, 0))
    frame = cv2.addWeighted(overlay, 0.1, frame, 0.9, 0)

    for box in results.boxes:
        cls = int(box.cls[0])
        conf = float(box.conf[0])

        if cls in VEHICLE_MAP and conf > 0.15:
            label = VEHICLE_MAP[cls]
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            cx = (x1 + x2) // 2
            cy = (y1 + y2) // 2

            inside = cv2.pointPolygonTest(polygon, (cx, cy), False)

            if inside >= 0:
                if label not in image_counts:
                    image_counts[label] = 0
                image_counts[label] += 1

                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(frame, f"{label} {conf:.0%}", (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

    _, buffer = cv2.imencode('.jpg', frame)
    img_base64 = base64.b64encode(buffer).decode("utf-8")

    return jsonify({
        "image": img_base64,
        "stats": image_counts
    })


