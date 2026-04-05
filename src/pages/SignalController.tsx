import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrafficCone, Upload, Play, Pause, Square, RotateCcw } from "lucide-react";

const API = "https://traffic-backend-svv7.onrender.com";
const directions = ["NORTH", "SOUTH", "EAST", "WEST"] as const;

interface SequenceItem { road: string; time: number; }
interface AnalysisResult { raw_counts: Record<string, number>; sequence: SequenceItem[]; }

export default function SignalController() {
  const [images, setImages] = useState<Record<string, File>>({});
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [timer, setTimer] = useState(0);
  const [status, setStatus] = useState<"idle" | "running" | "paused" | "finished">("idle");
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    const formData = new FormData();
    for (const d of directions) {
      const f = images[d.toLowerCase()];
      if (!f) return alert(`Upload image for ${d}`);
      formData.append(d.toLowerCase(), f);
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/analyze`, { method: "POST", body: formData });
      const data: AnalysisResult = await res.json();
      setResults(data); setCurrentStep(0); setTimer(data.sequence[0].time); setStatus("running");
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (status !== "running" || timer <= 0) {
      if (status === "running" && timer === 0 && results) {
        if (currentStep < 3) { const next = currentStep + 1; setCurrentStep(next); setTimer(results.sequence[next].time); }
        else setStatus("finished");
      }
      return;
    }
    const interval = setInterval(() => setTimer((p) => p - 1), 1000);
    return () => clearInterval(interval);
  }, [status, timer, currentStep, results]);

  const currentGreenRoad = status !== "idle" && results ? results.sequence[currentStep].road : null;

  const getDirectionEmoji = (dir: string) => {
    const map: Record<string, string> = { NORTH: "⬆️", SOUTH: "⬇️", EAST: "➡️", WEST: "⬅️" };
    return map[dir] || "📍";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-3 py-1 rounded-full text-xs font-medium mb-2">
          <TrafficCone className="w-3.5 h-3.5" /> Signal Module
        </div>
        <h1 className="text-2xl font-bold text-foreground">Smart Signal Controller</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload 4 directional images to optimize signal timing</p>
      </motion.div>

      {/* Upload grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {directions.map((dir, i) => (
          <motion.div key={dir} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="glass-card p-4 text-center">
            <p className="text-xs font-semibold text-muted-foreground mb-2">{getDirectionEmoji(dir)} {dir}</p>
            <label className={`block w-full py-3 rounded-lg border-2 border-dashed cursor-pointer transition-all text-xs ${images[dir.toLowerCase()] ? "border-accent bg-accent/5 text-accent" : "border-border text-muted-foreground hover:border-primary"}`}>
              {images[dir.toLowerCase()] ? "✓ Uploaded" : "Choose Image"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setImages((prev) => ({ ...prev, [dir.toLowerCase()]: f })); }} />
            </label>
          </motion.div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3">
        {(status === "idle" || status === "finished") && (
          <button onClick={handleStart} disabled={loading} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-medium text-sm glow-primary disabled:opacity-50">
            {loading ? <span className="animate-spin">⏳</span> : <Play className="w-4 h-4" />}
            {status === "finished" ? "Restart" : "Analyze & Start"}
          </button>
        )}
        {status === "running" && (
          <button onClick={() => setStatus("paused")} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-warning/15 text-warning font-medium text-sm">
            <Pause className="w-4 h-4" />Pause
          </button>
        )}
        {status === "paused" && (
          <button onClick={() => setStatus("running")} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-accent text-accent-foreground font-medium text-sm">
            <Play className="w-4 h-4" />Resume
          </button>
        )}
        {(status === "running" || status === "paused") && (
          <button onClick={() => setStatus("finished")} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-destructive/15 text-destructive font-medium text-sm">
            <Square className="w-4 h-4" />Stop All
          </button>
        )}
      </div>

      {/* Signal Display */}
      {results && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Status monitor */}
          <div className="glass-card p-4 text-center glow-primary">
            {status === "running" && <p className="text-lg font-bold text-accent">🟢 GREEN: {currentGreenRoad} — {timer}s remaining</p>}
            {status === "paused" && <p className="text-lg font-bold text-warning">⏸ PAUSED: {currentGreenRoad} — {timer}s</p>}
            {status === "finished" && <p className="text-lg font-bold text-destructive">🔴 ALL SIGNALS RED</p>}
          </div>

          {/* Road cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {directions.map((dir) => {
              const isGreen = currentGreenRoad === dir && status !== "finished";
              const vehicleCount = results.raw_counts[dir] ?? 0;
              const timeAllocated = results.sequence.find((s) => s.road === dir)?.time ?? 0;
              return (
                <motion.div key={dir} layout
                  className={`glass-card p-4 text-center transition-all duration-500 ${isGreen ? "border-accent glow-accent" : "border-destructive/30"} ${status === "finished" ? "opacity-60" : ""}`}>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">{dir}</p>
                  <p className="text-2xl font-bold text-foreground mb-1">{vehicleCount}</p>
                  <p className="text-[10px] text-muted-foreground mb-2">vehicles</p>
                  {isGreen ? (
                    <div className="py-1.5 px-2 rounded-md bg-accent/15 text-accent text-xs font-semibold">🟢 GREEN — {timeAllocated}s</div>
                  ) : (
                    <div className="py-1.5 px-2 rounded-md bg-destructive/15 text-destructive text-xs font-semibold">🔴 RED</div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
