"""
TrafficIQ - Combined Backend Server
Runs all services on a single Flask instance (port 5000)
"""
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import wikipedia


app = Flask(__name__)
CORS(app)


# ============================================================
# Import all route handlers from individual modules
# ============================================================

# --- Vehicle Detection ---
from vehicle_detection_server import (
    upload_video, video_feed, stop_video, resume_video,
    seek_video, stats, upload_image
)
app.add_url_rule("/upload_video", view_func=upload_video, methods=["POST"])
app.add_url_rule("/video_feed", view_func=video_feed)
app.add_url_rule("/stop_video", view_func=stop_video, methods=["POST"])
app.add_url_rule("/resume_video", view_func=resume_video, methods=["POST"])
app.add_url_rule("/seek_video", view_func=seek_video, methods=["POST"])
app.add_url_rule("/stats", view_func=stats)
app.add_url_rule("/upload_image", view_func=upload_image, methods=["POST"])

# --- Signal Controller ---
from signal_controller_server import analyze
app.add_url_rule("/analyze", view_func=analyze, methods=["POST"])

# --- Route Finder ---
from route_finder_server import get_route
app.add_url_rule("/route", view_func=get_route, methods=["POST"])

# --- Weather Alerts ---
from weather_alerts_server import get_weather
app.add_url_rule("/weather", view_func=get_weather, methods=["GET"])


@app.route("/health")
def health():
    return jsonify({"status": "ok", "service": "TrafficIQ Backend"})

import wikipedia

def improve_query(user_input):
    text = user_input.lower()

    # 🧠 Convert question into proper search
    if "what should i do" in text or "what to do" in text:
        return text.replace("what should i do", "").replace("what to do", "") + " rule"

    if "when i see" in text:
        return text.replace("when i see", "") + " traffic meaning"

    if "how to" in text:
        return text + " guide"

    if "rules" in text or "traffic" in text:
        return text + " traffic rules"

    return text



if __name__ == "__main__":
    print("🚦 TrafficIQ Backend starting on http://127.0.0.1:5000")
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)
