import cors from "cors";
import "dotenv/config";
import express from "express";
import Groq from "groq-sdk";
import { createServer } from "http";
import { Server } from "socket.io";
import { dao } from "./db.js";
import roundsDb from "./questions.js";

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const lobbies = new Map();
const tokens = new Map(); // token → { lobbyCode, playerName, disconnectTimer }
const TOKEN_MAX_EVENTS = 30;
const TOKEN_WINDOW_MS = 10_000;
const REJOIN_GRACE_MS = 10_000;

// -- Boot: restore da DB --
const { lobbies: dbLobbies, tokens: dbTokens } = dao.loadAll();
for (const dt of dbTokens) {
  tokens.set(dt.token, {
    lobbyCode: dt.lobby_code,
    playerName: dt.player_name,
    disconnectTimer: null,
  });
}
for (const dl of dbLobbies) {
  const l = dl.dbLobby;
  const lobby = {
    code: l.code,
    isPublic: l.is_public === 1,
    hostId: null,
    players: dl.players.map((p) => ({
      id: p.token, // temporary id until reconnect
      token: p.token,
      name: p.name,
      lang: p.lang,
      score: p.score,
      disconnected: true,
    })),
    state: l.state,
    difficulty: l.difficulty,
    category: l.category,
    game: dl.game,
  };
  lobby.hostId =
    lobby.players.find((p) => p.token === l.host_token)?.id ||
    lobby.players[0]?.id;

  if (lobby.game && lobby.state === "playing") {
    const g = lobby.game;
    if (g.timerStartedAt && g.timerSeconds) {
      const elapsed = Date.now() - g.timerStartedAt;
      const remainingMs = g.timerSeconds * 1000 - elapsed;
      if (remainingMs <= 0) {
        setTimeout(() => handleTurnEnd(lobby, null), 100);
      } else {
        g.timerSeconds = remainingMs / 1000;
        g.timerStartedAt = Date.now();
        g.timer = setTimeout(() => {
          if (!g.isCheckingAnswer) handleTurnEnd(lobby, null);
        }, remainingMs);
      }
    }
  }

  if (lobby.players.length === 0) {
    dao.deleteLobby(l.code);
  } else {
    lobbies.set(l.code, lobby);
  }
}

// Clean up dead tokens
for (const [t, data] of tokens) {
  if (!lobbies.has(data.lobbyCode)) {
    tokens.delete(t);
    dao.leaveLobby(data.lobbyCode, t);
  }
}
// -------------------------

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code;
  do {
    code = "";
    for (let i = 0; i < 6; i++)
      code += chars[Math.floor(Math.random() * chars.length)];
  } while (lobbies.has(code));
  return code;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createLobby(hostSocket, hostName, hostLang, isPublic, token) {
  const code = generateCode();
  const lobby = {
    code,
    isPublic,
    hostId: hostSocket.id,
    players: [
      { id: hostSocket.id, token, name: hostName, lang: hostLang, score: 0 },
    ],
    state: "waiting",
    difficulty: "turn", // default
    category: "random", // default
    game: null,
  };
  lobbies.set(code, lobby);
  hostSocket.join(code);
  if (token) {
    dao.createLobby(code, token, isPublic, "turn", "random", "waiting");
    dao.joinLobby(code, token, hostName, hostLang, 0);
  }
  return lobby;
}

function getPublicLobbies() {
  const list = [];
  for (const [code, lobby] of lobbies) {
    if (lobby.isPublic && lobby.state === "waiting") {
      list.push({
        code,
        playerCount: lobby.players.length,
        hostName: lobby.players.find((p) => p.id === lobby.hostId)?.name || "?",
      });
    }
  }
  return list;
}

function lobbyInfo(lobby) {
  return {
    code: lobby.code,
    isPublic: lobby.isPublic,
    hostId: lobby.hostId,
    players: lobby.players.map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      disconnected: !!p.disconnected,
    })),
    state: lobby.state,
    difficulty: lobby.difficulty,
  };
}

