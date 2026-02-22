import { Users } from "lucide-react";
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
  const [gameError, setGameError] = useState<string | null>(null);

  // Auto-reconnect on socket connect (handles page refresh)
  useEffect(() => {
    const attemptReconnect = () => {
      socket.emit(
        "player:reconnect",
        (res: {
          found: boolean;
          screen?: string;
          lobby?: LobbyInfo;
          gameState?: GameState;
        }) => {
          if (!res?.found) return;
          setLobby(res.lobby!);
          setPlayerName(localStorage.getItem("kosquiz_name") || "");
          if (res.screen === "game" && res.gameState) {
            setGameState(res.gameState);
            setScreen("game");
          } else {
            setScreen("lobby");
          }
        },
      );
    };

    if (socket.connected) attemptReconnect();
    socket.on("connect", attemptReconnect);
    return () => {
      socket.off("connect", attemptReconnect);
    };
  }, []);

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
      setGameError(null);
    };

    const handleGameError = (data: { message: string }) => {
      if (screen === "game") {
        setGameError(data.message);
      } else {
        setInitialLobbyError(data.message);
        setScreen("lobby");
        setGameState(null);
        setEndResults(null);
      }
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

  const dismissGameError = () => {
    setGameError(null);
    setGameState(null);
    setEndResults(null);
    setScreen("lobby");
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
      <header className="relative flex items-center justify-between px-8 py-6 border-b border-white/5 bg-[#0b0f19]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="w-32" />
        <button
          onClick={returnToHome}
          className="text-3xl font-black tracking-widest uppercase cursor-pointer text-[var(--accent-color)] hover:text-[var(--accent-hover)] transition-all hover:scale-105 active:scale-95"
        >
          {t("appName")}
        </button>
        <div className="w-32 flex justify-end">
          <LanguageSwitcher />
        </div>
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
          <>
            <Game gameState={gameState} onGameEnd={handleGameEnd} />
            {gameError && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-[#111] border border-white/10 rounded-3xl p-8 max-w-sm mx-4 text-center shadow-2xl">
                  <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <Users size={28} className="text-red-400" />
                  </div>
                  <p className="text-white text-lg font-bold mb-2">
                    {t("end.gameOver")}
                  </p>
                  <p className="text-white/50 text-sm mb-6">{t(gameError)}</p>
                  <button
                    onClick={dismissGameError}
                    className="bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-black px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-sm transition-all hover:scale-[1.05] active:scale-95 cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        {screen === "end" && (
          <EndScreen results={endResults} onPlayAgain={handlePlayAgain} />
        )}
      </main>
    </div>
  );
}
