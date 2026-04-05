import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Route, MapPin, Navigation } from "lucide-react";
import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix leaflet marker icons
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const API = "http://127.0.0.1:5000";

const locations = [
  "Ameerpet", "Hitech City", "Madhapur", "Kukatpally", "Gachibowli", "Begumpet",
  "Punjagutta", "Banjara Hills", "Jubilee Hills", "Secunderabad", "Dilsukhnagar",
  "LB Nagar", "Uppal", "Nagole", "Mehdipatnam", "Tolichowki", "Charminar",
  "Falaknuma", "Shamshabad", "Financial District", "Narsingi", "Manikonda",
  "Kondapur", "Miyapur", "Chandanagar", "Serilingampally",
];

function FitBounds({ route }: { route: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (route.length > 0) map.fitBounds(route as L.LatLngBoundsExpression, { padding: [50, 50], maxZoom: 14 });
  }, [route, map]);
  return null;
}

export default function RouteFinder() {
  const [source, setSource] = useState("Ameerpet");
  const [destination, setDestination] = useState("Hitech City");
  const [routeFast, setRouteFast] = useState<[number, number][]>([]);
  const [routeTraffic, setRouteTraffic] = useState<[number, number][]>([]);
  const [start, setStart] = useState<[number, number] | null>(null);
  const [end, setEnd] = useState<[number, number] | null>(null);
  const [fastDist, setFastDist] = useState("");
  const [trafficDist, setTrafficDist] = useState("");
  const [loading, setLoading] = useState(false);

  const findRoute = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/route`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, destination }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setRouteFast(data.route_fast); setRouteTraffic(data.route_traffic);
        setStart(data.start); setEnd(data.end);
        setFastDist(data.fast_distance); setTrafficDist(data.traffic_distance);
      } else alert("Error: " + data.message);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="inline-flex items-center gap-2 bg-warning/10 text-warning px-3 py-1 rounded-full text-xs font-medium mb-2">
          <Route className="w-3.5 h-3.5" /> Route Module
        </div>
        <h1 className="text-2xl font-bold text-foreground">Smart Route Finder</h1>
        <p className="text-sm text-muted-foreground mt-1">Find optimal routes with traffic-aware navigation</p>
      </motion.div>

      {/* Controls */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
            <MapPin className="w-3 h-3 inline mr-1" />Source
          </label>
          <select value={source} onChange={(e) => setSource(e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
            {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </div>
        <div className="glass-card p-4">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
            <Navigation className="w-3 h-3 inline mr-1" />Destination
          </label>
          <select value={destination} onChange={(e) => setDestination(e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
            {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={findRoute} disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl gradient-primary text-primary-foreground font-medium text-sm glow-primary disabled:opacity-50">
            {loading ? "Finding..." : "Find Route"}
          </button>
        </div>
      </div>

      {/* Route info */}
      {fastDist && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-4">
          <div className="glass-card p-4 border-l-4 border-l-primary">
            <p className="text-xs text-muted-foreground mb-1">🔵 Fastest Route</p>
            <p className="text-xl font-bold text-primary">{fastDist} km</p>
          </div>
          <div className="glass-card p-4 border-l-4 border-l-destructive">
            <p className="text-xs text-muted-foreground mb-1">🔴 Less Traffic Route</p>
            <p className="text-xl font-bold text-destructive">{trafficDist} km</p>
          </div>
        </motion.div>
      )}

      {/* Map */}
      <div className="glass-card overflow-hidden" style={{ height: "500px" }}>
        <MapContainer center={[17.385, 78.4867]} zoom={11} minZoom={10} maxZoom={16} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://carto.com/">CARTO</a>' />
          {routeFast.length > 0 && <Polyline positions={routeFast} color="hsl(199, 89%, 48%)" weight={4} />}
          {routeTraffic.length > 0 && <Polyline positions={routeTraffic} color="hsl(0, 84%, 60%)" weight={4} dashArray="10 6" />}
          {routeFast.length > 0 && <FitBounds route={routeFast} />}
          {start && <Marker position={start} />}
          {end && <Marker position={end} />}
        </MapContainer>
      </div>
    </div>
  );
}