function buildGameState(lobby, difficulty) {
  let pool = roundsDb;
  if (lobby.category && lobby.category !== "random") {
    // try to match english name natively used as id
    pool = roundsDb.filter(
      (r) => r.category.en.toLowerCase() === lobby.category.toLowerCase(),
    );
    if (pool.length < 5) pool = roundsDb; // fallback to all if a category doesn't have enough queries
  }

  const selectedRounds = shuffleArray(pool).slice(0, 5);
  const roundsState = selectedRounds.map((r) => ({
    ...r,
    selectedHints: {
      hard: shuffleArray(r.hard.hints),
      medium: shuffleArray(r.medium.hints),
      easy: shuffleArray(r.easy.hints),
    },
  }));

  return {
    rounds: roundsState,
    difficulty, // 'turn' | 'easy' | 'medium' | 'hard'
    currentRound: 0,
    currentQuestion: 0, // 0..2 (turns/hints within a round)
    turnOrder: lobby.players.filter((p) => !p.disconnected).map((p) => p.id),
    currentTurnIndex: 0,
    phase: "question",
    hintText: null,
    timer: null,
    answeredThisRotation: new Set(),
    isCheckingAnswer: false, // Prevent race conditions during Groq calls
  };
}

function currentRound(game) {
  return game.rounds[game.currentRound];
}

function currentQ(game) {
  const r = currentRound(game);
  if (game.difficulty === "turn") {
    if (game.currentQuestion === 0) return r.hard;
    if (game.currentQuestion === 1) return r.medium;
    return r.easy;
  }
  return r[game.difficulty];
}

function getCurrentHint(game, lang) {
  const r = currentRound(game);
  let diff;
  let hintIdx = game.currentQuestion;

  if (game.difficulty === "turn") {
    if (game.currentQuestion === 0) diff = "hard";
    else if (game.currentQuestion === 1) diff = "medium";
    else diff = "easy";
    hintIdx = 0; // Just use the first shuffled hint for that difficulty
  } else {
    diff = game.difficulty;
  }

  const hintObj = r.selectedHints[diff][hintIdx];
  return hintObj[lang] || hintObj.en;
}

function currentPlayerId(game) {
  return game.turnOrder[game.currentTurnIndex % game.turnOrder.length];
}

function emitGameState(lobby) {
  const game = lobby.game;
  const round = currentRound(game);
  const question = currentQ(game);
  const activePlayerId = currentPlayerId(game);

  for (const player of lobby.players) {
    const lang = player.lang || "en";
    io.to(player.id).emit("game:state", {
      round: game.currentRound + 1,
      totalRounds: game.rounds.length,
      category: round.category[lang] || round.category.en,
      questionText: question.question[lang] || question.question.en,
      questionPoints: question.points,
      questionIndex: game.currentQuestion,
      activePlayerId,
      activePlayerName:
        lobby.players.find((p) => p.id === activePlayerId)?.name || "?",
      phase: game.phase,
      hintText: game.currentQuestion >= 2 ? getCurrentHint(game, lang) : null,
      players: lobby.players.map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        disconnected: !!p.disconnected,
      })),
      timerRemaining: game.timerStartedAt
        ? Math.max(
            0,
            game.timerSeconds - (Date.now() - game.timerStartedAt) / 1000,
          )
        : null,
    });
  }
}

function emitReveal(lobby) {
  for (const player of lobby.players) {
    const lang = player.lang || "en";
    const r = currentRound(lobby.game);
    const answer = r.answer[lang] || r.answer.en;
    io.to(player.id).emit("game:reveal", { correctAnswer: answer });
  }
}

function clearTurnTimer(game) {
  if (game.timer) {
    clearTimeout(game.timer);
    game.timer = null;
  }
  game.timerStartedAt = null;
  game.timerSeconds = null;
}

function startTurnTimer(lobby) {
  const game = lobby.game;
  clearTurnTimer(game);

  game.timerStartedAt = Date.now();
  game.timerSeconds = 15;

  io.to(lobby.code).emit("game:timerStart", { seconds: 15 });

  game.timer = setTimeout(() => {
    if (!game.isCheckingAnswer) handleTurnEnd(lobby, null);
  }, 15000);
}

function advanceTurn(lobby) {
  const game = lobby.game;
  game.currentTurnIndex++;
  game.answeredThisRotation.add(currentPlayerId(game));

  const totalPlayers = game.turnOrder.length;
  const answersInRotation = game.answeredThisRotation.size;

  if (answersInRotation >= totalPlayers) {
    handleRotationEnd(lobby);
  } else {
    startTurnTimer(lobby);
    emitGameState(lobby);
    dao.saveGameState(lobby.code, lobby.game);
  }
}

