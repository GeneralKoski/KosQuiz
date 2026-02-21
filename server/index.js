import cors from "cors";
import "dotenv/config";
import express from "express";
import Groq from "groq-sdk";
import { createServer } from "http";
import { Server } from "socket.io";
import roundsDb from "./questions.js";

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const lobbies = new Map();

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

function createLobby(hostSocket, hostName, hostLang, isPublic) {
  const code = generateCode();
  const lobby = {
    code,
    isPublic,
    hostId: hostSocket.id,
    players: [{ id: hostSocket.id, name: hostName, lang: hostLang, score: 0 }],
    state: "waiting",
    difficulty: "turn", // default
    game: null,
  };
  lobbies.set(code, lobby);
  hostSocket.join(code);
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
    turnOrder: lobby.players.map((p) => p.id),
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
      })),
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
}

function startTurnTimer(lobby) {
  const game = lobby.game;
  clearTurnTimer(game);

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
    emitGameState(lobby);
    startTurnTimer(lobby);
  }
}

async function handleRotationEnd(lobby) {
  const game = lobby.game;
  game.answeredThisRotation = new Set();

  if (game.currentQuestion < 2) {
    game.currentQuestion++;
    emitGameState(lobby);
    startTurnTimer(lobby);
  } else {
    game.phase = "reveal";
    emitReveal(lobby);
    emitGameState(lobby);

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
    emitGameState(lobby);
    startTurnTimer(lobby);
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
  let currentLobbyCode = null;

  socket.on("lobby:create", ({ name, lang, isPublic }, cb) => {
    if (!name || name.trim().length === 0)
      return cb?.({ error: "error.nameRequired" });
    const lobby = createLobby(socket, name.trim(), lang || "en", !!isPublic);
    currentLobbyCode = lobby.code;
    cb?.({ lobby: lobbyInfo(lobby) });
    io.emit("lobbies:update", getPublicLobbies());
  });

  socket.on("lobby:updateSettings", ({ difficulty }) => {
    if (!currentLobbyCode) return;
    const lobby = lobbies.get(currentLobbyCode);
    if (!lobby || lobby.hostId !== socket.id) return;

    if (difficulty) lobby.difficulty = difficulty;
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

    lobby.players.push({
      id: socket.id,
      name: name.trim(),
      lang: lang || "en",
      score: 0,
    });
    socket.join(code.toUpperCase());
    currentLobbyCode = code.toUpperCase();

    cb?.({ lobby: lobbyInfo(lobby) });
    io.to(lobby.code).emit("lobby:updated", lobbyInfo(lobby));
    io.emit("lobbies:update", getPublicLobbies());
  });

  socket.on("lobby:list", (cb) => {
    cb?.(getPublicLobbies());
  });

  socket.on("game:start", ({ difficulty = "turn" } = {}, cb) => {
    if (!currentLobbyCode) return cb?.({ error: "error.notInLobby" });
    const lobby = lobbies.get(currentLobbyCode);
    if (!lobby) return cb?.({ error: "error.lobbyNotFound" });
    if (lobby.hostId !== socket.id) return cb?.({ error: "error.notHost" });
    if (lobby.players.length < 2) return cb?.({ error: "error.needPlayers" });

    lobby.state = "playing";
    lobby.game = buildGameState(lobby, difficulty);
    lobby.players.forEach((p) => (p.score = 0));

    cb?.({ ok: true });
    emitGameState(lobby);
    startTurnTimer(lobby);
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
    lobby.players.forEach((p) => (p.score = 0));

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
    currentLobbyCode = null;

    if (lobby.players.length === 0) {
      if (lobby.game) clearTurnTimer(lobby.game);
      lobbies.delete(lobby.code);
    } else if (lobby.hostId === socket.id) {
      lobby.hostId = lobby.players[0].id;
      io.to(lobby.code).emit("lobby:updated", lobbyInfo(lobby));
    } else {
      io.to(lobby.code).emit("lobby:updated", lobbyInfo(lobby));
    }
    io.emit("lobbies:update", getPublicLobbies());
  });

  socket.on("disconnect", () => {
    if (!currentLobbyCode) return;
    const lobby = lobbies.get(currentLobbyCode);
    if (!lobby) return;

    lobby.players = lobby.players.filter((p) => p.id !== socket.id);

    if (lobby.players.length === 0) {
      if (lobby.game) clearTurnTimer(lobby.game);
      lobbies.delete(currentLobbyCode);
      io.emit("lobbies:update", getPublicLobbies());
      return;
    }

    if (lobby.hostId === socket.id) {
      lobby.hostId = lobby.players[0].id;
    }

    if (lobby.state === "playing" && lobby.game) {
      const game = lobby.game;
      game.turnOrder = game.turnOrder.filter((id) => id !== socket.id);

      if (game.turnOrder.length < 2) {
        lobby.state = "waiting";
        lobby.game = null;
        clearTurnTimer(game);
        io.to(lobby.code).emit("game:error", {
          message: "error.notEnoughPlayers",
        });
        io.to(lobby.code).emit("lobby:updated", lobbyInfo(lobby));
      } else if (
        currentPlayerId(game) === socket.id ||
        !game.turnOrder.includes(currentPlayerId(game))
      ) {
        game.currentTurnIndex = game.currentTurnIndex % game.turnOrder.length;
        emitGameState(lobby);
        startTurnTimer(lobby);
      }
    }

    io.to(lobby.code).emit("lobby:updated", lobbyInfo(lobby));
    io.emit("lobbies:update", getPublicLobbies());
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`KosQuiz server running on port ${PORT}`);
});
