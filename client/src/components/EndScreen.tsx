import { motion } from "framer-motion";
import { Home, Medal, RefreshCw, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import socket from "../socket";
import type { GameEndResult } from "../types";

interface EndScreenProps {
  results: GameEndResult | null;
  onPlayAgain: () => void;
}

export default function EndScreen({ results, onPlayAgain }: EndScreenProps) {
  const { t } = useTranslation();

  if (!results) return null;

  const sorted = [...results.players].sort((a, b) => b.score - a.score);
  const highestScore = sorted[0]?.score || 0;

  // Find winners (handles ties)
  const winners = sorted.filter((p) => p.score === highestScore);
  const isTie = winners.length > 1;

  const returnToLobbyFromEnd = () => {
    socket.emit("lobby:leave");
    // Using simple page reload to completely reset state, or better:
    window.location.reload();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-5xl mx-auto px-4"
    >
      <div className="flex flex-col md:flex-row gap-8 items-stretch pt-4 md:pt-10">
        {/* Sinistra: Vincitore e Bottoni  */}
        <div className="flex-1 w-full flex flex-col">
          <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex-1 flex flex-col items-center text-center">
            <div className="absolute top-0 left-0 w-48 h-48 bg-[var(--accent-color)]/5 blur-[80px] rounded-full pointer-events-none" />

            <motion.div
              initial={{ rotate: -10, scale: 0.5 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="inline-block bg-[var(--accent-color)]/20 p-8 rounded-3xl mb-8 shadow-[0_0_50px_rgba(59,130,246,0.2)] mt-4"
            >
              <Trophy size={80} className="text-[var(--accent-color)]" />
            </motion.div>

            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 uppercase tracking-wide">
              {t("end.gameOver")}
            </h1>

            <div className="bg-[#0b0f19] border border-[var(--accent-color)]/30 rounded-2xl p-8 mt-6 relative overflow-hidden w-full max-w-md shadow-lg">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent-color)] to-transparent" />

              <p className="text-sm font-bold text-[var(--accent-color)] mb-4 uppercase tracking-[0.2em]">
                {isTie ? t("end.tie") : t("end.winner")}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                {winners.map((w, i) => (
                  <span
                    key={w.id}
                    className="text-4xl font-black text-white px-2"
                  >
                    {w.name}
                    {i < winners.length - 1 && (
                      <span className="text-white/30 font-normal mx-2">&</span>
                    )}
                  </span>
                ))}
              </div>

              <div className="inline-flex items-center gap-2 bg-white/5 px-6 py-2 rounded-full border border-white/10">
                <span className="text-[var(--accent-color)] font-black text-xl">
                  {highestScore}
                </span>
                <span className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">
                  {t("end.points")}
                </span>
              </div>
            </div>

            <div className="mt-auto pt-10 flex flex-col sm:flex-row gap-4 w-full">
              <button
                onClick={onPlayAgain}
                className="flex-1 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-black font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-[var(--accent-color)]/10 cursor-pointer text-sm uppercase tracking-widest"
              >
                <RefreshCw size={20} className="stroke-[3]" />
                {t("end.playAgain")}
              </button>
              <button
                onClick={returnToLobbyFromEnd}
                className="sm:flex-none w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-colors cursor-pointer text-sm uppercase tracking-widest"
              >
                <Home size={20} />
                <span className="hidden sm:inline">Esci</span>
                <span className="sm:hidden text-xs">
                  {t("end.backToLobby")}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Destra: Classifica (Leaderboard) */}
        <div className="flex-1 w-full flex flex-col">
          <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl min-h-[400px] flex-1 flex flex-col">
            <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <Medal size={16} />
              {t("end.finalScores")}
            </h3>

            <div className="space-y-3 flex-1 overflow-y-auto pr-2 scrollbar-none">
              {sorted.map((p, i) => (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={p.id}
                  className={`flex items-center justify-between p-5 rounded-2xl transition-colors ${
                    p.score === highestScore
                      ? "bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                      : "bg-[#0b0f19] border border-white/5"
                  }`}
                >
                  <div className="flex items-center gap-5">
                    <span
                      className={`text-lg font-black w-8 text-center drop-shadow-md ${
                        i === 0
                          ? "text-[var(--accent-color)] scale-125"
                          : i === 1
                            ? "text-gray-300"
                            : i === 2
                              ? "text-amber-700"
                              : "text-white/20"
                      }`}
                    >
                      #{i + 1}
                    </span>
                    <span
                      className={`font-bold text-lg tracking-tight ${p.id === socket.id ? "text-white" : "text-white/70"}`}
                    >
                      {p.name}
                      {p.id === socket.id && (
                        <span className="text-white/30 text-[10px] ml-3 uppercase font-black tracking-widest">
                          ({t("lobby.you")})
                        </span>
                      )}
                    </span>
                  </div>
                  <span className="font-mono text-xl font-black tracking-tighter text-white bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                    {p.score}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
