import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, Camera, BarChart3, Loader2, Play, Pause, Pencil, Trash2, Image, Video } from "lucide-react";

const API = "https://traffic-backend-svv7.onrender.com";

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export default function VehicleDetection() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"image" | "video" | "">("");
  const [stats, setStats] = useState<Record<string, number>>({});
  const [streamUrl, setStreamUrl] = useState("");
  const [imageResult, setImageResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [boundaryPoints, setBoundaryPoints] = useState<[number, number][]>([]);
  const [imagePreview, setImagePreview] = useState("");
  const [imageDimensions, setImageDimensions] = useState({ w: 0, h: 0, displayW: 0, displayH: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const onFileSelect = (f: File) => {
    setFile(f);
    const isVideo = f.type.startsWith("video");
    if (!mode) setMode(isVideo ? "video" : "image");
    setStats({}); setStreamUrl(""); setImageResult(""); setBoundaryPoints([]);
    setVideoProgress(0); setVideoCurrentTime(0); setVideoDuration(0);
    if (!isVideo) {
      setImagePreview(URL.createObjectURL(f));
    } else {
      setImagePreview("");
      const vid = document.createElement("video");
      vid.preload = "metadata";
      vid.onloadedmetadata = () => { setVideoDuration(vid.duration); URL.revokeObjectURL(vid.src); };
      vid.src = URL.createObjectURL(f);
    }
  };

  useEffect(() => {
    if (!canvasRef.current || !imagePreview || mode !== "image") return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    if (boundaryPoints.length === 0) return;
    ctx.strokeStyle = "hsl(199, 89%, 48%)";
    ctx.lineWidth = 2;
    ctx.fillStyle = "rgba(14,165,233,0.1)";
    ctx.beginPath();
    ctx.moveTo(boundaryPoints[0][0], boundaryPoints[0][1]);
    for (let i = 1; i < boundaryPoints.length; i++) ctx.lineTo(boundaryPoints[i][0], boundaryPoints[i][1]);
    if (boundaryPoints.length > 2) { ctx.closePath(); ctx.fill(); }
    ctx.stroke();
    boundaryPoints.forEach(([x, y], i) => {
      ctx.fillStyle = i === 0 ? "hsl(0, 84%, 60%)" : "hsl(199, 89%, 48%)";
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
    });
  }, [boundaryPoints, imagePreview, mode]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setBoundaryPoints((prev) => [...prev, [e.clientX - rect.left, e.clientY - rect.top]]);
  };

  const getScaledPoints = (): [number, number][] => {
    if (boundaryPoints.length < 3) return [];
    const { w, displayW, h, displayH } = imageDimensions;
    if (!displayW || !displayH) return [];
    return boundaryPoints.map(([x, y]) => [Math.round(x * w / displayW), Math.round(y * h / displayH)]);
  };

  const handleImageLoad = () => {
    if (!imgRef.current || !canvasRef.current) return;
    canvasRef.current.width = imgRef.current.clientWidth;
    canvasRef.current.height = imgRef.current.clientHeight;
    setImageDimensions({ w: imgRef.current.naturalWidth, h: imgRef.current.naturalHeight, displayW: imgRef.current.clientWidth, displayH: imgRef.current.clientHeight });
  };

  const handleUpload = useCallback(async () => {
    if (!file || !mode) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      if (mode === "video") {
        await fetch(`${API}/upload_video`, { method: "POST", body: formData });
        setStreamUrl(`${API}/video_feed?${Date.now()}`);
        setIsPlaying(true); setVideoProgress(0); setVideoCurrentTime(0);
      } else {
        const scaledPts = getScaledPoints();
        if (scaledPts.length >= 3) formData.append("points", JSON.stringify(scaledPts));
        const res = await fetch(`${API}/upload_image`, { method: "POST", body: formData });
        const data = await res.json();
        setImageResult(`data:image/jpeg;base64,${data.image}`);
        setStats(data.stats); setImagePreview(""); setIsDrawing(false);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, mode, boundaryPoints, imageDimensions]);

  const handleStop = async () => { try { await fetch(`${API}/stop_video`, { method: "POST" }); setIsPlaying(false); } catch {} };
  const handleResume = async () => { try { await fetch(`${API}/resume_video`, { method: "POST" }); setStreamUrl(`${API}/video_feed?${Date.now()}`); setIsPlaying(true); } catch {} };

  const handleSeek = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    try {
      await fetch(`${API}/seek_video`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ position: val }) });
      setVideoProgress(val); setVideoCurrentTime(val * videoDuration);
      if (!isPlaying) handleResume(); else setStreamUrl(`${API}/video_feed?${Date.now()}`);
    } catch {}
  };

  useEffect(() => {
    if (mode !== "video" || !streamUrl) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API}/stats`);
        const data = await res.json();
        setStats(data.counts || data);
        if (data.progress !== undefined) {
          setVideoProgress(data.progress); setVideoCurrentTime(data.current_time || 0);
          if (data.duration) setVideoDuration(data.duration);
          if (data.finished) { setIsPlaying(false); setVideoProgress(1); }
        }
      } catch {}
    }, 500);
    return () => clearInterval(interval);
  }, [mode, streamUrl]);

  const total = Object.values(stats).reduce((a, b) => a + b, 0);

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) onFileSelect(f); };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium mb-2">
          <Camera className="w-3.5 h-3.5" /> Detection Module
        </div>
        <h1 className="text-2xl font-bold text-foreground">Vehicle Detection</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload an image or video to detect and count vehicles</p>
      </motion.div>

      {/* Mode + Upload */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Mode</p>
          <div className="flex gap-2">
            {([{ id: "image" as const, label: "Image", icon: Image }, { id: "video" as const, label: "Video", icon: Video }]).map((m) => (
              <button key={m.id} onClick={() => { setMode(m.id); setStats({}); setStreamUrl(""); setImageResult(""); setImagePreview(""); setBoundaryPoints([]); setFile(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-medium transition-all ${mode === m.id ? "bg-primary/15 border-primary text-primary glow-primary" : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground"}`}>
                <m.icon className="w-4 h-4" />{m.label}
              </button>
            ))}
          </div>
        </div>
        <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
          className={`glass-card p-5 flex flex-col items-center justify-center gap-2 border-2 border-dashed transition-all cursor-pointer ${dragOver ? "border-primary bg-primary/5" : "border-border"}`}
          onClick={() => document.getElementById("file-input")?.click()}>
          <Upload className="w-6 h-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{file ? file.name : "Drop file or click to browse"}</p>
          <input id="file-input" type="file" accept="image/*,video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileSelect(f); }} />
        </div>
      </div>

      {/* Boundary drawing */}
      {mode === "image" && imagePreview && !imageResult && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-foreground">Draw detection boundary (min 3 points)</p>
            <div className="flex gap-2">
              <button onClick={() => setIsDrawing(!isDrawing)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isDrawing ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                <Pencil className="w-3 h-3" />{isDrawing ? "Drawing..." : "Draw"}
              </button>
              <button onClick={() => setBoundaryPoints([])} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive">
                <Trash2 className="w-3 h-3" />Clear
              </button>
            </div>
          </div>
          <div className="relative inline-block w-full">
            <img ref={imgRef} src={imagePreview} alt="Preview" className="rounded-lg w-full" onLoad={handleImageLoad} />
            <canvas ref={canvasRef} onClick={handleCanvasClick} className={`absolute top-0 left-0 w-full h-full ${isDrawing ? "cursor-crosshair" : "pointer-events-none"}`} />
          </div>
          {boundaryPoints.length > 0 && <p className="text-xs text-muted-foreground mt-2">{boundaryPoints.length} points{boundaryPoints.length < 3 ? " (need 3+)" : " ✓"}</p>}
        </motion.div>
      )}

      {/* Analyze */}
      <div className="flex justify-center">
        <button onClick={handleUpload} disabled={!file || !mode || loading}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl gradient-primary text-primary-foreground font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all glow-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {loading ? "Processing..." : "Analyze"}
        </button>
      </div>

      {/* Video controls */}
      {mode === "video" && streamUrl && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4">
          <div className="flex items-center gap-3 mb-3">
            {isPlaying ? (
              <button onClick={handleStop} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-destructive/10 text-destructive text-sm font-medium"><Pause className="w-4 h-4" />Pause</button>
            ) : (
              <button onClick={handleResume} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium"><Play className="w-4 h-4" />Resume</button>
            )}
            <span className="text-xs text-muted-foreground">{formatTime(videoCurrentTime)} / {formatTime(videoDuration)}</span>
          </div>
          <div className="relative">
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full gradient-primary rounded-full transition-all duration-300" style={{ width: `${videoProgress * 100}%` }} />
            </div>
            <input type="range" min={0} max={1} step={0.001} value={videoProgress} onChange={handleSeek} className="absolute top-0 left-0 w-full h-1.5 opacity-0 cursor-pointer" />
          </div>
        </motion.div>
      )}

      {/* Results */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 glass-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Camera className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Result</span>
          </div>
          <div className="p-4">
            <div className="rounded-lg overflow-hidden bg-secondary/30 min-h-[300px] flex items-center justify-center">
              {mode === "video" && streamUrl ? <img src={streamUrl} alt="Video Feed" className="w-full" />
                : mode === "image" && imageResult ? <img src={imageResult} alt="Result" className="w-full" />
                : <div className="text-center text-muted-foreground py-16"><Camera className="w-10 h-10 mx-auto mb-3 opacity-40" /><p className="text-sm">Upload and analyze to see results</p></div>}
            </div>
          </div>
        </div>
        <div className="glass-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Analytics</span>
          </div>
          <div className="p-4 space-y-2">
            {Object.entries(stats).filter(([, v]) => v > 0).map(([k, v]) => (
              <motion.div key={k} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex justify-between items-center py-2 px-3 rounded-lg bg-secondary/50">
                <span className="text-sm capitalize text-foreground">{k}</span>
                <span className="text-sm font-bold text-primary">{v}</span>
              </motion.div>
            ))}
            {total > 0 && <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-primary/10 mt-3"><span className="text-sm font-medium text-foreground">Total</span><span className="text-sm font-bold text-primary">{total}</span></div>}
            {total === 0 && <div className="text-center py-8 text-muted-foreground"><BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-40" /><p className="text-sm">Waiting for data...</p></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
