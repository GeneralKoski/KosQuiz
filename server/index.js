import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import Groq from 'groq-sdk';
import rounds from './questions.js';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── In-memory state ──────────────────────────────────────────────

const lobbies = new Map(); // code → lobby

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
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
    state: 'waiting', // waiting | playing | finished
    game: null,
  };
  lobbies.set(code, lobby);
  hostSocket.join(code);
  return lobby;
}

function getPublicLobbies() {
  const list = [];
  for (const [code, lobby] of lobbies) {
    if (lobby.isPublic && lobby.state === 'waiting') {
      list.push({
        code,
        playerCount: lobby.players.length,
        hostName: lobby.players.find(p => p.id === lobby.hostId)?.name || '?',
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
    players: lobby.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
    state: lobby.state,
  };
}

// ── Game logic helpers ───────────────────────────────────────────

function buildGameState(lobby) {
  const selectedRounds = shuffleArray(rounds).slice(0, 5);
  return {
    rounds: selectedRounds,
    currentRound: 0,
    currentQuestion: 0,   // 0=Q1(3pts), 1=Q2(2pts), 2=Q3(1pt)
    turnOrder: lobby.players.map(p => p.id),
    currentTurnIndex: 0,
    phase: 'question',    // question | hint | reveal | roundEnd | gameEnd
    hintText: null,
    hintUsed: false,
    rotationStart: 0,     // tracks where rotation started for this question
    timer: null,
    answeredThisRotation: new Set(),
  };
}

function currentRound(game) {
  return game.rounds[game.currentRound];
}

function currentQ(game) {
  return currentRound(game).questions[game.currentQuestion];
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
    const lang = player.lang || 'en';
    io.to(player.id).emit('game:state', {
      round: game.currentRound + 1,
      totalRounds: game.rounds.length,
      category: round.category[lang] || round.category.en,
      questionText: question.text[lang] || question.text.en,
      questionPoints: question.points,
      questionIndex: game.currentQuestion,
      activePlayerId,
      activePlayerName: lobby.players.find(p => p.id === activePlayerId)?.name || '?',
      phase: game.phase,
      hintText: game.hintText,
      players: lobby.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
    });
  }
}

function emitReveal(lobby, correctAnswer) {
  for (const player of lobby.players) {
    const lang = player.lang || 'en';
    const q = currentQ(lobby.game);
    const answer = q.answer[lang] || q.answer.en;
    io.to(player.id).emit('game:reveal', { correctAnswer: answer });
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

  io.to(lobby.code).emit('game:timerStart', { seconds: 15 });

  game.timer = setTimeout(() => {
    // Time's up — skip this player's turn
    handleTurnEnd(lobby, null);
  }, 15000);
}

function advanceTurn(lobby) {
  const game = lobby.game;
  game.currentTurnIndex++;
  game.answeredThisRotation.add(currentPlayerId(game));

  // Check if we've completed a full rotation
  const totalPlayers = game.turnOrder.length;
  const answersInRotation = game.answeredThisRotation.size;

  if (answersInRotation >= totalPlayers) {
    // Full rotation done, nobody got it right
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
    // Move to next question (easier, fewer points)
    game.currentQuestion++;
    game.hintText = null;
    game.hintUsed = false;
    game.phase = 'question';
    emitGameState(lobby);
    startTurnTimer(lobby);
  } else if (!game.hintUsed) {
    // We're on Q3 and haven't used hint yet — get AI hint
    game.hintUsed = true;
    game.phase = 'hint';
    clearTurnTimer(game);

    const answer = currentQ(game).answer.en;
    let hint = 'Think carefully about the clues given so far.';

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: `The answer is "${answer}". Give a subtle but helpful additional clue for a quiz game without revealing the answer directly. Keep it to one sentence.`,
          },
        ],
        model: 'llama3-70b-8192',
        temperature: 0.7,
        max_tokens: 100,
      });
      hint = chatCompletion.choices[0]?.message?.content || hint;
    } catch (err) {
      console.error('Groq API error:', err.message);
    }

    game.hintText = hint;
    game.phase = 'question';
    emitGameState(lobby);
    startTurnTimer(lobby);
  } else {
    // Q3 with hint already used and still nobody got it — reveal and move on
    game.phase = 'reveal';
    emitReveal(lobby, null);
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
    // Game over
    game.phase = 'gameEnd';
    lobby.state = 'finished';
    io.to(lobby.code).emit('game:end', {
      players: lobby.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
    });
  } else {
    game.currentRound++;
    game.currentQuestion = 0;
    game.hintText = null;
    game.hintUsed = false;
    game.phase = 'question';
    game.answeredThisRotation = new Set();
    // Rotate starting player each round
    game.currentTurnIndex = game.currentRound % game.turnOrder.length;
    emitGameState(lobby);
    startTurnTimer(lobby);
  }
}

function handleTurnEnd(lobby, answer) {
  const game = lobby.game;
  clearTurnTimer(game);

  if (answer !== null) {
    const activePlayerId = currentPlayerId(game);
    const player = lobby.players.find(p => p.id === activePlayerId);
    const lang = player?.lang || 'en';
    const q = currentQ(game);
    const correctAnswer = (q.answer[lang] || q.answer.en).trim().toLowerCase();
    const given = answer.trim().toLowerCase();

    if (given === correctAnswer) {
      // Correct!
      player.score += q.points;
      io.to(lobby.code).emit('game:correct', {
        playerId: player.id,
        playerName: player.name,
        points: q.points,
        answer: q.answer[lang] || q.answer.en,
      });

      setTimeout(() => {
        moveToNextRound(lobby);
      }, 2000);
      return;
    } else {
      io.to(lobby.code).emit('game:wrong', {
        playerId: activePlayerId,
      });
    }
  }

  // Wrong or timeout — advance turn
  advanceTurn(lobby);
}

