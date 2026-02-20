import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import socket from './socket';
import LanguageSwitcher from './components/LanguageSwitcher';
import Landing from './components/Landing';
import Lobby from './components/Lobby';
import Game from './components/Game';
import EndScreen from './components/EndScreen';
import type { LobbyInfo, GameState, GameEndResult } from './types';

type Screen = 'landing' | 'lobby' | 'game' | 'end';

export default function App() {
  const { t } = useTranslation();
  const [screen, setScreen] = useState<Screen>('landing');
  const [lobby, setLobby] = useState<LobbyInfo | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [endResults, setEndResults] = useState<GameEndResult | null>(null);

  useEffect(() => {
    const handleLobbyUpdated = (data: LobbyInfo) => {
      setLobby(data);
    };

    const handleGameState = (data: GameState) => {
      setGameState(data);
      if (screen !== 'game') setScreen('game');
    };

    const handleGameReset = () => {
      setScreen('lobby');
      setGameState(null);
      setEndResults(null);
    };

    socket.on('lobby:updated', handleLobbyUpdated);
    socket.on('game:state', handleGameState);
    socket.on('game:reset', handleGameReset);

    return () => {
      socket.off('lobby:updated', handleLobbyUpdated);
      socket.off('game:state', handleGameState);
      socket.off('game:reset', handleGameReset);
    };
  }, [screen]);

  const handleJoinLobby = (lobbyData: LobbyInfo, name: string) => {
    setLobby(lobbyData);
    setPlayerName(name);
    setScreen('lobby');
  };

  const handleGameEnd = useCallback((data: GameEndResult) => {
    setEndResults(data);
    setScreen('end');
  }, []);

  const handlePlayAgain = () => {
    socket.emit('game:playAgain');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <span className="text-sm font-bold text-white tracking-wide">{t('appName')}</span>
        <LanguageSwitcher />
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center py-8">
        {screen === 'landing' && <Landing onJoinLobby={handleJoinLobby} />}
        {screen === 'lobby' && lobby && <Lobby lobby={lobby} playerName={playerName} />}
        {screen === 'game' && <Game gameState={gameState} onGameEnd={handleGameEnd} />}
        {screen === 'end' && <EndScreen results={endResults} onPlayAgain={handlePlayAgain} />}
      </main>
    </div>
  );
}
