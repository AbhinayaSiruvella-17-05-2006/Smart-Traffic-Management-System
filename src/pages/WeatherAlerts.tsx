import { useState } from "react";
import { motion } from "framer-motion";
import { CloudSun, Search, Thermometer, Wind, AlertTriangle } from "lucide-react";

const API = "https://traffic-backend-svv7.onrender.com";

interface WeatherData { city: string; temperature: number; windspeed: number; alert: string; }
interface CitySuggestion { name: string; country: string; latitude: number; longitude: number; }

export default function WeatherAlerts() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [selectedCity, setSelectedCity] = useState<CitySuggestion | null>(null);
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCities = async (value: string) => {
    setQuery(value);
    if (value.length < 2) { setSuggestions([]); return; }
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${value}`);
      const result = await res.json();
      if (result.results) setSuggestions(result.results.slice(0, 5));
    } catch {}
  };

  const selectCity = (city: CitySuggestion) => { setSelectedCity(city); setQuery(city.name); setSuggestions([]); };

  const handleSearch = async () => {
    if (!selectedCity) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/weather?city=${selectedCity.name}`);
      setData(await res.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const getAlertColor = (alert: string) => {
    if (alert.includes("Rain")) return "text-primary";
    if (alert.includes("wind")) return "text-warning";
    return "text-accent";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium mb-2">
          <CloudSun className="w-3.5 h-3.5" /> Weather Module
        </div>
        <h1 className="text-2xl font-bold text-foreground">Weather Traffic Alerts</h1>
        <p className="text-sm text-muted-foreground mt-1">Check weather conditions that may impact traffic</p>
      </motion.div>

      {/* Search */}
      <div className="glass-card p-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={query} onChange={(e) => fetchCities(e.target.value)} placeholder="Search city..."
              className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 glass-card border border-border rounded-lg overflow-hidden z-10">
                {suggestions.map((city, i) => (
                  <button key={i} onClick={() => selectCity(city)}
                    className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-secondary/60 transition-colors border-b border-border last:border-0">
                    {city.name}, {city.country}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleSearch} disabled={!selectedCity || loading}
            className="px-6 rounded-xl gradient-primary text-primary-foreground font-medium text-sm glow-primary disabled:opacity-50">
            {loading ? "..." : "Search"}
          </button>
        </div>
      </div>

      {/* Results */}
      {data && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="glass-card p-6 text-center">
            <h2 className="text-xl font-bold text-foreground mb-4">{data.city}</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="stat-card flex flex-col items-center gap-2">
                <Thermometer className="w-6 h-6 text-primary" />
                <p className="text-3xl font-bold text-foreground">{data.temperature}°C</p>
                <p className="text-xs text-muted-foreground">Temperature</p>
              </div>
              <div className="stat-card flex flex-col items-center gap-2">
                <Wind className="w-6 h-6 text-primary" />
                <p className="text-3xl font-bold text-foreground">{data.windspeed}</p>
                <p className="text-xs text-muted-foreground">Wind (km/h)</p>
              </div>
            </div>
            <div className={`glass-card p-4 flex items-center justify-center gap-2 ${getAlertColor(data.alert)}`}>
              <AlertTriangle className="w-5 h-5" />
              <p className="text-sm font-semibold">{data.alert}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
