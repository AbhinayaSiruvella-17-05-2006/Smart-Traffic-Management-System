from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

# 🔹 Convert place name → coordinates
def geocode(place):
    url = f"https://nominatim.openstreetmap.org/search?q={place}, Hyderabad, India&format=json"
    res = requests.get(url, headers={"User-Agent": "traffic-app"}).json()

    if len(res) == 0:
        raise Exception(f"Location not found: {place}")

    return float(res[0]["lat"]), float(res[0]["lon"])


@app.route("/route", methods=["POST"])
def get_route():
    data = request.json
    source = data.get("source")
    destination = data.get("destination")

    try:
        # 🔹 Get coordinates
        src_lat, src_lon = geocode(source)
        dst_lat, dst_lon = geocode(destination)

        # 🔹 Fastest route
        url_fast = f"http://router.project-osrm.org/route/v1/driving/{src_lon},{src_lat};{dst_lon},{dst_lat}?overview=full&geometries=geojson"

        # 🔹 Alternative route (for "traffic")
        url_alt = f"http://router.project-osrm.org/route/v1/driving/{src_lon},{src_lat};{dst_lon},{dst_lat}?alternatives=true&overview=full&geometries=geojson"

        res_fast = requests.get(url_fast).json()
        res_alt = requests.get(url_alt).json()

        # 🔹 Extract routes
        route1 = res_fast["routes"][0]

        if len(res_alt["routes"]) > 1:
            route2 = res_alt["routes"][1]
        else:
            route2 = route1  # fallback if no alternative

        # 🔹 Convert coordinates (lon,lat → lat,lon)
        coords1 = [(lat, lon) for lon, lat in route1["geometry"]["coordinates"]]
        coords2 = [(lat, lon) for lon, lat in route2["geometry"]["coordinates"]]

        return jsonify({
            "status": "success",
            "route_fast": coords1,
            "route_traffic": coords2,
            "fast_distance": round(route1["distance"] / 1000, 2),
            "traffic_distance": round(route2["distance"] / 1000, 2),
            "start": [src_lat, src_lon],
            "end": [dst_lat, dst_lon]
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        })


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


