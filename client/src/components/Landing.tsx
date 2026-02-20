import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import socket from '../socket';
import type { LobbyInfo, PublicLobby } from '../types';

interface LandingProps {
  onJoinLobby: (lobby: LobbyInfo, name: string) => void;
}

export default function Landing({ onJoinLobby }: LandingProps) {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [publicLobbies, setPublicLobbies] = useState<PublicLobby[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    socket.emit('lobby:list', (lobbies: PublicLobby[]) => {
      setPublicLobbies(lobbies || []);
    });

    const handleUpdate = (lobbies: PublicLobby[]) => setPublicLobbies(lobbies || []);
    socket.on('lobbies:update', handleUpdate);
    return () => { socket.off('lobbies:update', handleUpdate); };
  }, []);

  const handleCreate = () => {
    if (!name.trim()) return setError(t('landing.namePlaceholder'));
    setError('');
    socket.emit(
      'lobby:create',
      { name: name.trim(), lang: i18n.language, isPublic },
      (res: { error?: string; lobby?: LobbyInfo }) => {
        if (res.error) return setError(res.error);
        onJoinLobby(res.lobby!, name.trim());
      },
    );
  };

  const handleJoin = (lobbyCode: string) => {
    if (!name.trim()) return setError(t('landing.namePlaceholder'));
    setError('');
    socket.emit(
      'lobby:join',
      { name: name.trim(), lang: i18n.language, code: lobbyCode },
      (res: { error?: string; lobby?: LobbyInfo }) => {
        if (res.error) return setError(res.error);
        onJoinLobby(res.lobby!, name.trim());
      },
    );
  };

  return (
    <div className="max-w-md mx-auto px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">{t('landing.title')}</h1>
        <p className="text-slate-400 text-sm">{t('landing.subtitle')}</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded mb-4">
          {error}
        </div>
      )}

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('landing.namePlaceholder')}
        maxLength={20}
        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 mb-4"
      />

      {/* Create lobby */}
      <div className="bg-slate-800/50 border border-slate-700 rounded p-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="radio"
              checked={isPublic}
              onChange={() => setIsPublic(true)}
              className="accent-indigo-500"
            />
            {t('landing.publicLobby')}
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="radio"
              checked={!isPublic}
              onChange={() => setIsPublic(false)}
              className="accent-indigo-500"
            />
            {t('landing.privateLobby')}
          </label>
        </div>
        <button
          onClick={handleCreate}
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium py-2 rounded transition-colors cursor-pointer"
        >
          {t('landing.createLobby')}
        </button>
      </div>

      {/* Join by code */}
      <div className="bg-slate-800/50 border border-slate-700 rounded p-4 mb-4">
        <p className="text-sm text-slate-400 mb-2">{t('landing.lobbyCode')}</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={t('landing.codePlaceholder')}
            maxLength={6}
            className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white placeholder-slate-500 text-sm font-mono tracking-widest focus:outline-none focus:border-indigo-500 uppercase"
          />
          <button
            onClick={() => handleJoin(code)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded transition-colors cursor-pointer"
          >
            {t('landing.join')}
          </button>
        </div>
      </div>

      {/* Public lobbies */}
      <div>
        <h2 className="text-sm font-medium text-slate-400 mb-2">{t('landing.publicLobbies')}</h2>
        {publicLobbies.length === 0 ? (
          <p className="text-xs text-slate-500">{t('landing.noPublicLobbies')}</p>
        ) : (
          <div className="space-y-2">
            {publicLobbies.map((lobby) => (
              <div
                key={lobby.code}
                className="flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded px-3 py-2"
              >
                <div>
                  <span className="text-sm text-white font-mono">{lobby.code}</span>
                  <span className="text-xs text-slate-500 ml-2">
                    {t('landing.hostedBy')}: {lobby.hostName}
                  </span>
                  <span className="text-xs text-slate-500 ml-2">
                    {lobby.playerCount} {t('landing.players')}
                  </span>
                </div>
                <button
                  onClick={() => handleJoin(lobby.code)}
                  className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-xs px-3 py-1 rounded transition-colors cursor-pointer"
                >
                  {t('landing.join')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
