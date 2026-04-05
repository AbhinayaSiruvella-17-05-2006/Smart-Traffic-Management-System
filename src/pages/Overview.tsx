import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, TrafficCone, Route, CloudSun, MessageSquare, BookOpen, Activity, TrendingUp, Shield, Clock, Wifi, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const features = [
  { icon: Camera, label: "Vehicle Detection", desc: "AI-powered vehicle counting from images & video", path: "/detection", color: "text-primary" },
  { icon: TrafficCone, label: "Signal Controller", desc: "Smart traffic signal timing optimization", path: "/signals", color: "text-accent" },
  { icon: Route, label: "Route Finder", desc: "Optimal route planning with traffic analysis", path: "/routes", color: "text-warning" },
  { icon: CloudSun, label: "Weather Alerts", desc: "Weather-based traffic advisories", path: "/weather", color: "text-primary" },
 
  { icon: BookOpen, label: "Traffic Quiz", desc: "Test your traffic rules knowledge", path: "/quiz", color: "text-warning" },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

function useRealtimeClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return time;
}

function useAnimatedCounter(target: number, duration = 2000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

export default function Overview() {
  const navigate = useNavigate();
  const clock = useRealtimeClock();
  const [liveVehicles, setLiveVehicles] = useState(12847);
  const [uptime, setUptime] = useState(99.8);

  // Simulate live vehicle count updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveVehicles((p) => p + Math.floor(Math.random() * 5) + 1);
      setUptime((p) => Math.min(100, p + (Math.random() * 0.01 - 0.005)));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const vehicleCount = useAnimatedCounter(liveVehicles, 1000);
  const monitorCount = useAnimatedCounter(6, 1500);
  const safetyScore = useAnimatedCounter(98, 2000);

  const stats = [
    { label: "Active Modules", value: monitorCount.toString(), icon: Activity, color: "text-primary", live: true },
    { label: "Vehicles Tracked", value: vehicleCount.toLocaleString(), icon: TrendingUp, color: "text-accent", live: true },
    { label: "Safety Score", value: `${safetyScore}%`, icon: Shield, color: "text-warning", live: false },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header with live clock */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Traffic Command <span className="text-gradient">Center</span>
          </h1>
          <p className="text-sm text-muted-foreground">Real-time monitoring & intelligent traffic management</p>
        </div>
        <div className="hidden sm:block text-right glass-card px-4 py-2">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">Live</span>
            <span className="pulse-dot" />
          </div>
          <p className="text-lg font-mono font-bold text-foreground tabular-nums">
            {clock.toLocaleTimeString()}
          </p>
          <p className="text-[10px] text-muted-foreground">{clock.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</p>
        </div>
      </motion.div>

      {/* Live Stats */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <motion.div key={s.label} variants={item} className="stat-card flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-foreground tabular-nums">{s.value}</p>
                {s.live && <span className="pulse-dot" />}
              </div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Real-time system status */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="glass-card p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-accent" />
          <div>
            <p className="text-xs font-medium text-foreground">Network</p>
            <p className="text-[10px] text-accent">Connected</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-warning" />
          <div>
            <p className="text-xs font-medium text-foreground">Latency</p>
            <p className="text-[10px] text-muted-foreground">{Math.floor(Math.random() * 10 + 12)}ms</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <div>
            <p className="text-xs font-medium text-foreground">Uptime</p>
            <p className="text-[10px] text-muted-foreground">{uptime.toFixed(1)}%</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-accent" />
          <div>
            <p className="text-xs font-medium text-foreground">Status</p>
            <p className="text-[10px] text-accent">All Systems Go</p>
          </div>
        </div>
      </motion.div>

      {/* Features */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Modules</h2>
        <motion.div variants={container} initial="hidden" animate="show" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <motion.button key={f.label} variants={item} onClick={() => navigate(f.path)}
              className="stat-card text-left group cursor-pointer hover:glow-primary">
              <div className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3 ${f.color} group-hover:scale-110 transition-transform`}>
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{f.label}</h3>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Status banner */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="glass-card p-4 flex items-center gap-3">
        <span className="pulse-dot" />
        <p className="text-xs text-muted-foreground">
          All systems operational — Connect your Python backend on <span className="text-foreground font-medium">localhost:5000</span> to enable live features
        </p>
      </motion.div>
    </div>
  );
}
