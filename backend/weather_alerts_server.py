from flask import request, jsonify
import requests

def get_weather():
    city = request.args.get('city')

    # ✅ Fix 1: handle empty city
    if not city:
        return jsonify({"error": "City is required"}), 400

    try:
        geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={city}"
        geo_res = requests.get(geo_url, timeout=5).json()

        if "results" not in geo_res:
            return jsonify({"error": "City not found"}), 404

        lat = geo_res['results'][0]['latitude']
        lon = geo_res['results'][0]['longitude']

        weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
        weather_res = requests.get(weather_url, timeout=5).json()

        if "current_weather" not in weather_res:
            return jsonify({
                "city": city,
                "temperature": 0,
                "windspeed": 0,
                "alert": "⚠️ Weather unavailable"
            })

        weather = weather_res['current_weather']

        alert = "🟢 Normal traffic"
        if weather.get('weathercode') in [61, 63, 65]:
            alert = "🌧️ Rain detected — traffic may be slow"
        elif weather.get('windspeed', 0) > 20:
            alert = "💨 High wind — drive carefully"

        return jsonify({
            "city": city,
            "temperature": weather.get('temperature', 0),
            "windspeed": weather.get('windspeed', 0),
            "alert": alert
        })

    except Exception as e:
        return jsonify({
            "city": city,
            "temperature": 0,
            "windspeed": 0,
            "alert": "⚠️ Server error"
        })
