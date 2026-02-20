import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import socket from '../socket';
import type { LobbyInfo } from '../types';

interface LobbyProps {
  lobby: LobbyInfo;
  playerName: string;
}

export default function Lobby({ lobby }: LobbyProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const isHost = lobby.hostId === socket.id;
  const canStart = lobby.players.length >= 2;

  const copyCode = () => {
    navigator.clipboard.writeText(lobby.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const startGame = () => {
    socket.emit('game:start', (res: { error?: string; ok?: boolean }) => {
      if (res?.error) setError(res.error);
    });
  };

  return (
    <div className="max-w-sm mx-auto px-4">
      <h2 className="text-xl font-bold text-white text-center mb-4">{t('lobby.title')}</h2>

      {/* Lobby code */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <span className="text-xs text-slate-400 uppercase">{t('lobby.code')}:</span>
        <button
          onClick={copyCode}
          className="font-mono text-lg tracking-[0.3em] text-indigo-400 bg-slate-800 border border-slate-700 px-4 py-1.5 rounded hover:border-indigo-500 transition-colors cursor-pointer"
        >
          {lobby.code}
        </button>
        {copied && <span className="text-xs text-green-400">{t('lobby.copied')}</span>}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {/* Player list */}
      <div className="bg-slate-800/50 border border-slate-700 rounded p-3 mb-4">
        <h3 className="text-xs text-slate-400 uppercase mb-2">{t('lobby.players')}</h3>
        <div className="space-y-1.5">
          {lobby.players.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-white">
                {p.name}
                {p.id === socket.id && (
                  <span className="text-indigo-400 text-xs ml-1.5">({t('lobby.you')})</span>
                )}
              </span>
              {p.id === lobby.hostId && (
                <span className="text-xs text-amber-400/80 bg-amber-400/10 px-1.5 py-0.5 rounded">
                  {t('lobby.host')}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Waiting / Start */}
      {isHost ? (
        <button
          onClick={startGame}
          disabled={!canStart}
          className={`w-full text-sm font-medium py-2.5 rounded transition-colors cursor-pointer ${
            canStart
              ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          {canStart ? t('lobby.startGame') : t('lobby.needMorePlayers')}
        </button>
      ) : (
        <p className="text-center text-sm text-slate-500">{t('lobby.waitingForPlayers')}</p>
      )}
    </div>
  );
}
