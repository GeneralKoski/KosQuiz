import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  Check,
  Copy,
  Play,
  Settings2,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import socket from "../socket";
import type { Difficulty, LobbyInfo } from "../types";

interface LobbyProps {
  lobby: LobbyInfo;
  playerName: string;
}

export default function Lobby({ lobby }: LobbyProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const [difficulty, setDifficulty] = useState<Difficulty>("turn");

  // Sync local difficulty with server state
  useEffect(() => {
    if (lobby.difficulty) {
      setDifficulty(lobby.difficulty);
    }
  }, [lobby.difficulty]);

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
        <div className="flex-1 w-full flex flex-col">
          <div className="text-center md:text-left bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex-1 flex flex-col">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--accent-color)]/5 blur-[80px] rounded-full pointer-events-none" />

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
                Impostazioni Partita
              </span>
              {!isHost && (
                <span className="text-[10px] bg-white/5 text-white/50 px-2 py-1 rounded border border-white/10 tracking-widest uppercase">
                  Solo l'host può modificare
                </span>
              )}
            </h3>

            <div className="space-y-4">
              <div className="text-sm font-bold text-white/80">Difficoltà</div>
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
                          p.id === socket.id
                            ? "bg-[var(--accent-color)] shadow-[0_0_15px_var(--accent-color)] animate-pulse"
                            : "bg-green-400"
                        }`}
                      />
                      <span
                        className={`font-semibold text-lg tracking-tight ${
                          p.id === socket.id ? "text-white" : "text-white/70"
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