// ── Socket handlers ──────────────────────────────────────────────

io.on('connection', (socket) => {
  let currentLobbyCode = null;

  socket.on('lobby:create', ({ name, lang, isPublic }, cb) => {
    if (!name || name.trim().length === 0) return cb?.({ error: 'Name required' });
    const lobby = createLobby(socket, name.trim(), lang || 'en', !!isPublic);
    currentLobbyCode = lobby.code;
    cb?.({ lobby: lobbyInfo(lobby) });
    io.emit('lobbies:update', getPublicLobbies());
  });

  socket.on('lobby:join', ({ name, lang, code }, cb) => {
    if (!name || name.trim().length === 0) return cb?.({ error: 'Name required' });
    const lobby = lobbies.get(code?.toUpperCase());
    if (!lobby) return cb?.({ error: 'Lobby not found' });
    if (lobby.state !== 'waiting') return cb?.({ error: 'Game already in progress' });
    if (lobby.players.some(p => p.name.toLowerCase() === name.trim().toLowerCase())) {
      return cb?.({ error: 'Name already taken in this lobby' });
    }

    lobby.players.push({ id: socket.id, name: name.trim(), lang: lang || 'en', score: 0 });
    socket.join(code.toUpperCase());
    currentLobbyCode = code.toUpperCase();

    cb?.({ lobby: lobbyInfo(lobby) });
    io.to(lobby.code).emit('lobby:updated', lobbyInfo(lobby));
    io.emit('lobbies:update', getPublicLobbies());
  });

  socket.on('lobby:list', (cb) => {
    cb?.(getPublicLobbies());
  });

  socket.on('game:start', (cb) => {
    if (!currentLobbyCode) return cb?.({ error: 'Not in a lobby' });
    const lobby = lobbies.get(currentLobbyCode);
    if (!lobby) return cb?.({ error: 'Lobby not found' });
    if (lobby.hostId !== socket.id) return cb?.({ error: 'Only the host can start' });
    if (lobby.players.length < 2) return cb?.({ error: 'Need at least 2 players' });

    lobby.state = 'playing';
    lobby.game = buildGameState(lobby);
    lobby.players.forEach(p => (p.score = 0));

    cb?.({ ok: true });
    emitGameState(lobby);
    startTurnTimer(lobby);
    io.emit('lobbies:update', getPublicLobbies());
  });

  socket.on('game:answer', ({ answer }) => {
    if (!currentLobbyCode) return;
    const lobby = lobbies.get(currentLobbyCode);
    if (!lobby || lobby.state !== 'playing') return;

    const game = lobby.game;
    if (currentPlayerId(game) !== socket.id) return; // Not your turn
    if (game.phase === 'reveal' || game.phase === 'gameEnd') return;

    handleTurnEnd(lobby, answer);
  });

  socket.on('game:playAgain', () => {
    if (!currentLobbyCode) return;
    const lobby = lobbies.get(currentLobbyCode);
    if (!lobby) return;

    lobby.state = 'waiting';
    lobby.game = null;
    lobby.players.forEach(p => (p.score = 0));

    io.to(lobby.code).emit('lobby:updated', lobbyInfo(lobby));
    io.to(lobby.code).emit('game:reset');
    io.emit('lobbies:update', getPublicLobbies());
  });

  socket.on('disconnect', () => {
    if (!currentLobbyCode) return;
    const lobby = lobbies.get(currentLobbyCode);
    if (!lobby) return;

    lobby.players = lobby.players.filter(p => p.id !== socket.id);

    if (lobby.players.length === 0) {
      if (lobby.game) clearTurnTimer(lobby.game);
      lobbies.delete(currentLobbyCode);
      io.emit('lobbies:update', getPublicLobbies());
      return;
    }

    // If host left, assign new host
    if (lobby.hostId === socket.id) {
      lobby.hostId = lobby.players[0].id;
    }

    // If game was in progress and it's the disconnected player's turn, advance
    if (lobby.state === 'playing' && lobby.game) {
      const game = lobby.game;
      game.turnOrder = game.turnOrder.filter(id => id !== socket.id);

      if (game.turnOrder.length < 2) {
        // Not enough players to continue
        lobby.state = 'finished';
        game.phase = 'gameEnd';
        clearTurnTimer(game);
        io.to(lobby.code).emit('game:end', {
          players: lobby.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
        });
      } else if (currentPlayerId(game) === socket.id || !game.turnOrder.includes(currentPlayerId(game))) {
        // Adjust turn index and restart timer
        game.currentTurnIndex = game.currentTurnIndex % game.turnOrder.length;
        emitGameState(lobby);
        startTurnTimer(lobby);
      }
    }

    io.to(lobby.code).emit('lobby:updated', lobbyInfo(lobby));
    io.emit('lobbies:update', getPublicLobbies());
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`KosQuiz server running on port ${PORT}`);
});