async function handleRotationEnd(lobby) {
  const game = lobby.game;
  game.answeredThisRotation = new Set();

  if (game.currentQuestion < 2) {
    game.currentQuestion++;
    startTurnTimer(lobby);
    emitGameState(lobby);
    dao.saveGameState(lobby.code, game);
  } else {
    game.phase = "reveal";
    emitReveal(lobby);
    emitGameState(lobby);
    dao.saveGameState(lobby.code, game);

    setTimeout(() => {
      moveToNextRound(lobby);
    }, 3000);
  }
}

function moveToNextRound(lobby) {
  const game = lobby.game;
  clearTurnTimer(game);

  if (game.currentRound + 1 >= game.rounds.length) {
    game.phase = "gameEnd";
    lobby.state = "finished";

    dao.deleteGameState(lobby.code);
    dao.updateLobbyState(lobby.code, lobby.state);
    dao.saveGameEnd(lobby);

    io.to(lobby.code).emit("game:end", {
      players: lobby.players.map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
      })),
    });
  } else {
    game.currentRound++;
    game.currentQuestion = 0;
    game.phase = "question";
    game.answeredThisRotation = new Set();
    game.currentTurnIndex = game.currentRound % game.turnOrder.length;
    startTurnTimer(lobby);
    emitGameState(lobby);
    dao.saveGameState(lobby.code, lobby.game);
  }
}

async function checkAnswerWithAI(given, correct, questionText) {
  const normalize = (t) =>
    t
      .trim()
      .toLowerCase()
      .replace(/[^\w\s]/g, "");
  const gNorm = normalize(given);
  const cNorm = normalize(correct);

  if (gNorm === cNorm || (cNorm.includes(gNorm) && gNorm.length >= 4))
    return true;
  if (given.length < 3) return false;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a rigid quiz judge. Reply ONLY with 'YES' or 'NO'.",
        },
        {
          role: "user",
          content: `Question: "${questionText}". Official Answer: "${correct}". User Answer: "${given}". Is this acceptable as a very close minor typo, partial valid match, or direct translation? Only output YES or NO.`,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      max_tokens: 5,
    });

    const res = completion.choices[0]?.message?.content?.trim().toUpperCase();
    return res === "YES";
  } catch (e) {
    console.error("Groq Check Error:", e.message);
    return false;
  }
}

async function handleTurnEnd(lobby, answer) {
  const game = lobby.game;
  clearTurnTimer(game);

  if (answer !== null) {
    const activePlayerId = currentPlayerId(game);
    const player = lobby.players.find((p) => p.id === activePlayerId);
    if (!player) return advanceTurn(lobby);

    const lang = player.lang || "en";
    const q = currentQ(game);
    const r = currentRound(game);

    const correctAnswer = r.answer[lang] || r.answer.en;
    const questionText = q.question[lang] || q.question.en;

    game.isCheckingAnswer = true;
    const isCorrect = await checkAnswerWithAI(
      answer,
      correctAnswer,
      questionText,
    );
    game.isCheckingAnswer = false;

    // Check if the game is still acting on this turn (rare race condition but safe)
    if (lobby.state !== "playing" || currentPlayerId(game) !== activePlayerId)
      return;

    if (isCorrect) {
      player.score += q.points;
      if (player.token)
        dao.updatePlayerScore(lobby.code, player.token, player.score);
      io.to(lobby.code).emit("game:correct", {
        playerId: player.id,
        playerName: player.name,
        points: q.points,
        answer: correctAnswer,
      });

      setTimeout(() => {
        moveToNextRound(lobby);
      }, 2000);
      return;
    } else {
      io.to(lobby.code).emit("game:wrong", {
        playerId: activePlayerId,
      });
    }
  }

  advanceTurn(lobby);
}

