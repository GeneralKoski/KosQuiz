# KosQuiz

**Knowledge Over Speed** — vince chi sa, non chi è più veloce.

Quiz multiplayer in tempo reale con suggerimenti generati dall'intelligenza artificiale.

## Stack Tecnologico

| Componente | Tecnologie |
|---|---|
| **Frontend** | React + TypeScript + Vite + Tailwind CSS + i18next |
| **Backend** | Node.js + Express + Socket.io |
| **AI Hints** | Groq SDK (modello: `llama3-70b-8192`) |
| **Database** | Nessuno — tutto in memoria |

## Struttura del Progetto

```
KosQuiz/
├── client/                 # Frontend React + TypeScript
│   ├── src/
│   │   ├── components/     # Componenti React (Landing, Lobby, Game, EndScreen, LanguageSwitcher)
│   │   ├── locales/        # Traduzioni i18n (en, it, fr, es)
│   │   ├── types.ts        # Tipi TypeScript condivisi
│   │   ├── socket.ts       # Client Socket.io
│   │   ├── i18n.ts         # Configurazione i18next
│   │   ├── App.tsx         # Componente root con routing tra schermate
│   │   └── main.tsx        # Entry point
│   ├── tsconfig.json       # Configurazione TypeScript (strict mode)
│   └── vite.config.js      # Vite + Tailwind + proxy Socket.io
├── server/                 # Backend Node.js
│   ├── index.js            # Server Express + Socket.io + logica di gioco
│   ├── questions.js        # 10 round di domande con traduzioni in 4 lingue
│   └── .env                # Chiave API Groq
└── README.md
```

## Installazione

### 1. Clona il repository

```bash
git clone <url-del-repo>
cd KosQuiz
```

### 2. Installa le dipendenze

```bash
cd server && npm install
cd ../client && npm install
```

### 3. Configura la chiave API Groq

Modifica il file `server/.env`:

```
GROQ_API_KEY=la_tua_chiave_groq
```

Puoi ottenere una chiave gratuita su [console.groq.com](https://console.groq.com).

### 4. Avvia il progetto

Terminale 1 — server (porta 3001):

```bash
cd server && npm run dev
```

Terminale 2 — client (porta 5173):

```bash
cd client && npm run dev
```

Apri [http://localhost:5173](http://localhost:5173) nel browser.

## Come si Gioca

1. **Inserisci il tuo nome** e scegli la lingua nella schermata iniziale
2. **Crea una lobby** (pubblica o privata) oppure **unisciti** a una esistente tramite codice a 6 caratteri
3. L'host avvia la partita quando ci sono almeno **2 giocatori**
4. Ogni round ha una **categoria** con 3 domande ordinate dalla più generica alla più specifica:
   - Domanda 1 (generica): **3 punti**
   - Domanda 2 (media): **2 punti**
   - Domanda 3 (specifica): **1 punto**
5. I giocatori rispondono a turno (round-robin) con **15 secondi** di tempo ciascuno
6. Se nessuno risponde correttamente a tutte e 3 le domande, viene generato un **suggerimento AI** e si fa un ultimo giro
7. Se ancora nessuno indovina, viene mostrata la risposta corretta e si passa al round successivo
8. Alla fine della partita, vince chi ha il **punteggio più alto**

## Schermate

| Schermata | Descrizione |
|---|---|
| **Landing** | Inserimento nome, creazione/join lobby, lista lobby pubbliche |
| **Lobby** | Lista giocatori, codice lobby copiabile, pulsante "Inizia" (solo host) |
| **Game** | Domanda, indicatore di turno, barra timer animata, input risposta, classifica laterale in tempo reale |
| **End** | Punteggi finali, vincitore evidenziato, pulsante "Gioca Ancora" |

## Internazionalizzazione (i18n)

L'app supporta 4 lingue, selezionabili in qualsiasi momento dal selettore in alto a destra:

- Inglese (default)
- Italiano
- Francese
- Spagnolo

Tutte le stringhe UI passano attraverso `t()` di i18next. Le domande e le risposte sono tradotte per ogni lingua — ogni giocatore vede le domande nella propria lingua e la validazione della risposta avviene nella lingua scelta.

## Suggerimento AI (Groq)

Quando nessun giocatore risponde correttamente alla domanda da 1 punto (la più specifica), il server chiama l'API Groq per generare un indizio aggiuntivo senza rivelare la risposta. Dopo il suggerimento, si effettua un ultimo giro di risposte.

## Note Tecniche

- Le lobby usano le **room** di Socket.io
- Lo stato del gioco vive interamente sul **server** — i client ricevono solo aggiornamenti
- Le risposte vengono validate **case-insensitive** e con trim degli spazi
- Nomi duplicati nella stessa lobby non sono permessi
- Il progetto usa **TypeScript strict** per il frontend
