import { useTranslation } from 'react-i18next';
import socket from '../socket';
import type { GameEndResult } from '../types';

interface EndScreenProps {
  results: GameEndResult | null;
  onPlayAgain: () => void;
}

export default function EndScreen({ results, onPlayAgain }: EndScreenProps) {
  const { t } = useTranslation();

  if (!results?.players?.length) return null;

  const sorted = [...results.players].sort((a, b) => b.score - a.score);
  const topScore = sorted[0].score;
  const winners = sorted.filter(p => p.score === topScore);
  const isTie = winners.length > 1;

  return (
    <div className="max-w-sm mx-auto px-4 text-center">
      <h2 className="text-2xl font-bold text-white mb-6">{t('end.gameOver')}</h2>

      {/* Winner */}
      <div className="bg-slate-800/50 border border-slate-700 rounded p-4 mb-4">
        {isTie ? (
          <p className="text-amber-400 font-medium">{t('end.tie')}</p>
        ) : (
          <p className="text-xs text-slate-400 uppercase mb-1">{t('end.winner')}</p>
        )}
        <p className="text-xl text-white font-bold">
          {winners.map(w => w.name).join(' & ')}
        </p>
        <p className="text-indigo-400 text-sm">
          {topScore} {t('end.points')}
        </p>
      </div>

      {/* All scores */}
      <div className="bg-slate-800/50 border border-slate-700 rounded p-3 mb-6">
        <h3 className="text-xs text-slate-400 uppercase mb-2">{t('end.finalScores')}</h3>
        <div className="space-y-1.5">
          {sorted.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center justify-between text-sm ${
                p.id === socket.id ? 'text-indigo-400' : 'text-slate-300'
              }`}
            >
              <span>
                <span className="text-slate-500 text-xs mr-1.5">{i + 1}.</span>
                {p.name}
              </span>
              <span className="font-mono text-xs">{p.score} {t('end.points')}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onPlayAgain}
        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium py-2.5 rounded transition-colors cursor-pointer"
      >
        {t('end.playAgain')}
      </button>
    </div>
  );
}
