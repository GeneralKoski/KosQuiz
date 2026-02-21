import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import EndScreen from "./components/EndScreen";
import Game from "./components/Game";
import Landing from "./components/Landing";
import LanguageSwitcher from "./components/LanguageSwitcher";
import Lobby from "./components/Lobby";
import socket from "./socket";
import type { GameEndResult, GameState, LobbyInfo } from "./types";

type Screen = "landing" | "lobby" | "game" | "end";

export default function App() {
  const { t } = useTranslation();
  const [screen, setScreen] = useState<Screen>("landing");
  const [lobby, setLobby] = useState<LobbyInfo | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [endResults, setEndResults] = useState<GameEndResult | null>(null);
  const [initialLobbyError, setInitialLobbyError] = useState("");

  useEffect(() => {
    const handleLobbyUpdated = (data: LobbyInfo) => {
      setLobby(data);
    };

    const handleGameState = (data: GameState) => {
      setGameState(data);
      if (screen !== "game") setScreen("game");
    };

    const handleGameReset = () => {
      setScreen("lobby");
      setGameState(null);
      setEndResults(null);
    };

    const handleGameError = (data: { message: string }) => {
      setInitialLobbyError(data.message);
      setScreen("lobby");
      setGameState(null);
      setEndResults(null);
    };

    socket.on("lobby:updated", handleLobbyUpdated);
    socket.on("game:state", handleGameState);
    socket.on("game:reset", handleGameReset);
    socket.on("game:error", handleGameError);

    return () => {
      socket.off("lobby:updated", handleLobbyUpdated);
      socket.off("game:state", handleGameState);
      socket.off("game:reset", handleGameReset);
      socket.off("game:error", handleGameError);
    };
  }, [screen]);

  const handleJoinLobby = (lobbyData: LobbyInfo, name: string) => {
    setLobby(lobbyData);
    setPlayerName(name);
    setScreen("lobby");
  };

  const handleGameEnd = useCallback((data: GameEndResult) => {
    setEndResults(data);
    setScreen("end");
  }, []);

  const handlePlayAgain = () => {
    socket.emit("game:playAgain");
  };

  const returnToHome = () => {
    socket.emit("lobby:leave"); // Custom event if needed, but socket disconnects logic is on the server usually, we can just reload or do a simple state reset here. Actually we can just disconnect and reconnect if needed, but let's just emit 'lobby:leave' if we implement it, or just reset state.
    setLobby(null);
    setGameState(null);
    setEndResults(null);
    setScreen("landing");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="relative flex items-center justify-end px-4 py-3 border-b border-white/5">
        <button
          onClick={returnToHome}
          className="absolute left-1/2 -translate-x-1/2 text-3xl font-black tracking-widest uppercase cursor-pointer text-[var(--accent-color)] hover:text-[var(--accent-hover)] transition-colors"
        >
          {t("appName")}
        </button>
        <LanguageSwitcher />
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center py-8">
        {screen === "landing" && <Landing onJoinLobby={handleJoinLobby} />}
        {screen === "lobby" && lobby && (
          <Lobby
            lobby={lobby}
            playerName={playerName}
            initialError={initialLobbyError}
            onClearError={() => setInitialLobbyError("")}
          />
        )}
        {screen === "game" && (
          <Game gameState={gameState} onGameEnd={handleGameEnd} />
        )}
        {screen === "end" && (
          <EndScreen results={endResults} onPlayAgain={handlePlayAgain} />
        )}
      </main>
    </div>
  );
}
