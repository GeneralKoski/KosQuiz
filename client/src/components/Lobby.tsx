import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  Check,
  ChevronDown,
  Copy,
  FolderOpen,
  Play,
  Settings2,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import socket from "../socket";
import type { Difficulty, LobbyInfo } from "../types";

interface LobbyProps {
  lobby: LobbyInfo;
  playerName: string;
  initialError?: string;
  onClearError?: () => void;
}

export default function Lobby({
  lobby,
  playerName,
  initialError,
  onClearError,
}: LobbyProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(initialError ? t(initialError) : "");

  const [difficulty, setDifficulty] = useState<Difficulty>("turn");
  const [category, setCategory] = useState<string>("random");

  // Sync local settings with server state
  useEffect(() => {
    if (lobby.difficulty) setDifficulty(lobby.difficulty);
    if (lobby.category) setCategory(lobby.category);
  }, [lobby.difficulty, lobby.category]);

  useEffect(() => {
    if (initialError) {
      setError(t(initialError));
      onClearError?.();
    }
  }, [initialError, t, onClearError]);

  useEffect(() => {
    const handleGameError = ({ message }: { message: string }) => {
      setError(t(message));
    };
    socket.on("game:error", handleGameError);
    return () => {
      socket.off("game:error", handleGameError);
    };
  }, [t]);

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isHost = lobby.hostId === socket.id;
  const canStart = lobby.players.length >= 2;

  const copyCode = () => {
    navigator.clipboard.writeText(lobby.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startGame = () => {
    socket.emit(
      "game:start",
      { difficulty },
      (res: { error?: string; ok?: boolean }) => {
        if (res?.error) setError(t(res.error));
      },
    );
  };

  const handleDifficultyChange = (newDiff: Difficulty) => {
    if (!isHost) return;
    setDifficulty(newDiff);
    socket.emit("lobby:updateSettings", { difficulty: newDiff });
  };

  const handleCategorySelect = (id: string) => {
    if (!isHost) return;
    setCategory(id);
    socket.emit("lobby:updateSettings", { category: id });
    setIsCategoryOpen(false);
  };

  const categoriesList = [
    { id: "random", label: t("lobby.catRandom") },
    { id: "Geography", label: t("lobby.catGeography") },
    { id: "Science", label: t("lobby.catScience") },
    { id: "History", label: t("lobby.catHistory") },
    { id: "Cinema", label: t("lobby.catCinema") },
  ];

  // Difficulty configs for UI
  const difficulties: {
    id: Difficulty;
    icon: any;
    label: string;
    color: string;
  }[] = [
    {
      id: "turn",
      icon: Sparkles,
      label: "A Turno",
      color: "text-purple-400 bg-purple-400/10 border-purple-400/30",
    },
    {
      id: "easy",
      icon: Target,
      label: "Facile",
      color: "text-green-400 bg-green-400/10 border-green-400/30",
    },
    {
      id: "medium",
      icon: Brain,
      label: "Media",
      color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
    },
    {
      id: "hard",
      icon: Zap,
      label: "Difficile",
      color: "text-red-400 bg-red-400/10 border-red-400/30",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-5xl mx-auto px-4"
    >
      <div className="flex flex-col md:flex-row gap-8 items-stretch pt-4 md:pt-10">
        {/* Sinistra: Gestione, Codice Room e Settaggi */}
        <div className="flex-1 w-full flex flex-col relative z-20">
          <div className="text-center md:text-left bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative flex-1 flex flex-col">
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--accent-color)]/5 blur-[80px] rounded-full" />
            </div>

            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
              {t("lobby.title")}
            </h2>

            <div
              onClick={copyCode}
              className="inline-flex w-full sm:w-auto items-center justify-between sm:justify-start gap-6 bg-[#0b0f19] border border-white/10 px-8 py-5 rounded-2xl cursor-pointer hover:border-[var(--accent-color)]/50 transition-all group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex flex-col items-start pr-6 sm:border-r border-white/10">
                <span className="text-[11px] text-white/40 uppercase font-bold tracking-[0.2em] mb-1.5">
                  {t("lobby.code")}
                </span>
                <span className="font-mono text-3xl md:text-4xl font-black tracking-[0.3em] text-[var(--accent-color)] leading-none">
                  {lobby.code}
                </span>
              </div>
              <div className="text-white/30 group-hover:text-[var(--accent-color)] group-hover:scale-110 transition-all duration-300">
                {copied ? (
                  <Check size={28} className="text-green-400" />
                ) : (
                  <Copy size={28} />
                )}
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-6 py-4 rounded-2xl text-center shadow-[0_0_15px_rgba(239,68,68,0.1)] mt-8"
              >
                <span className="font-bold tracking-wide">{error}</span>
              </motion.div>
            )}

            <hr className="border-white/5 my-8" />
            <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] flex items-center justify-between mb-6">
              <span className="flex items-center gap-2">
                <Settings2 size={16} />
                {t("lobby.settings")}
              </span>
              {!isHost && (
                <span className="text-[10px] bg-white/5 text-white/50 px-2 py-1 rounded border border-white/10 tracking-widest uppercase">
                  {t("lobby.onlyHostDesc")}
                </span>
              )}
            </h3>

            <div className="space-y-4">
              <div className="text-sm font-bold text-white/80">
                {t("lobby.categoryDesc")}
              </div>
              <div className="relative z-50" ref={dropdownRef}>
                <button
                  onClick={() => isHost && setIsCategoryOpen(!isCategoryOpen)}
                  className={`w-full flex items-center justify-between bg-[#0b0f19] border rounded-2xl px-5 py-4 text-sm font-black text-white/80 transition-all ${isCategoryOpen ? "border-[var(--accent-color)]/50 ring-1 ring-[var(--accent-color)]/30" : "border-white/5 hover:bg-white/5"} ${!isHost ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className="flex items-center gap-3 w-full overflow-hidden">
                    <FolderOpen
                      size={18}
                      className="text-[var(--accent-color)] shrink-0"
                    />
                    <span className="truncate">
                      {categoriesList.find((c) => c.id === category)?.label ||
                        t("lobby.catRandom")}
                    </span>
                  </div>
                  {isHost && (
                    <ChevronDown
                      size={18}
                      className={`text-white/40 transition-transform shrink-0 ml-3 ${isCategoryOpen ? "rotate-180" : ""}`}
                    />
                  )}
                </button>

                <AnimatePresence>
                  {isCategoryOpen && isHost && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 right-0 top-full mt-2 bg-[#0b0f19] border border-white/10 rounded-2xl p-2 shadow-2xl z-[100] flex flex-col gap-1"
                    >
                      {categoriesList.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => handleCategorySelect(cat.id)}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-black transition-all cursor-pointer ${
                            category === cat.id
                              ? "bg-[var(--accent-color)] text-black shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                              : "text-white/70 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          {cat.label}
                          {category === cat.id && (
                            <div className="w-2 h-2 rounded-full bg-black/50" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="text-sm font-bold text-white/80 pt-2">
                {t("lobby.difficultyDesc")}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {difficulties.map((diff) => {
                  const Icon = diff.icon;
                  const isSelected = difficulty === diff.id;
                  return (
                    <button
                      key={diff.id}
                      onClick={() => handleDifficultyChange(diff.id)}
                      disabled={!isHost}
                      className={`flex items-center justify-center sm:justify-start gap-3 px-4 py-4 rounded-2xl border transition-all
                        ${
                          isSelected
                            ? `${diff.color} ring-1 ring-current shadow-[0_0_20px_rgba(255,255,255,0.05)] scale-[1.02] bg-white/5 opacity-100`
                            : "border-white/5 bg-[#0b0f19] text-white/40 hover:bg-white/5 opacity-70"
                        }
                        ${!isHost ? "cursor-default" : "cursor-pointer"}
                        `}
                    >
                      <Icon size={18} />
                      <span className="text-sm font-black">{diff.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Destra: Lista Giocatori & Pulsante Start */}
        <div className="flex-1 w-full flex flex-col">
          <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl min-h-[300px] flex-1 flex flex-col">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
              <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                <Users size={16} />
                {t("lobby.players")}{" "}
                <span className="text-[var(--accent-color)] ml-2 bg-[var(--accent-color)]/10 px-2 py-0.5 rounded-md">
                  {lobby.players.length}
                </span>
              </h3>

              {isHost ? (
                <button
                  onClick={startGame}
                  disabled={!canStart}
                  className={`flex items-center justify-center gap-3 px-6 py-3 rounded-xl transition-all uppercase tracking-[0.1em] text-sm font-black cursor-pointer w-full sm:w-auto
                    ${
                      canStart
                        ? "bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-black hover:scale-[1.05] active:scale-95 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                        : "bg-white/5 text-white/20 cursor-not-allowed border border-white/10"
                    }`}
                >
                  <Play size={16} fill={canStart ? "black" : "none"} />
                  {canStart ? t("lobby.startGame") : t("lobby.needMorePlayers")}
                </button>
              ) : (
                <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl w-full sm:w-auto justify-center">
                  <div className="w-4 h-4 border-2 border-[var(--accent-color)] border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold text-white/50 tracking-widest uppercase animate-pulse">
                    {t("lobby.waitingForPlayers")}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-2 scrollbar-none">
              <AnimatePresence>
                {lobby.players.map((p) => (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={p.id}
                    className="flex items-center justify-between bg-[#0b0f19] rounded-2xl px-5 py-4 border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          p.disconnected
                            ? "bg-white/20"
                            : p.id === socket.id
                              ? "bg-[var(--accent-color)] shadow-[0_0_15px_var(--accent-color)] animate-pulse"
                              : "bg-green-400"
                        }`}
                      />
                      <span
                        className={`font-semibold text-lg tracking-tight ${
                          p.disconnected
                            ? "text-white/30 line-through"
                            : p.id === socket.id
                              ? "text-white"
                              : "text-white/70"
                        }`}
                      >
                        {p.name}
                        {p.id === socket.id && (
                          <span className="text-white/30 text-xs ml-2 uppercase font-bold tracking-wider">
                            ({t("lobby.you")})
                          </span>
                        )}
                      </span>
                    </div>
                    {p.id === lobby.hostId && (
                      <span className="text-[10px] font-black tracking-widest text-[#0b0f19] bg-[var(--accent-color)] px-2.5 py-1 rounded-md uppercase">
                        {t("lobby.host")}
                      </span>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
