from flask import request, jsonify
import requests
def get_weather():
    city = request.args.get('city')
    geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={city}"
    geo_res = requests.get(geo_url).json()

    if "results" not in geo_res:
        return jsonify({"error": "City not found"}), 404

    lat = geo_res['results'][0]['latitude']
    lon = geo_res['results'][0]['longitude']

    weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
    weather_res = requests.get(weather_url).json()

    weather = weather_res['current_weather']

    alert = "🟢 Normal traffic"
    if weather['weathercode'] in [61, 63, 65]:
        alert = "🌧️ Rain detected — traffic may be slow"
    elif weather['windspeed'] > 20:
        alert = "💨 High wind — drive carefully"

    return jsonify({
        "city": city,
        "temperature": weather['temperature'],
        "windspeed": weather['windspeed'],
        "alert": alert
    })

