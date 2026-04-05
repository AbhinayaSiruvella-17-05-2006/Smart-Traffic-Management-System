from flask import Flask, request, jsonify
from flask_cors import CORS
import osmnx as ox
import networkx as nx
import random

app = Flask(__name__)
CORS(app)

print("Loading Hyderabad map... ⏳")
G = ox.graph_from_place("Hyderabad, India", network_type='drive')
print("Map loaded ✅")

for u, v, key, data in G.edges(keys=True, data=True):
    traffic = random.randint(1, 5)
    data['weight'] = data['length'] * traffic


@app.route("/route", methods=["POST"])
def get_route():
    data = request.json
    source = data.get("source")
    destination = data.get("destination")

    try:
        orig = ox.geocode(source + ", Hyderabad, India")
        dest = ox.geocode(destination + ", Hyderabad, India")

        orig_node = ox.distance.nearest_nodes(G, orig[1], orig[0])
        dest_node = ox.distance.nearest_nodes(G, dest[1], dest[0])

        route_fast = nx.shortest_path(G, orig_node, dest_node, weight='length')
        route_traffic = nx.shortest_path(G, orig_node, dest_node, weight='weight')

        def get_coords(route):
            return [(G.nodes[n]['y'], G.nodes[n]['x']) for n in route]

        def get_distance(route):
            total = 0
            for u, v in zip(route[:-1], route[1:]):
                edge = list(G.get_edge_data(u, v).values())[0]
                total += edge.get("length", 0)
            return round(total / 1000, 2)

        return jsonify({
            "status": "success",
            "route_fast": get_coords(route_fast),
            "route_traffic": get_coords(route_traffic),
            "fast_distance": get_distance(route_fast),
            "traffic_distance": get_distance(route_traffic),
            "start": orig,
            "end": dest
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})


if __name__ == "__main__":
    app.run(debug=False)
