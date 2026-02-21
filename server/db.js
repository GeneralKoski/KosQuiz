import Database from "better-sqlite3";

const db = new Database("kosquiz.db");

// initialize db PRAGMAs
db.pragma("journal_mode = WAL");

// Initialize schema
db.exec(`
  -- Lobby attive
  CREATE TABLE IF NOT EXISTS lobbies (
    code TEXT PRIMARY KEY,
    host_token TEXT,
    is_public INTEGER,
    difficulty TEXT DEFAULT 'turn',
    category TEXT,
    state TEXT DEFAULT 'waiting',
    created_at INTEGER DEFAULT (unixepoch())
  );

  -- Player in lobby
  CREATE TABLE IF NOT EXISTS lobby_players (
    lobby_code TEXT REFERENCES lobbies(code) ON DELETE CASCADE,
    token TEXT,
    name TEXT,
    lang TEXT DEFAULT 'en',
    score INTEGER DEFAULT 0,
    PRIMARY KEY (lobby_code, token)
  );

  -- Game state (JSON blob)
  CREATE TABLE IF NOT EXISTS game_states (
    lobby_code TEXT PRIMARY KEY REFERENCES lobbies(code) ON DELETE CASCADE,
    state_json TEXT
  );

  -- Token → sessione attiva
  CREATE TABLE IF NOT EXISTS tokens (
    token TEXT PRIMARY KEY,
    lobby_code TEXT,
    player_name TEXT
  );

  -- Storico partite completate
  CREATE TABLE IF NOT EXISTS game_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lobby_code TEXT,
    difficulty TEXT,
    category TEXT,
    played_at INTEGER DEFAULT (unixepoch())
  );

  -- Risultati per giocatore
  CREATE TABLE IF NOT EXISTS game_results (
    history_id INTEGER REFERENCES game_history(id),
    token TEXT,
    player_name TEXT,
    score INTEGER,
    won INTEGER DEFAULT 0
  );

  -- Archivio domande
  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT,
    question_json TEXT,
    UNIQUE(question_json)
  );

  -- Indici per performance
  CREATE INDEX IF NOT EXISTS idx_questions_category ON questions (category COLLATE NOCASE);
  CREATE INDEX IF NOT EXISTS idx_game_results_token ON game_results (token);
`);

/**
 * Serializza lo stato del gioco, filtrando o convertendo i campi non serializzabili.
 */
export function serializeGame(game) {
  if (!game) return null;
  return JSON.stringify({
    ...game,
    answeredThisRotation: Array.from(game.answeredThisRotation || []),
    timer: undefined,
    isCheckingAnswer: undefined,
  });
}

/**
 * Deserializza lo stato del gioco.
 */
export function deserializeGame(json) {
  if (!json) return null;
  const g = JSON.parse(json);
  return {
    ...g,
    answeredThisRotation: new Set(g.answeredThisRotation || []),
    timer: null,
    isCheckingAnswer: false,
  };
}

const stmts = {
  insertLobby: db.prepare(
    "INSERT OR REPLACE INTO lobbies (code, host_token, is_public, difficulty, category, state) VALUES (?, ?, ?, ?, ?, ?)",
  ),
  updateLobbyState: db.prepare("UPDATE lobbies SET state = ? WHERE code = ?"),
  deleteLobby: db.prepare("DELETE FROM lobbies WHERE code = ?"),

  insertPlayer: db.prepare(
    "INSERT OR REPLACE INTO lobby_players (lobby_code, token, name, lang, score) VALUES (?, ?, ?, ?, ?)",
  ),
  updatePlayerScore: db.prepare(
    "UPDATE lobby_players SET score = ? WHERE lobby_code = ? AND token = ?",
  ),
  deletePlayerTokens: db.prepare(
    "DELETE FROM lobby_players WHERE lobby_code = ? AND token = ?",
  ),

  insertToken: db.prepare(
    "INSERT OR REPLACE INTO tokens (token, lobby_code, player_name) VALUES (?, ?, ?)",
  ),
  deleteToken: db.prepare("DELETE FROM tokens WHERE token = ?"),

  saveGameState: db.prepare(
    "INSERT OR REPLACE INTO game_states (lobby_code, state_json) VALUES (?, ?)",
  ),
  deleteGameState: db.prepare("DELETE FROM game_states WHERE lobby_code = ?"),

  insertGameHistory: db.prepare(
    "INSERT INTO game_history (lobby_code, difficulty, category) VALUES (?, ?, ?)",
  ),
  insertGameResult: db.prepare(
    "INSERT INTO game_results (history_id, token, player_name, score, won) VALUES (?, ?, ?, ?, ?)",
  ),

  getAllLobbies: db.prepare("SELECT * FROM lobbies"),
  getLobbyPlayers: db.prepare(
    "SELECT * FROM lobby_players WHERE lobby_code = ?",
  ),
  getAllTokens: db.prepare("SELECT * FROM tokens"),
  getGameState: db.prepare(
    "SELECT state_json FROM game_states WHERE lobby_code = ?",
  ),

  getLeaderboard: db.prepare(`
    SELECT
      MAX(player_name) as name,
      SUM(score) as total_score,
      COUNT(history_id) as games_played,
      SUM(won) as games_won
    FROM game_results
    GROUP BY token
    ORDER BY total_score DESC
    LIMIT 50
  `),

  insertQuestion: db.prepare(
    "INSERT OR IGNORE INTO questions (category, question_json) VALUES (?, ?)",
  ),
  getRandomQuestions: db.prepare(
    "SELECT question_json FROM questions WHERE LOWER(category) = LOWER(?) ORDER BY RANDOM() LIMIT ?",
  ),
  getAllRandomQuestions: db.prepare(
    "SELECT question_json FROM questions ORDER BY RANDOM() LIMIT ?",
  ),
};

