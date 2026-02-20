import { useState, useEffect, useRef, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import socket from '../socket';
import type { GameState, GameEndResult, CorrectFeedback, RevealData, TimerStartData } from '../types';

interface Feedback {
  type: 'correct';
  playerName: string;
  points: number;
  answer: string;
}

interface GameProps {
  gameState: GameState | null;
  onGameEnd: (data: GameEndResult) => void;
}

export default function Game({ gameState, onGameEnd }: GameProps) {
  const { t } = useTranslation();
  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(15);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [revealAnswer, setRevealAnswer] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isMyTurn = gameState?.activePlayerId === socket.id;

  useEffect(() => {
    const handleTimerStart = ({ seconds }: TimerStartData) => {
      setTimeLeft(seconds);
      setFeedback(null);
      setRevealAnswer(null);
      setAnswer('');
      if (timerRef.current) clearInterval(timerRef.current);
      const start = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - start) / 1000;
        const remaining = Math.max(0, seconds - elapsed);
        setTimeLeft(remaining);
        if (remaining <= 0 && timerRef.current) clearInterval(timerRef.current);
      }, 50);
    };

    const handleCorrect = ({ playerName, points, answer: correctAns }: CorrectFeedback) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setFeedback({ type: 'correct', playerName, points, answer: correctAns });
    };

    const handleWrong = () => {
      // Brief flash, state update will come from server
    };

    const handleReveal = ({ correctAnswer }: RevealData) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setRevealAnswer(correctAnswer);
    };

    const handleEnd = (data: GameEndResult) => {
      if (timerRef.current) clearInterval(timerRef.current);
      onGameEnd(data);
    };

    socket.on('game:timerStart', handleTimerStart);
    socket.on('game:correct', handleCorrect);
    socket.on('game:wrong', handleWrong);
    socket.on('game:reveal', handleReveal);
    socket.on('game:end', handleEnd);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      socket.off('game:timerStart', handleTimerStart);
      socket.off('game:correct', handleCorrect);
      socket.off('game:wrong', handleWrong);
      socket.off('game:reveal', handleReveal);
      socket.off('game:end', handleEnd);
    };
  }, [onGameEnd]);

  useEffect(() => {
    if (isMyTurn && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMyTurn, gameState?.activePlayerId]);

  if (!gameState) return null;

  const submit = () => {
    if (!answer.trim() || !isMyTurn) return;
    socket.emit('game:answer', { answer: answer.trim() });
    setAnswer('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submit();
  };

  const timerPercent = (timeLeft / 15) * 100;
  const timerColor = timeLeft > 5 ? 'bg-indigo-500' : timeLeft > 2 ? 'bg-amber-500' : 'bg-red-500';

  const sortedPlayers = [...(gameState.players || [])].sort((a, b) => b.score - a.score);

  const questionLabel = gameState.questionIndex === 0 ? '3' : gameState.questionIndex === 1 ? '2' : '1';

  return (
    <div className="max-w-4xl mx-auto px-4 flex flex-col lg:flex-row gap-4">
      {/* Main game area */}
      <div className="flex-1 min-w-0">
        {/* Round & category header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-slate-400">
            {t('game.round')} {gameState.round} {t('game.of')} {gameState.totalRounds}
          </span>
          <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
            {gameState.category}
          </span>
          <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
            {questionLabel} {t('game.points')}
          </span>
        </div>

        {/* Timer bar */}
        <div className="w-full h-1.5 bg-slate-800 rounded-full mb-4 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-100 ease-linear ${timerColor}`}
            style={{ width: `${timerPercent}%` }}
          />
        </div>

        {/* Question */}
        <div className="bg-slate-800/50 border border-slate-700 rounded p-4 mb-4">
          <p className="text-white text-sm leading-relaxed">{gameState.questionText}</p>
        </div>

        {/* AI Hint */}
        {gameState.hintText && (
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded p-3 mb-4">
            <p className="text-xs text-indigo-400 font-medium mb-1">{t('game.aiHint')}</p>
            <p className="text-sm text-indigo-200">{gameState.hintText}</p>
          </div>
        )}

        {/* Feedback */}
        {feedback?.type === 'correct' && (
          <div className="bg-green-500/10 border border-green-500/30 rounded p-3 mb-4 text-center">
            <p className="text-green-400 text-sm font-medium">
              {feedback.playerName} — {t('game.correct')} +{feedback.points} {t('game.points')}
            </p>
            <p className="text-green-300 text-xs mt-1">{feedback.answer}</p>
          </div>
        )}

        {revealAnswer && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded p-3 mb-4 text-center">
            <p className="text-amber-400 text-sm">
              {t('game.correctAnswer')}: <span className="font-medium">{revealAnswer}</span>
            </p>
          </div>
        )}

        {/* Turn indicator + input */}
        <div className="mb-2">
          <p className={`text-xs mb-2 ${isMyTurn ? 'text-green-400 font-medium' : 'text-slate-500'}`}>
            {isMyTurn
              ? t('game.yourTurn')
              : `${t('game.waiting')} ${gameState.activePlayerName} ${t('game.toAnswer')}`}
          </p>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!isMyTurn}
              placeholder={isMyTurn ? t('game.answerPlaceholder') : ''}
              className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-40"
            />
            <button
              onClick={submit}
              disabled={!isMyTurn || !answer.trim()}
              className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium px-4 py-2 rounded transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {t('game.submit')}
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar leaderboard */}
      <div className="lg:w-48 shrink-0">
        <div className="bg-slate-800/50 border border-slate-700 rounded p-3">
          <h3 className="text-xs text-slate-400 uppercase mb-2">{t('game.leaderboard')}</h3>
          <div className="space-y-1.5">
            {sortedPlayers.map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center justify-between text-sm ${
                  p.id === socket.id ? 'text-indigo-400' : 'text-slate-300'
                }`}
              >
                <span className="truncate">
                  <span className="text-slate-500 text-xs mr-1.5">{i + 1}.</span>
                  {p.name}
                </span>
                <span className="font-mono text-xs ml-2">{p.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