io.on("connection", (socket) => {
  const token = socket.handshake.auth?.token || null;
  let currentLobbyCode = null;

  // Rate limiting per socket
  const rl = { count: 0, resetAt: Date.now() + TOKEN_WINDOW_MS };
  socket.use((packet, next) => {
    const now = Date.now();
    if (now > rl.resetAt) {
      rl.count = 0;
      rl.resetAt = now + TOKEN_WINDOW_MS;
    }
    rl.count++;
    if (rl.count > TOKEN_MAX_EVENTS) {
      return next(new Error("rate_limit"));
    }
    next();
  });

  socket.on("lobby:create", ({ name, lang, isPublic }, cb) => {
    if (!name || name.trim().length === 0)
      return cb?.({ error: "error.nameRequired" });
    const lobby = createLobby(
      socket,
      name.trim(),
      lang || "en",
      !!isPublic,
      token,
    );
    currentLobbyCode = lobby.code;
    if (token) {
      tokens.set(token, { lobbyCode: lobby.code, playerName: name.trim() });
    }
    cb?.({ lobby: lobbyInfo(lobby) });
    io.emit("lobbies:update", getPublicLobbies());
  });

  socket.on("lobby:updateSettings", ({ difficulty }) => {
    if (!currentLobbyCode) return;
    const lobby = lobbies.get(currentLobbyCode);
    if (!lobby || lobby.hostId !== socket.id) return;

    if (difficulty) lobby.difficulty = difficulty;
    dao.updateLobbySettings(lobby);
    io.to(lobby.code).emit("lobby:updated", lobbyInfo(lobby));
  });

  socket.on("lobby:join", ({ name, lang, code }, cb) => {
    if (!name || name.trim().length === 0)
      return cb?.({ error: "error.nameRequired" });
    const lobby = lobbies.get(code?.toUpperCase());
    if (!lobby) return cb?.({ error: "error.lobbyNotFound" });
    if (lobby.state !== "waiting")
      return cb?.({ error: "error.gameInProgress" });
    if (
      lobby.players.some(
        (p) => p.name.toLowerCase() === name.trim().toLowerCase(),
      )
    ) {
      return cb?.({ error: "error.nameTaken" });
    }
    if (token && lobby.players.some((p) => p.token === token)) {
      return cb?.({ error: "error.alreadyInLobby" });
    }

    lobby.players.push({
      id: socket.id,
      token,
      name: name.trim(),
      lang: lang || "en",
      score: 0,
    });
    socket.join(code.toUpperCase());
    currentLobbyCode = code.toUpperCase();
    if (token) {
      tokens.set(token, {
        lobbyCode: currentLobbyCode,
        playerName: name.trim(),
      });
      dao.joinLobby(currentLobbyCode, token, name.trim(), lang || "en", 0);
    }

    cb?.({ lobby: lobbyInfo(lobby) });
    io.to(lobby.code).emit("lobby:updated", lobbyInfo(lobby));
    io.emit("lobbies:update", getPublicLobbies());
  });

  socket.on("lobby:list", (cb) => {
    cb?.(getPublicLobbies());
  });

  socket.on("game:leaderboard", (cb) => {
    try {
      const data = dao.getLeaderboard();
      cb?.({ leaderboard: data });
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      cb?.({ error: "Failed to fetch leaderboard" });
    }
  });

  socket.on("game:start", ({ difficulty = "turn" } = {}, cb) => {
    if (!currentLobbyCode) return cb?.({ error: "error.notInLobby" });
    const lobby = lobbies.get(currentLobbyCode);
    if (!lobby) return cb?.({ error: "error.lobbyNotFound" });
    if (lobby.hostId !== socket.id) return cb?.({ error: "error.notHost" });
    const connectedPlayers = lobby.players.filter((p) => !p.disconnected);
    if (connectedPlayers.length < 2)
      return cb?.({ error: "error.needPlayers" });

    lobby.state = "playing";
    lobby.game = buildGameState(lobby, difficulty);
    lobby.players.forEach((p) => {
      p.score = 0;
      if (p.token) dao.updatePlayerScore(lobby.code, p.token, 0);
    });

    dao.updateLobbyState(lobby.code, lobby.state);
    dao.saveGameState(lobby.code, lobby.game);

    cb?.({ ok: true });
    startTurnTimer(lobby);
    emitGameState(lobby);
    io.emit("lobbies:update", getPublicLobbies());
  });

  socket.on("game:answer", ({ answer }) => {
    if (!currentLobbyCode) return;
    const lobby = lobbies.get(currentLobbyCode);
    if (!lobby || lobby.state !== "playing") return;

    const game = lobby.game;
    if (game.isCheckingAnswer) return; // Wait for LLM
    if (currentPlayerId(game) !== socket.id) return;
    if (game.phase === "reveal" || game.phase === "gameEnd") return;

    handleTurnEnd(lobby, answer);
  });

  socket.on("game:playAgain", () => {
    if (!currentLobbyCode) return;
    const lobby = lobbies.get(currentLobbyCode);
    if (!lobby) return;

    lobby.state = "waiting";
    lobby.game = null;
    lobby.players.forEach((p) => {
      p.score = 0;
      if (p.token) dao.updatePlayerScore(lobby.code, p.token, 0);
    });

    dao.updateLobbyState(lobby.code, lobby.state);
    dao.deleteGameState(lobby.code);

    io.to(lobby.code).emit("lobby:updated", lobbyInfo(lobby));
    io.to(lobby.code).emit("game:reset");
    io.emit("lobbies:update", getPublicLobbies());
  });

  socket.on("lobby:leave", () => {
    if (!currentLobbyCode) return;
    const lobby = lobbies.get(currentLobbyCode);
    if (!lobby) return;

    lobby.players = lobby.players.filter((p) => p.id !== socket.id);
    socket.leave(currentLobbyCode);
    if (token) {
      tokens.delete(token);
      dao.leaveLobby(currentLobbyCode, token);
    }
    currentLobbyCode = null;

    if (lobby.players.length === 0) {
      if (lobby.game) clearTurnTimer(lobby.game);
      lobbies.delete(lobby.code);
      dao.deleteLobby(lobby.code);
    } else {
      if (lobby.hostId === socket.id) {
        lobby.hostId = lobby.players[0].id;
        dao.updateLobbySettings(lobby);
      }

      if (lobby.state === "playing" && lobby.game) {
        const game = lobby.game;
        const wasActive = currentPlayerId(game) === socket.id;
        game.turnOrder = game.turnOrder.filter((id) => id !== socket.id);

        if (game.turnOrder.length < 2) {
          lobby.state = "waiting";
          clearTurnTimer(game);
          lobby.game = null;
          dao.deleteGameState(lobby.code);
          dao.updateLobbyState(lobby.code, lobby.state);
          io.to(lobby.code).emit("game:error", {
            message: "error.notEnoughPlayers",
          });
        } else if (wasActive) {
          game.currentTurnIndex = game.currentTurnIndex % game.turnOrder.length;
          startTurnTimer(lobby);
          emitGameState(lobby);
        }
        if (lobby.game) dao.saveGameState(lobby.code, lobby.game);
      }

      io.to(lobby.code).emit("lobby:updated", lobbyInfo(lobby));
    }
    io.emit("lobbies:update", getPublicLobbies());
  });

  // Fully remove a player (called on grace period expiry or if no token)
  function removePlayer(lobby, playerId) {
    const player = lobby.players.find((p) => p.id === playerId);
    if (player && player.token) {
      dao.leaveLobby(lobby.code, player.token);
    }
    lobby.players = lobby.players.filter((p) => p.id !== playerId);

    if (lobby.players.length === 0) {
      if (lobby.game) clearTurnTimer(lobby.game);
      lobbies.delete(lobby.code);
      dao.deleteLobby(lobby.code);
      io.emit("lobbies:update", getPublicLobbies());
      return;
    }

    if (lobby.hostId === playerId) {
      lobby.hostId = lobby.players[0].id;
      dao.updateLobbySettings(lobby);
    }

    if (lobby.state === "playing" && lobby.game) {
      const game = lobby.game;
      const wasActive = currentPlayerId(game) === playerId;
      game.turnOrder = game.turnOrder.filter((id) => id !== playerId);

      if (game.turnOrder.length < 2) {
        lobby.state = "waiting";
        clearTurnTimer(game);
        lobby.game = null;
        dao.deleteGameState(lobby.code);
        dao.updateLobbyState(lobby.code, lobby.state);
        io.to(lobby.code).emit("game:error", {
          message: "error.notEnoughPlayers",
        });
      } else if (wasActive) {
        game.currentTurnIndex = game.currentTurnIndex % game.turnOrder.length;
        startTurnTimer(lobby);
        emitGameState(lobby);
      }
      if (lobby.game) dao.saveGameState(lobby.code, lobby.game);
    }

    io.to(lobby.code).emit("lobby:updated", lobbyInfo(lobby));
    io.emit("lobbies:update", getPublicLobbies());
  }

  socket.on("player:reconnect", (cb) => {
    if (!token) return cb?.({ found: false });
    const session = tokens.get(token);
    if (!session || !session.lobbyCode) return cb?.({ found: false });

    const lobby = lobbies.get(session.lobbyCode);
    if (!lobby) {
      tokens.delete(token);
      return cb?.({ found: false });
    }

    // Find the disconnected player by name
    const player = lobby.players.find(
      (p) => p.name === session.playerName && p.disconnected,
    );
    if (!player) return cb?.({ found: false });

    // Cancel grace period timer
    if (session.disconnectTimer) {
      clearTimeout(session.disconnectTimer);
      session.disconnectTimer = null;
    }

    // Swap socket ID
    const oldId = player.id;
    player.id = socket.id;
    player.disconnected = false;
    currentLobbyCode = lobby.code;
    socket.join(lobby.code);

    // Update host if needed
    if (lobby.hostId === oldId) {
      lobby.hostId = socket.id;
    }

    // Update turnOrder if game is playing
    if (lobby.state === "playing" && lobby.game) {
      const game = lobby.game;
      const idx = game.turnOrder.indexOf(oldId);
      if (idx !== -1) {
        game.turnOrder[idx] = socket.id;
      } else {
        // Was removed from turnOrder during grace period, add back
        game.turnOrder.push(socket.id);
      }

      // Send game state to the reconnected player
      const round = currentRound(game);
      const question = currentQ(game);
      const lang = player.lang || "en";
      const activeId = currentPlayerId(game);
      cb?.({
        found: true,
        screen: "game",
        lobby: lobbyInfo(lobby),
        gameState: {
          round: game.currentRound + 1,
          totalRounds: game.rounds.length,
          category: round.category[lang] || round.category.en,
          questionText: question.question[lang] || question.question.en,
          questionPoints: question.points,
          questionIndex: game.currentQuestion,
          activePlayerId: activeId,
          activePlayerName:
            lobby.players.find((p) => p.id === activeId)?.name || "?",
          phase: game.phase,
          hintText:
            game.currentQuestion >= 2 ? getCurrentHint(game, lang) : null,
          players: lobby.players.map((p) => ({
            id: p.id,
            name: p.name,
            score: p.score,
            disconnected: !!p.disconnected,
          })),
          timerRemaining: game.timerStartedAt
            ? Math.max(
                0,
                game.timerSeconds - (Date.now() - game.timerStartedAt) / 1000,
              )
            : null,
        },
      });
    } else {
      cb?.({
        found: true,
        screen: "lobby",
        lobby: lobbyInfo(lobby),
      });
    }

    io.to(lobby.code).emit("lobby:updated", lobbyInfo(lobby));
  });

  socket.on("disconnect", () => {
    if (!currentLobbyCode) return;
    const lobby = lobbies.get(currentLobbyCode);
    if (!lobby) return;

    const playerId = socket.id;

    // If player has a token, use grace period
    if (token && tokens.has(token)) {
      const player = lobby.players.find((p) => p.id === playerId);
      if (player) {
        player.disconnected = true;
        const session = tokens.get(token);

        // If game is playing, remove from turnOrder (re-added on rejoin)
        if (lobby.state === "playing" && lobby.game) {
          const game = lobby.game;
          const wasActive = currentPlayerId(game) === playerId;
          game.turnOrder = game.turnOrder.filter((id) => id !== playerId);

          if (game.turnOrder.length > 0) {
            if (wasActive) {
              game.currentTurnIndex =
                game.currentTurnIndex % game.turnOrder.length;
              clearTurnTimer(game);
              startTurnTimer(lobby);
            }
            emitGameState(lobby);
          } else {
            // All players disconnected, pause the game timer
            clearTurnTimer(game);
          }
        }

        io.to(lobby.code).emit("lobby:updated", lobbyInfo(lobby));

        // Start grace period
        session.disconnectTimer = setTimeout(() => {
          session.disconnectTimer = null;
          tokens.delete(token);
          const lobbyCheck = lobbies.get(session.lobbyCode);
          if (lobbyCheck) {
            removePlayer(lobbyCheck, playerId);
          }
        }, REJOIN_GRACE_MS);

        return;
      }
    }

    // No token or player not found — immediate removal
    removePlayer(lobby, playerId);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`KosQuiz server running on port ${PORT}`);
});
