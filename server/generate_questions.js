import "dotenv/config";
import Groq from "groq-sdk";
import { dao } from "./db.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const CATEGORIES = [
  "Geography",
  "Science",
  "History",
  "Cinema",
  "Music",
  "Art",
  "Sports",
  "Technology",
];

const PROMPT_TEMPLATE = `
Generate 5 trivia questions for a multiplayer quiz game.
The category is: "{category}".

The output MUST be a valid JSON object with a single key "questions" containing an array of 5 exact objects matching this schema.
Do NOT include any markdown formatting or extra text. Return ONLY raw JSON.

Schema per object in the "questions" array:
{
  "category": {
    "en": "Category Name in English",
    "it": "Category Name in Italian",
    "fr": "Category Name in French",
    "es": "Category Name in Spanish"
  },
  "answer": {
    "en": "Short Answer (1-3 words)",
    "it": "Short Answer",
    "fr": "Short Answer",
    "es": "Short Answer"
  },
  "hard": {
    "points": 3,
    "question": {
      "en": "Hard, obscure question that requires deep knowledge or is very specific",
      "it": "Domanda difficile",
      "fr": "Question difficile",
      "es": "Pregunta difícil"
    },
    "hints": [
      {
        "en": "Obscure hint 1",
        "it": "Indizio 1",
        "fr": "Indice 1",
        "es": "Pista 1"
      }
    ]
  },
  "medium": {
    "points": 2,
    "question": {
      "en": "Medium difficulty question, more accessible but still challenging",
      "it": "Domanda media",
      "fr": "Question moyenne",
      "es": "Pregunta media"
    },
    "hints": [
      {
        "en": "Medium hint 1",
        "it": "Indizio 1",
        "fr": "Indice 1",
        "es": "Pista 1"
      }
    ]
  },
  "easy": {
    "points": 1,
    "question": {
      "en": "Very easy question, obvious to almost everyone",
      "it": "Domanda facile",
      "fr": "Question facile",
      "es": "Pregunta fácil"
    },
    "hints": [
      {
        "en": "A _ _ S W E R (fill in the blanks)",
        "it": "R _ _ P O S T _ (fill in the blanks)",
        "fr": "R _ _ P O N S _ (fill in the blanks)",
        "es": "R _ _ P U E S T _ (fill in the blanks)"
      }
    ]
  }
}

Important rules:
1. "answer" must be extremely short (1-3 words max).
2. "easy.hints[0]" should ALWAYS be a hangman-style fill-in-the-blank of the answer. It should reveal at least 30-40% of the letters.
3. The root of the JSON MUST be an object like { "questions": [...] }.
4. Ensure all translations are accurate.
5. Provide obscure, unique questions. Avoid common cliches (e.g. NO "Capital of France", NO "Author of Hamlet").
`;

// Carichiamo tutte le domande già esistenti in modo da NON generare doppioni!
import Database from "better-sqlite3";
const db = new Database("kosquiz.db");
const existingQuestions = new Set(
  db
    .prepare(
      "SELECT lower(json_extract(question_json, '$.easy.question.en')) as q FROM questions WHERE q IS NOT NULL",
    )
    .all()
    .map((r) => r.q),
);
db.close();

async function generateBatch(category) {
  console.log(`Generating 5 questions for ${category}...`);
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: PROMPT_TEMPLATE.replace("{category}", category),
        },
      ],
      model: "llama-3.1-8b-instant", // Modello più piccolo ed economico per i tokens
      temperature: 0.9,
      response_format: { type: "json_object" },
    });

    const responseText = chatCompletion.choices[0]?.message?.content || "";
    const parsedData = JSON.parse(responseText);
    const questions = parsedData.questions;

    if (!Array.isArray(questions)) throw new Error("Not an array");

    let inserted = 0;
    for (const q of questions) {
      if (!q.easy || !q.easy.question || !q.easy.question.en) continue;

      const qKey = q.easy.question.en.toString().toLowerCase().trim();

      // Controllo antidoppione basato sulla domanda prima di inserire nel DB!
      if (existingQuestions.has(qKey)) {
        console.log(`⚠️ Skipped duplicate question: "${q.easy.question.en}"`);
        continue;
      }

      existingQuestions.add(qKey);

      const jsonStr = JSON.stringify(q);
      const res = dao.insertQuestion(category, jsonStr);
      if (res.changes > 0) inserted++;
    }

    console.log(
      `✅ Successfully inserted ${inserted} new unique questions for ${category}`,
    );
  } catch (error) {
    console.error(
      `❌ Failed to generate or parse questions for ${category}:`,
      error.message,
    );
  }
}

async function loop() {
  console.log(
    "🚀 Starting infinite question generator... (Press Ctrl+C to stop)",
  );
  let i = 0;
  while (true) {
    const cat = CATEGORIES[i % CATEGORIES.length];
    await generateBatch(cat);
    i++;

    // Attendi 5 secondi tra le chiamate
    console.log("Waiting 5s...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

loop();
