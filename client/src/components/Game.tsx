import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Lightbulb,
  Send,
  Timer,
  Trophy,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import socket from "../socket";
import type {
  CorrectFeedback,
  GameEndResult,
  GameState,
  RevealData,
  TimerStartData,
} from "../types";

interface Feedback {
  type: "correct" | "wrong";
  playerName?: string;
  points?: number;
  answer?: string;
}

interface GameProps {
  gameState: GameState | null;
  onGameEnd: (data: GameEndResult) => void;
}

export default function Game({ gameState, onGameEnd }: GameProps) {
  const { t } = useTranslation();
  const [answer, setAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(15);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [revealAnswer, setRevealAnswer] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerActiveRef = useRef(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isMyTurn = gameState?.activePlayerId === socket.id;

  const startCountdown = (seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerActiveRef.current = true;
    setTimeLeft(seconds);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const remaining = Math.max(0, seconds - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0 && timerRef.current) {
        clearInterval(timerRef.current);
        timerActiveRef.current = false;
      }
    }, 50);
  };

  // Fallback: if Game mounts and the timer event was missed, start from gameState
  useEffect(() => {
    if (
      gameState?.timerRemaining != null &&
      gameState.timerRemaining > 0 &&
      !timerActiveRef.current
    ) {
      setFeedback(null);
      setRevealAnswer(null);
      setAnswer("");
      startCountdown(gameState.timerRemaining);
    }
  }, [gameState?.timerRemaining, gameState?.round, gameState?.questionIndex]);

  useEffect(() => {
    const handleTimerStart = ({ seconds }: TimerStartData) => {
      setFeedback(null);
      setRevealAnswer(null);
      setAnswer("");
      startCountdown(seconds);
    };

    const handleCorrect = ({
      playerName,
      points,
      answer: correctAns,
    }: CorrectFeedback) => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerActiveRef.current = false;
      setFeedback({ type: "correct", playerName, points, answer: correctAns });
    };

    const handleWrong = () => {
      setFeedback({ type: "wrong" });
      setTimeout(() => setFeedback(null), 1000); // Shorter flash for wrong
    };

    const handleReveal = ({ correctAnswer }: RevealData) => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerActiveRef.current = false;
      setRevealAnswer(correctAnswer);
    };

    const handleEnd = (data: GameEndResult) => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerActiveRef.current = false;
      onGameEnd(data);
    };

    socket.on("game:timerStart", handleTimerStart);
    socket.on("game:correct", handleCorrect);
    socket.on("game:wrong", handleWrong);
    socket.on("game:reveal", handleReveal);
    socket.on("game:end", handleEnd);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerActiveRef.current = false;
      socket.off("game:timerStart", handleTimerStart);
      socket.off("game:correct", handleCorrect);
      socket.off("game:wrong", handleWrong);
      socket.off("game:reveal", handleReveal);
      socket.off("game:end", handleEnd);
    };
  }, [onGameEnd]);

  useEffect(() => {
    if (isMyTurn && inputRef.current && !feedback && !revealAnswer) {
      inputRef.current.focus();
    }
  }, [isMyTurn, gameState?.activePlayerId, feedback, revealAnswer]);

  if (!gameState) return null;

  const submit = () => {
    if (!answer.trim() || !isMyTurn) return;
    socket.emit("game:answer", { answer: answer.trim() });
    setAnswer("");
    // Clear input while waiting for server response
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit();
  };

  const timerPercent = (timeLeft / 15) * 100;
  // Orange to Red gradient for timer
  const timerColor =
    timeLeft > 5
      ? "bg-[var(--accent-color)]"
      : "bg-[var(--accent-hover)] animate-pulse";

  const sortedPlayers = [...(gameState.players || [])].sort(
    (a, b) => b.score - a.score,
  );

  return (
    <div className="w-full max-w-5xl mx-auto px-4 flex flex-col lg:flex-row gap-6">
      {/* Main game area */}
      <motion.div layout className="flex-1 min-w-0 flex flex-col">
        {/* Header Badges */}
        <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2 scrollbar-none">
          <span className="flex-shrink-0 text-xs font-bold uppercase tracking-widest text-[#111] bg-white px-3 py-1.5 rounded-full">
            {t("game.round")} {gameState.round}{" "}
            <span className="text-[#111] mx-1">/</span> {gameState.totalRounds}
          </span>
          <span className="flex-shrink-0 text-xs font-bold uppercase tracking-widest text-[var(--accent-color)] border border-[var(--accent-color)]/30 bg-[var(--accent-color)]/10 px-3 py-1.5 rounded-full">
            {gameState.category}
          </span>
          <span className="flex-shrink-0 flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-yellow-400 border border-yellow-400/30 bg-yellow-400/10 px-3 py-1.5 rounded-full">
            <Trophy size={14} />
            {gameState.questionPoints} {t("game.points")}
          </span>
        </div>

        {/* Timer */}
        <div className="relative w-full h-3 bg-white/5 rounded-full mb-8 overflow-hidden">
          <motion.div
            className={`absolute top-0 left-0 h-full rounded-full ${timerColor}`}
            initial={{ width: "100%" }}
            animate={{ width: `${timerPercent}%` }}
            transition={{ ease: "linear", duration: 0.1 }}
          />
        </div>

        {/* Question Box */}
        <motion.div
          key={gameState.questionText}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111] border border-white/10 rounded-3xl p-6 md:p-8 mb-6 relative shadow-2xl"
        >
          <div className="absolute -top-3 left-8 bg-[var(--accent-color)] text-[#111] text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full">
            {t("game.questionBadge")}
          </div>
          <p className="text-xl md:text-2xl font-medium text-white leading-relaxed">
            {gameState.questionText}
          </p>
        </motion.div>

        {/* AI Hint Section */}
        <AnimatePresence mode="popLayout">
          {gameState.hintText && (
            <motion.div
              key={gameState.hintText}
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: "auto", scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-5 mb-6 relative overflow-hidden"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-widest mb-2">
                <Lightbulb size={16} />
                {t("game.aiHint")}
              </div>
              <p className="text-purple-200/90 text-[15px] leading-relaxed relative z-10">
                {gameState.hintText}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback Section */}
        <AnimatePresence mode="popLayout">
          {feedback?.type === "correct" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 mb-6 text-center shadow-[0_0_30px_rgba(34,197,94,0.1)] relative overflow-hidden"
            >
              <CheckCircle2 size={40} className="text-green-400 mx-auto mb-3" />
              <p className="text-green-400 text-lg font-bold">
                {feedback.playerName}{" "}
                {t("game.guessedIt", { points: feedback.points })}
              </p>
              <p className="text-green-300/70 text-sm mt-2 font-medium">
                {feedback.answer}
              </p>
            </motion.div>
          )}

          {revealAnswer && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 mb-6 text-center"
            >
              <p className="text-yellow-500/70 text-sm font-bold uppercase tracking-widest mb-2">
                {t("game.correctAnswer")}
              </p>
              <p className="text-yellow-400 text-3xl font-black">
                {revealAnswer}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-auto"></div>

        {/* Turn indicator + input area */}
        <motion.div
          animate={isMyTurn ? { y: 0, opacity: 1 } : { y: 0, opacity: 0.8 }}
          className={`mt-4 p-5 rounded-3xl border transition-colors duration-300 ${
            isMyTurn
              ? "bg-[var(--accent-color)]/5 border-[var(--accent-color)]/30 ring-1 ring-[var(--accent-color)]/20 shadow-[0_0_30px_rgba(249,115,22,0.1)]"
              : "bg-white/5 border-white/5"
          }`}
        >
          <div className="flex items-center gap-2 mb-4">
            {isMyTurn ? (
              <div className="flex items-center gap-2 text-[var(--accent-color)] font-bold uppercase tracking-widest text-sm">
                <Timer size={18} className="animate-pulse" />
                {t("game.yourTurn")}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-white/50 font-bold uppercase tracking-widest text-sm">
                <Users size={18} />
                {t("game.waiting")}{" "}
                <span className="text-white">{gameState.activePlayerName}</span>{" "}
                {t("game.toAnswer")}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!isMyTurn || !!feedback || !!revealAnswer}
              placeholder={isMyTurn ? t("game.answerPlaceholder") : ""}
              className={`flex-1 min-w-0 bg-black/40 border rounded-2xl px-4 py-3 md:px-5 md:py-4 text-white text-base md:text-lg placeholder-white/20 focus:outline-none transition-all
                ${isMyTurn ? "border-[var(--accent-color)]/30 focus:border-[var(--accent-color)] shadow-inner" : "border-white/5 cursor-not-allowed"}
                ${feedback?.type === "wrong" ? "border-red-500/50 bg-red-500/10 text-red-100 animate-[shake_0.5s_ease-in-out]" : ""}
              `}
            />
            <button
              onClick={submit}
              disabled={
                !isMyTurn || !answer.trim() || !!feedback || !!revealAnswer
              }
              className="bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] disabled:bg-white/5 disabled:text-white/20 text-black px-5 md:px-6 shrink-0 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.05] disabled:hover:scale-100 flex items-center justify-center cursor-pointer shadow-lg"
            >
              <Send size={24} />
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Sidebar leaderboard */}
      <motion.div layout className="lg:w-72 shrink-0">
        <div className="bg-[#111] border border-white/5 rounded-3xl p-5 sticky top-6">
          <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Trophy size={14} />
            {t("game.leaderboard")}
          </h3>
          <div className="space-y-2">
            <AnimatePresence>
              {sortedPlayers.map((p, i) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={p.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                    p.id === socket.id
                      ? "bg-[var(--accent-color)]/10 border-[var(--accent-color)]/20"
                      : "bg-white/5 border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-black ${i === 0 ? "text-yellow-400" : "text-white/30"}`}
                    >
                      {i + 1}
                    </span>
                    <span
                      className={`font-medium ${p.id === socket.id ? "text-[var(--accent-color)]" : "text-white/80"}`}
                    >
                      {p.name}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-bold tracking-tight text-white/50">
                    <span className="text-white mr-1">{p.score}</span>pt
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Keyframes for shake animation on wrong answer */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}
