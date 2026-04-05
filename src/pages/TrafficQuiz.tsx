import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Clock, CheckCircle2, XCircle, Trophy, RotateCcw, Play, ChevronRight } from "lucide-react";
import Papa from "papaparse";

interface QuizQuestion {
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  answer: string;
}

export default function TrafficQuiz() {
  const [allQuestions, setAllQuestions] = useState<QuizQuestion[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [config, setConfig] = useState({ count: 5, timePerQ: 10 });
  const [view, setView] = useState<"setup" | "quiz" | "result">("setup");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isActive, setIsActive] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [totalAnswered, setTotalAnswered] = useState(0);

  useEffect(() => {
    Papa.parse("/traffic_rules.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const valid = (res.data as QuizQuestion[]).filter((r) => r.question && r.option1 && r.answer);
        const uniqueMap = new Map<string, QuizQuestion>();
        valid.forEach((item) => {
          const key = item.question.trim().toLowerCase();
          if (!uniqueMap.has(key)) uniqueMap.set(key, item);
        });
        setAllQuestions(Array.from(uniqueMap.values()));
      },
    });
  }, []);

  const startQuiz = useCallback(() => {
    if (allQuestions.length === 0) return;
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    const finalCount = Math.min(config.count, shuffled.length);
    setQuizQuestions(shuffled.slice(0, finalCount));
    setCurrentIdx(0);
    setScore(0);
    setTotalAnswered(0);
    setView("quiz");
  }, [allQuestions, config.count]);

  useEffect(() => {
    if (quizQuestions.length === 0 || !quizQuestions[currentIdx]) return;
    const q = quizQuestions[currentIdx];
    const rawOptions = [q.option1, q.option2, q.option3, q.option4].filter(Boolean);
    setOptions(rawOptions.sort(() => Math.random() - 0.5));
    setSelected(null);
    setShowAnswer(false);
    setTimeLeft(config.timePerQ);
    setIsActive(true);
  }, [currentIdx, quizQuestions, config.timePerQ]);

  useEffect(() => {
    if (!isActive || showAnswer) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timer); setShowAnswer(true); setTotalAnswered((p) => p + 1); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isActive, showAnswer]);

  const handleSelect = (opt: string) => {
    if (showAnswer) return;
    setSelected(opt);
    setShowAnswer(true);
    setIsActive(false);
    setTotalAnswered((p) => p + 1);
    if (opt.trim() === quizQuestions[currentIdx].answer.trim()) setScore((p) => p + 1);
  };

  const handleNext = () => {
    if (currentIdx + 1 < quizQuestions.length) setCurrentIdx((p) => p + 1);
    else setView("result");
  };

  const progressPct = quizQuestions.length > 0 ? ((currentIdx + (showAnswer ? 1 : 0)) / quizQuestions.length) * 100 : 0;
  const timerPct = config.timePerQ > 0 ? (timeLeft / config.timePerQ) * 100 : 0;

  // SETUP VIEW
  if (view === "setup") {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 bg-warning/10 text-warning px-3 py-1 rounded-full text-xs font-medium mb-2">
            <BookOpen className="w-3.5 h-3.5" /> Quiz Module
          </div>
          <h1 className="text-2xl font-bold text-foreground">Traffic Rules Quiz</h1>
          <p className="text-sm text-muted-foreground mt-1">Test your knowledge of traffic rules and regulations</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card p-8 max-w-md mx-auto space-y-6">
          <div className="text-center mb-2">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 glow-primary">
              <BookOpen className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Configure Your Quiz</h2>
            <p className="text-xs text-muted-foreground mt-1">{allQuestions.length} questions loaded</p>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Number of Questions</label>
            <select value={config.count} onChange={(e) => setConfig({ ...config, count: parseInt(e.target.value) })}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              {[5, 10, 15, 20,25,30,35,40,45, 50,55,60,65,70,75,80,85,90,95,100].map((n) => <option key={n} value={n}>{n} Questions</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Time per Question</label>
            <select value={config.timePerQ} onChange={(e) => setConfig({ ...config, timePerQ: parseInt(e.target.value) })}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              {[5, 10, 15, 20, 30].map((n) => <option key={n} value={n}>{n} seconds</option>)}
            </select>
          </div>

          <button onClick={startQuiz} disabled={allQuestions.length === 0}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm glow-primary disabled:opacity-50 hover:opacity-90 transition-all">
            <Play className="w-4 h-4" />
            {allQuestions.length === 0 ? "Loading questions..." : "Start Exam"}
          </button>
        </motion.div>
      </div>
    );
  }

  // QUIZ VIEW
  if (view === "quiz") {
    const q = quizQuestions[currentIdx];
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Progress</p>
              <p className="text-lg font-bold text-foreground">{currentIdx + 1}<span className="text-muted-foreground font-normal">/{quizQuestions.length}</span></p>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent" />
              <span className="text-sm font-bold text-accent">{score}</span>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Timer</p>
              <p className={`text-lg font-bold font-mono ${timeLeft < 4 ? "text-destructive animate-pulse" : "text-warning"}`}>{timeLeft}s</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-secondary rounded-full overflow-hidden mb-2">
            <motion.div className="h-full gradient-primary rounded-full" animate={{ width: `${progressPct}%` }} transition={{ duration: 0.3 }} />
          </div>

          {/* Timer bar */}
          <div className="h-0.5 bg-secondary rounded-full overflow-hidden mb-6">
            <motion.div className={`h-full rounded-full ${timeLeft < 4 ? "bg-destructive" : "bg-warning"}`}
              animate={{ width: `${timerPct}%` }} transition={{ duration: 0.5 }} />
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div key={currentIdx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }} className="glass-card p-6 md:p-8 space-y-6">
            <h3 className="text-lg font-bold text-foreground leading-relaxed">{q.question}</h3>

            <div className="grid gap-3">
              {options.map((opt, i) => {
                let classes = "border-border bg-secondary/50 hover:bg-secondary hover:border-primary/30";
                if (showAnswer) {
                  if (opt.trim() === q.answer.trim()) classes = "border-accent bg-accent/15 text-accent";
                  else if (opt === selected) classes = "border-destructive bg-destructive/15 text-destructive";
                  else classes = "border-border bg-secondary/30 opacity-50";
                }
                return (
                  <motion.button key={i} onClick={() => handleSelect(opt)}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className={`${classes} p-4 rounded-xl border-2 text-left transition-all text-sm font-medium flex items-center gap-3`}>
                    <span className="w-7 h-7 rounded-lg bg-background/50 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                    {showAnswer && opt.trim() === q.answer.trim() && <CheckCircle2 className="w-5 h-5 ml-auto flex-shrink-0" />}
                    {showAnswer && opt === selected && opt.trim() !== q.answer.trim() && <XCircle className="w-5 h-5 ml-auto flex-shrink-0" />}
                  </motion.button>
                );
              })}
            </div>

            {showAnswer && (
              <motion.button onClick={handleNext} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm glow-primary">
                {currentIdx + 1 < quizQuestions.length ? "Next Question" : "See Results"}
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // RESULT VIEW
  const pct = quizQuestions.length > 0 ? Math.round((score / quizQuestions.length) * 100) : 0;
  const grade = pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B" : pct >= 60 ? "C" : "F";

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 text-center space-y-6">
        <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto glow-primary">
          <Trophy className="w-10 h-10 text-primary-foreground" />
        </div>

        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-2">Final Score</p>
          <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
            className="text-7xl font-black text-gradient">{score}/{quizQuestions.length}</motion.p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="stat-card text-center py-3">
            <p className="text-xl font-bold text-foreground">{pct}%</p>
            <p className="text-[10px] text-muted-foreground">Accuracy</p>
          </div>
          <div className="stat-card text-center py-3">
            <p className="text-xl font-bold text-warning">{grade}</p>
            <p className="text-[10px] text-muted-foreground">Grade</p>
          </div>
          <div className="stat-card text-center py-3">
            <p className="text-xl font-bold text-foreground">{totalAnswered}</p>
            <p className="text-[10px] text-muted-foreground">Answered</p>
          </div>
        </div>

        <button onClick={() => setView("setup")}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm glow-primary">
          <RotateCcw className="w-4 h-4" /> Retake Quiz
        </button>
      </motion.div>
    </div>
  );
}
