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
      className="w-full max-w-lg mx-auto px-4"
    >
      <div className="text-center mb-10 relative">
        <motion.div
          initial={{ rotate: -10, scale: 0.5 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="inline-block bg-[var(--accent-color)]/20 p-6 rounded-3xl mb-6 shadow-[0_0_50px_rgba(249,115,22,0.2)]"
        >
          <Trophy size={64} className="text-[var(--accent-color)]" />
        </motion.div>

        <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-wide">
          {t("end.gameOver")}
        </h1>

        <div className="bg-[#111] border border-[var(--accent-color)]/30 rounded-2xl p-6 mt-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent-color)] to-transparent" />

          <p className="text-sm font-bold text-[var(--accent-color)] mb-2 uppercase tracking-[0.2em]">
            {isTie ? t("end.tie") : t("end.winner")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {winners.map((w, i) => (
              <span key={w.id} className="text-3xl font-black text-white">
                {w.name}
                {i < winners.length - 1 && (
                  <span className="text-white/30 font-normal mx-2">&</span>
                )}
              </span>
            ))}
          </div>
          <div className="mt-4 inline-flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
            <span className="text-white/60 text-xs font-bold uppercase tracking-widest">
              {highestScore} {t("end.points")}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-[#111] border border-white/5 rounded-3xl p-6 mb-8">
        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4 flex items-center justify-center gap-2">
          <Medal size={14} />
          {t("end.finalScores")}
        </h3>
        <div className="space-y-2">
          {sorted.map((p, i) => (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              key={p.id}
              className={`flex items-center justify-between p-4 rounded-2xl transition-colors ${
                p.score === highestScore
                  ? "bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20"
                  : "bg-black/40 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-4">
                <span
                  className={`text-sm font-black w-6 text-center ${
                    i === 0
                      ? "text-[var(--accent-color)]"
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
                  className={`font-bold ${p.id === socket.id ? "text-white" : "text-white/70"}`}
                >
                  {p.name}
                </span>
              </div>
              <span className="font-mono text-lg font-black tracking-tighter text-white">
                {p.score}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onPlayAgain}
          className="flex-1 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-black font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-[var(--accent-color)]/10 cursor-pointer"
        >
          <RefreshCw size={20} className="stroke-[3]" />
          {t("end.playAgain")}
        </button>
        <button
          onClick={returnToLobbyFromEnd}
          className="sm:flex-none w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-colors cursor-pointer"
        >
          <Home size={20} />
          <span className="sm:hidden font-bold uppercase tracking-widest text-xs">
            {t("end.backToLobby")}
          </span>
        </button>
      </div>
    </motion.div>
  );
}
