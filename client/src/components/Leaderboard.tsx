import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Clock, Medal, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import socket from "../socket";

export default function Leaderboard({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    socket.emit("game:leaderboard", (res: any) => {
      if (res?.leaderboard) {
        setLeaderboard(res.leaderboard);
      }
      setLoading(false);
    });
  }, []);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  const PodiumItem = ({ player, rank }: { player: any; rank: number }) => {
    const isFirst = rank === 1;
    const isSecond = rank === 2;

    const heightClass = isFirst ? "h-48" : isSecond ? "h-36" : "h-28";
    const colorClass = isFirst
      ? "bg-gradient-to-t from-yellow-400/5 to-yellow-400/20 border-yellow-400/50 text-yellow-400"
      : isSecond
        ? "bg-gradient-to-t from-gray-300/5 to-gray-300/20 border-gray-300/50 text-gray-300"
        : "bg-gradient-to-t from-amber-600/5 to-amber-600/20 border-amber-600/50 text-amber-600";

    // Animation order (2nd, then 1st, then 3rd)
    const delay = rank === 1 ? 0.3 : rank === 2 ? 0.1 : 0.5;

    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, type: "spring", stiffness: 100 }}
        className="flex flex-col items-center flex-1 max-w-[120px]"
      >
        <div className="mb-4 text-center">
          <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 bg-[#111] border-2 border-white/10 relative shadow-xl">
            <Medal
              size={24}
              className={
                isFirst
                  ? "text-yellow-400"
                  : isSecond
                    ? "text-gray-300"
                    : "text-amber-600"
              }
            />
          </div>
          <div className="font-bold text-white text-sm sm:text-lg w-full truncate overflow-hidden text-ellipsis px-1">
            {player.name}
          </div>
          <div className="text-xl font-black text-[var(--accent-color)] mt-1">
            {player.total_score}
          </div>
        </div>
        <div
          className={`w-full ${heightClass} ${colorClass} rounded-t-2xl border-t-2 border-l border-r flex justify-center pt-4 relative overflow-hidden backdrop-blur-sm shadow-[0_-10px_30px_rgba(0,0,0,0.5)]`}
        >
          <span className="text-5xl font-black opacity-30 select-none">
            {rank}
          </span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="fixed inset-0 bg-[#0b0f19] z-50 flex flex-col p-6 animate-in fade-in duration-300 w-full h-full pb-20 overflow-y-auto">
      <div className="flex items-center justify-between mb-2 max-w-3xl mx-auto w-full">
        <button
          onClick={onClose}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-widest flex items-center gap-3">
          <Trophy className="text-yellow-400" size={32} />
          {t("landing.leaderboard")}
        </h2>
        <div className="w-12" /> {/* Spacer */}
      </div>

      <div className="max-w-3xl mx-auto w-full space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin text-[var(--accent-color)]">
              <Clock size={32} />
            </div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-20 text-white/50 bg-white/5 rounded-3xl border border-white/5 mt-10">
            {t("landing.emptyLeaderboard")}
          </div>
        ) : (
          <>
            {/* Podium (Top 3) */}
            <div className="flex justify-center items-end gap-2 sm:gap-6 mt-10 mb-12">
              {top3[1] && <PodiumItem player={top3[1]} rank={2} />}
              {top3[0] && <PodiumItem player={top3[0]} rank={1} />}
              {top3[2] && <PodiumItem player={top3[2]} rank={3} />}
            </div>

            {/* The rest of the list (Rank 4 to 50) */}
            <div className="space-y-3 pb-8">
              <AnimatePresence>
                {rest.map((player, index) => {
                  const actualRank = index + 4;
                  return (
                    <motion.div
                      key={actualRank}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.05 }}
                      className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl p-4 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl bg-white/5 text-white/50 border border-white/5">
                          #{actualRank}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-white">
                            {player.name}
                          </h3>
                          <div className="text-xs text-white/50 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                            {player.games_played} {t("landing.gamesPlayed")} •{" "}
                            {player.games_won} {t("landing.gamesWon")}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xl sm:text-2xl font-black text-[var(--accent-color)]">
                          {player.total_score}
                        </div>
                        <div className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-white/30 truncate">
                          {t("landing.totalScore")}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