export const dao = {
  createLobby(lobbyCode, hostToken, isPublic, difficulty, category, state) {
    stmts.insertLobby.run(
      lobbyCode,
      hostToken,
      isPublic ? 1 : 0,
      difficulty,
      category,
      state,
    );
  },
  updateLobbySettings(lobby) {
    const hostToken = lobby.players.find((p) => p.id === lobby.hostId)?.token;
    stmts.insertLobby.run(
      lobby.code,
      hostToken || "",
      lobby.isPublic ? 1 : 0,
      lobby.difficulty || "turn",
      lobby.category || "random",
      lobby.state,
    );
  },
  updateLobbyState(lobbyCode, state) {
    stmts.updateLobbyState.run(state, lobbyCode);
  },
  deleteLobby(lobbyCode) {
    // CASCADE deletes lobby_players and game_states
    stmts.deleteLobby.run(lobbyCode);
    db.exec(
      `DELETE FROM tokens WHERE lobby_code = '${lobbyCode.replace(/'/g, "''")}'`,
    );
  },

  joinLobby(lobbyCode, token, name, lang, score = 0) {
    stmts.insertPlayer.run(lobbyCode, token, name, lang, score);
    stmts.insertToken.run(token, lobbyCode, name);
  },
  leaveLobby(lobbyCode, token) {
    stmts.deletePlayerTokens.run(lobbyCode, token);
    stmts.deleteToken.run(token);
  },
  updatePlayerScore(lobbyCode, token, score) {
    stmts.updatePlayerScore.run(score, lobbyCode, token);
  },

  saveGameState(lobbyCode, game) {
    stmts.saveGameState.run(lobbyCode, serializeGame(game));
  },
  deleteGameState(lobbyCode) {
    stmts.deleteGameState.run(lobbyCode);
  },

  saveGameEnd(lobby) {
    const info = stmts.insertGameHistory.run(
      lobby.code,
      lobby.difficulty || "turn",
      lobby.category || "random",
    );
    const historyId = info.lastInsertRowid;

    // Find highest score
    const players = Array.from(lobby.players.values());
    const maxScore = Math.max(...players.map((p) => p.score));

    // Save results
    for (const p of players) {
      if (p.token) {
        const won = p.score === maxScore && players.length > 0 ? 1 : 0;
        stmts.insertGameResult.run(historyId, p.token, p.name, p.score, won);
      }
    }
  },

  loadAll() {
    const lobbies = stmts.getAllLobbies.all();
    const result = {
      lobbies: [],
      tokens: stmts.getAllTokens.all(),
    };

    for (const l of lobbies) {
      const players = stmts.getLobbyPlayers.all(l.code);
      let gameStateObj = null;
      if (l.state === "playing") {
        const gs = stmts.getGameState.get(l.code);
        if (gs && gs.state_json) {
          gameStateObj = deserializeGame(gs.state_json);
        }
      }
      result.lobbies.push({
        dbLobby: l,
        players,
        game: gameStateObj,
      });
    }

    return result;
  },

  getLeaderboard() {
    return stmts.getLeaderboard.all();
  },

  insertQuestion(category, jsonBlob) {
    return stmts.insertQuestion.run(category, jsonBlob);
  },

  getRandomQuestions(category, limit = 10) {
    let rows;
    if (category && category.toLowerCase() !== "random") {
      rows = stmts.getRandomQuestions.all(category, limit);
    } else {
      rows = stmts.getAllRandomQuestions.all(limit);
    }
    return rows.map((r) => JSON.parse(r.question_json));
  },
};
