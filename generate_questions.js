const fs = require('fs');

const categories = {
  Geography: "Geografia",
  Science: "Scienza",
  History: "Storia",
  Cinema: "Cinema"
};

const makeQ = (catEn, ansEn, ansIt, q1, h1, q2, h2, q3, h3) => {
  return {
    category: { en: catEn, it: categories[catEn] || catEn },
    answer: { en: ansEn, it: ansIt },
    hard: {
      points: 3,
      question: { en: q1[0], it: q1[1] },
      hints: [ { en: h1[0], it: h1[1] } ]
    },
    medium: {
      points: 2,
      question: { en: q2[0], it: q2[1] },
      hints: [ { en: h2[0], it: h2[1] } ]
    },
    easy: {
      points: 1,
      question: { en: q3[0], it: q3[1] },
      hints: [ { en: h3[0], it: h3[1] } ]
    }
  };
};

const qs = [
  // GEOGRAPHY
  makeQ("Geography", "Rome", "Roma", 
    ["Capital of the Roman Empire", "Capitale dell'Impero Romano"], ["In Italy", "In Italia"],
    ["Has the Colosseum", "Ha il Colosseo"], ["Eternal city", "Città eterna"],
    ["Capital of Italy", "Capitale d'Italia"], ["Starts with R", "Inizia con R"]
  ),
  makeQ("Geography", "Tokyo", "Tokyo",
    ["Most populous metropolitan area in the world", "Area metropolitana più popolosa al mondo"], ["Located in Kanto region", "Situata nella regione di Kanto"],
    ["Capital of Japan", "Capitale del Giappone"], ["Previously called Edo", "Precedentemente chiamata Edo"],
    ["Japanese city holding the 2020 Olympics", "Città giapponese delle Olimpiadi 2020"], ["T _ K Y O", "T _ K Y O"]
  ),
  makeQ("Geography", "London", "Londra",
    ["Sits on the river Thames", "Sorge sul fiume Tamigi"], ["Has the Shard", "Ha lo Shard"],
    ["Capital of the UK", "Capitale del Regno Unito"], ["Home to Big Ben", "Ospita il Big Ben"],
    ["Capital of England", "Capitale dell'Inghilterra"], ["L O N D _ _", "L O N D _ A"]
  ),
  makeQ("Geography", "Paris", "Parigi",
    ["City of light", "Città della luce"], ["On the Seine", "Sulla Senna"],
    ["Home to the Eiffel Tower", "Ospita la Torre Eiffel"], ["Capital of France", "Capitale della Francia"],
    ["Has the Louvre", "Ha il Louvre"], ["Starts with P", "Inizia con P"]
  ),
  makeQ("Geography", "Berlin", "Berlino",
    ["Separated by a wall until 1989", "Separata da un muro fino al 1989"], ["Brandenburg Gate is here", "Qui c'è la Porta di Brandeburgo"],
    ["Capital of Germany", "Capitale della Germania"], ["In central Europe", "In centro Europa"],
    ["German capital", "Capitale tedesca"], ["B E R L I _", "B E R L I N _"]
  ),
  makeQ("Geography", "Madrid", "Madrid",
    ["Highest capital in EU", "Capitale più alta dell'UE"], ["Located on the Manzanares", "Situata sul Manzanares"],
    ["Capital of Spain", "Capitale della Spagna"], ["Home to the Prado museum", "Ospita il museo del Prado"],
    ["Spanish capital", "Capitale spagnola"], ["Starts with M", "Inizia con M"]
  ),
  makeQ("Geography", "New York", "New York",
    ["The big apple", "La grande mela"], ["In the state with the same name", "Nello stato omonimo"],
    ["Has the Statue of Liberty", "Ha la Statua della Libertà"], ["Contains Manhattan", "Contiene Manhattan"],
    ["Most populous US city", "Città più popolosa USA"], ["N_W Y_RK", "N_W Y_RK"]
  ),
  makeQ("Geography", "Sydney", "Sydney",
    ["Home to a famous Opera House", "Ospita una famosa Opera House"], ["In New South Wales", "Nel Nuovo Galles del Sud"],
    ["Largest city in Australia", "La più grande città in Australia"], ["Not the capital though", "Ma non è la capitale"],
    ["Australian city with a big bridge", "Città australiana con un grande ponte"], ["S Y D _ _ Y", "S Y D _ _ Y"]
  ),
  makeQ("Geography", "Cairo", "Il Cairo",
    ["Largest city in the Arab world", "Città più grande del mondo arabo"], ["On the Nile", "Sul Nilo"],
    ["Near the Giza pyramids", "Vicino alle piramidi di Giza"], ["Capital of Egypt", "Capitale dell'Egitto"],
    ["Egyptian capital", "Capitale egiziana"], ["C A I R _", "I L  C A I R _"]
  ),
  makeQ("Geography", "Moscow", "Mosca",
    ["Has the Kremlin", "Ha il Cremlino"], ["On the Moskva river", "Sul fiume Moscova"],
    ["Capital of Russia", "Capitale della Russia"], ["Red Square is here", "Qui c'è la Piazza Rossa"],
    ["Russian capital", "Capitale russa"], ["M O S C _", "M O S C _"]
  ),

  // SCIENCE
  makeQ("Science", "Carbon", "Carbonio",
    ["Basis of all known life", "Base di tutta la vita conosciuta"], ["Atomic number 6", "Numero atomico 6"],
    ["Forms diamonds and graphite", "Forma diamanti e grafite"], ["Symbol C", "Simbolo C"],
    ["C in CO2", "La C nella CO2"], ["C _ R B O N", "C _ R B O N I O"]
  ),
  makeQ("Science", "Oxygen", "Ossigeno",
    ["Required for human respiration", "Richiesto per la respirazione umana"], ["Atomic number 8", "Numero atomico 8"],
    ["Gas that makes up 21% of atmosphere", "Gas che forma il 21% dell'atmosfera"], ["Symbol O", "Simbolo O"],
    ["We breathe this gas", "Respiriamo questo gas"], ["O _ Y G E N", "O S S I G E N O"]
  ),
  makeQ("Science", "Gravity", "Gravità",
    ["Force that gives weight to objects", "Forza che dà peso agli oggetti"], ["Newton formulated it", "Newton la formulò"],
    ["Keeps planets in orbit", "Mantiene i pianeti in orbita"], ["Why apples fall", "Perché le mele cadono"],
    ["Pulls you to the ground", "Ti attira a terra"], ["G R A V I T _", "G R A V I T _"]
  ),
  makeQ("Science", "Electron", "Elettrone",
    ["Subatomic particle with negative charge", "Particella subatomica con carica negativa"], ["Orbits the nucleus", "Orbita intorno al nucleo"],
    ["Lighter than a proton", "Più leggero di un protone"], ["Moves in circuits", "Si muove nei circuiti"],
    ["Electricity is the flow of...?", "L'elettricità è il flusso di...?"], ["E L E C T R _ _", "E L E T T R _ _ E"]
  ),
  makeQ("Science", "Water", "Acqua",
    ["Universal solvent", "Solvente universale"], ["H2O", "H2O"],
    ["Covers 71% of Earth", "Copre il 71% della Terra"], ["Essential for hydration", "Essenziale per l'idratazione"],
    ["Liquid ice", "Ghiaccio liquido"], ["W A T E _", "A C Q U _"]
  ),
  makeQ("Science", "Photosynthesis", "Fotosintesi",
    ["Process used by plants to turn light into energy", "Processo usato dalle piante per trasformare la luce in energia"], ["Uses chlorophyll", "Usa la clorofilla"],
    ["Converts CO2 and water into glucose", "Converte CO2 e acqua in glucosio"], ["Plants do this in the sun", "Le piante lo fanno al sole"],
    ["How plants 'eat'", "Come 'mangiano' le piante"], ["Starts with P", "Inizia con F"]
  ),
  makeQ("Science", "Mars", "Marte",
    ["Fourth planet from the Sun", "Quarto pianeta dal Sole"], ["Has moons Phobos and Deimos", "Ha lune Phobos e Deimos"],
    ["The Red Planet", "Il Pianeta Rosso"], ["Named after Roman god of war", "Prende il nome dal dio romano della guerra"],
    ["Elon Musk wants to go here", "Elon Musk vuole andarci"], ["M A R _", "M A R T _"]
  ),
  makeQ("Science", "DNA", "DNA",
    ["Molecule that carries genetic instructions", "Molecola che porta le istruzioni genetiche"], ["Double helix structure", "Struttura a doppia elica"],
    ["Deoxyribonucleic acid", "Acido desossiribonucleico"], ["Found in chromosomes", "Trovato nei cromosomi"],
    ["Your genetic code", "Il tuo codice genetico"], ["D _ A", "D _ A"]
  ),
  makeQ("Science", "Magnet", "Magnete",
    ["Material that produces a magnetic field", "Materiale che produce un campo magnetico"], ["Has North and South poles", "Ha poli Nord e Sud"],
    ["Attracts iron", "Attira il ferro"], ["Used on fridge doors", "Usato sulle porte del frigo"],
    ["Opposites attract", "Gli opposti si attraggono"], ["M A G N _ _", "M A G N E _ E"]
  ),
  makeQ("Science", "Speed of Light", "Velocità della luce",
    ["Approximately 300,000 km/s", "Circa 300.000 km/s"], ["Constant 'c' in Einstein's equation", "La costante 'c' nell'equazione di Einstein"],
    ["Fastest thing in the universe", "La cosa più veloce dell'universo"], ["Nothing can travel faster", "Nulla può viaggiare più veloce"],
    ["Light's pace", "Il passo della luce"], ["S P E E D...", "V E L O C I T A..."]
  ),

  // HISTORY
  makeQ("History", "Julius Caesar", "Giulio Cesare",
    ["Roman general who crossed the Rubicon", "Generale romano che attraversò il Rubicone"], ["Assassinated on the Ides of March", "Assassinato alle Idi di Marzo"],
    ["Dictator for life of the Roman Republic", "Dittatore a vita della Repubblica Romana"], ["Said 'Veni, vidi, vici'", "Disse 'Veni, vidi, vici'"],
    ["Famous Roman leader", "Famoso leader romano"], ["J U L _ _ S  C _ _ S E R", "G I U L I O  C _ S A _ E"]
  ),
  makeQ("History", "World War II", "Seconda Guerra Mondiale",
    ["Global conflict from 1939 to 1945", "Conflitto globale dal 1939 al 1945"], ["Ended with atomic bombs", "Finita con le bombe atomiche"],
    ["Axis vs Allies", "Asse vs Alleati"], ["Fought in the 1940s", "Combattuta negli anni '40"],
    ["The second global war", "La seconda guerra globale"], ["W W 2", "W W 2"]
  ),
  makeQ("History", "Cleopatra", "Cleopatra",
    ["Last active ruler of the Ptolemaic Kingdom of Egypt", "Ultima regina del Regno Tolemaico d'Egitto"], ["Had relationships with Caesar and Antony", "Ebbe relazioni con Cesare e Antonio"],
    ["Famous Egyptian Queen", "Famosa Regina Egiziana"], ["Bitten by an asp", "Morsa da un aspide"],
    ["Queen of the Nile", "Regina del Nilo"], ["C L E O _ _ T R A", "C L E O P _ _ R A"]
  ),
  makeQ("History", "French Revolution", "Rivoluzione Francese",
    ["Began in 1789 with the storming of the Bastille", "Iniziò nel 1789 con la presa della Bastiglia"], ["Led to the Reign of Terror", "Portò al Regno del Terrore"],
    ["Overthrew Louis XVI", "Rovesciò Luigi XVI"], ["Guillotine was heavily used", "La ghigliottina fu molto usata"],
    ["Liberty, Equality, Fraternity", "Libertà, Uguaglianza, Fraternità"], ["Starts with F", "Inizia con R"]
  ),
  makeQ("History", "Leonardo da Vinci", "Leonardo da Vinci",
    ["Italian polymath of the Renaissance", "Polimata italiano del Rinascimento"], ["Painted the Mona Lisa", "Dipinse la Gioconda"],
    ["Designed early flying machines", "Progettò le prime macchine volanti"], ["Painted The Last Supper", "Dipinse L'Ultima Cena"],
    ["Famous Italian artist & inventor", "Famoso artista e inventore italiano"], ["L E O N A R _ _", "L E O N A R _ _"]
  ),
  makeQ("History", "Titanic", "Titanic",
    ["Sank on its maiden voyage in 1912", "Affondò nel suo viaggio inaugurale nel 1912"], ["Hit an iceberg", "Colpì un iceberg"],
    ["Famous passenger ship", "Famosa nave passeggeri"], ["Called unsinkable", "Definita inaffondabile"],
    ["Huge sunken ship", "Enorme nave affondata"], ["T I T A _ I C", "T I T A _ I C"]
  ),
  makeQ("History", "Moon Landing", "Sbarco sulla Luna",
    ["Apollo 11 mission achieved this in 1969", "La missione Apollo 11 lo ottenne nel 1969"], ["One small step for man", "Un piccolo passo per l'uomo"],
    ["Neil Armstrong was the first", "Neil Armstrong fu il primo"], ["Space race victory", "Vittoria della corsa allo spazio"],
    ["Walking on Earth's satellite", "Camminare sul satellite della Terra"], ["M _ _ N  L _ N D I N G", "S B _ _ C O  L _ N A"]
  ),
  makeQ("History", "Napoleon", "Napoleone",
    ["Emperor of the French in 1804", "Imperatore dei Francesi nel 1804"], ["Defeated at Waterloo", "Sconfitto a Waterloo"],
    ["Famous short conqueror", "Famoso conquistatore basso"], ["Exiled to Elba", "Esiliato all'Elba"],
    ["French general", "Generale francese"], ["N A P O L _ _ N", "N A P O L _ O N E"]
  ),
  makeQ("History", "Colosseum", "Colosseo",
    ["Flavian Amphitheatre in Rome", "Anfiteatro Flavio a Roma"], ["Gladiators fought here", "I gladiatori combattevano qui"],
    ["Iconic Roman monument", "Iconico monumento romano"], ["Symbol of Rome", "Simbolo di Roma"],
    ["Big arena in Italy", "Grande arena in Italia"], ["C O L O _ S _ U M", "C O L O S _ E O"]
  ),
  makeQ("History", "Vikings", "Vichinghi",
    ["Norse seafarers from late 8th to 11th century", "Navigatori norreni dalla fine dell'8° all'11° secolo"], ["Raided in longships", "Gareggiavano nei drakkar"],
    ["Warriors with horned helmets (myth)", "Guerrieri con elmi cornuti (falso mito)"], ["From Scandinavia", "Dalla Scandinavia"],
    ["Norse warriors", "Guerrieri norreni"], ["V I K I _ _ S", "V I C H I _ G _ I"]
  ),

  // CINEMA
  makeQ("Cinema", "Titanic", "Titanic",
    ["Won 11 Oscars in 1998 including Best Picture", "Vinse 11 Oscar nel 1998 incluso Miglior Film"], ["Directed by James Cameron", "Diretto da James Cameron"],
    ["Stars Leonardo DiCaprio and Kate Winslet", "Con Leonardo DiCaprio e Kate Winslet"], ["Romance on a sinking ship", "Romance su una nave che affonda"],
    ["Jack and Rose", "Jack e Rose"], ["T I T A _ I C", "T I T A _ I C"]
  ),
  makeQ("Cinema", "Star Wars", "Star Wars",
    ["George Lucas space opera", "Space opera di George Lucas"], ["Takes place a long time ago in a galaxy far, far away", "Si svolge tanto tempo fa in una galassia lontana"],
    ["Features Jedi and Sith", "Include Jedi e Sith"], ["Lightsabers!", "Spade laser!"],
    ["Luke, I am your father", "Luke, sono tuo padre"], ["S T A R  W _ _ S", "S T A R  W A R _"]
  ),
  makeQ("Cinema", "The Matrix", "Matrix",
    ["1999 sci-fi action film by the Wachowskis", "Film sci-fi d'azione del 1999 delle sorelle Wachowski"], ["Neo learns the truth about reality", "Neo scopre la verità sulla realtà"],
    ["Red pill or blue pill", "Pillola rossa o pillola blu"], ["Dodging bullets", "Schivare i proiettili"],
    ["Keanu Reeves as Neo", "Keanu Reeves come Neo"], ["M A T _ I X", "M A T _ I X"]
  ),
  makeQ("Cinema", "Avatar", "Avatar",
    ["Highest-grossing film of all time", "Film con i maggiori incassi di tutti i tempi"], ["Set on Pandora", "Ambientato su Pandora"],
    ["Blue aliens called Na'vi", "Alieni blu chiamati Na'vi"], ["Directed by James Cameron (again)", "Diretto da James Cameron (di nuovo)"],
    ["Pocahontas in space", "Pocahontas nello spazio"], ["A V A _ A R", "A V A _ A R"]
  ),
  makeQ("Cinema", "Forrest Gump", "Forrest Gump",
    ["1994 film where Tom Hanks plays a simple man", "Film del 1994 in cui Tom Hanks interpreta un uomo semplice"], ["Life is like a box of chocolates", "La vita è come una scatola di cioccolatini"],
    ["He runs a lot", "Corre molto"], ["Loves Jenny", "Ama Jenny"],
    ["Run, Forrest, run!", "Corri, Forrest, corri!"], ["F O R R _ S T", "F O R R _ S T"]
  ),
  makeQ("Cinema", "Jurassic Park", "Jurassic Park",
    ["1993 Spielberg film about cloned dinosaurs", "Film di Spielberg del 1993 su dinosauri clonati"], ["Based on Michael Crichton's novel", "Basato sul romanzo di Michael Crichton"],
    ["Theme park goes wrong", "Parco a tema va storto"], ["Life finds a way", "La vita trova un modo"],
    ["T-Rex chase", "Inseguimento del T-Rex"], ["J U R A S _ I C", "J U R A S S _ C"]
  ),
  makeQ("Cinema", "The Godfather", "Il Padrino",
    ["1972 crime film directed by Francis Ford Coppola", "Film poliziesco del 1972 di Francis Ford Coppola"], ["Marlon Brando is Don Vito Corleone", "Marlon Brando è Don Vito Corleone"],
    ["An offer he can't refuse", "Un'offerta che non si può rifiutare"], ["Mafia family saga", "Saga di una famiglia mafiosa"],
    ["Famous mob movie", "Famoso film di mafiosi"], ["G O D _ A T H E R", "P A D _ I N O"]
  ),
  makeQ("Cinema", "Harry Potter", "Harry Potter",
    ["Boy wizard movie franchise", "Franchise cinematografico del mago ragazzino"], ["Based on J.K. Rowling's books", "Basato sui libri di J.K. Rowling"],
    ["Hogwarts School of Witchcraft and Wizardry", "Scuola di Magia e Stregoneria di Hogwarts"], ["Fights Voldemort", "Combatte Voldemort"],
    ["The boy who lived", "Il bambino sopravvissuto"], ["H A R _ Y", "H A R _ Y"]
  ),
  makeQ("Cinema", "Lord of the Rings", "Signore degli Anelli",
    ["Fantasy trilogy directed by Peter Jackson", "Trilogia fantasy diretta da Peter Jackson"], ["Based on Tolkien's books", "Basata sui libri di Tolkien"],
    ["Journey to Mordor", "Viaggio verso Mordor"], ["One ring to rule them all", "Un anello per domarli"],
    ["Frodo and Sam", "Frodo e Sam"], ["L O R D...", "S I G N O R E..."]
  ),
  makeQ("Cinema", "Inception", "Inception",
    ["2010 sci-fi heist thriller by Christopher Nolan", "Thriller sci-fi del 2010 di Christopher Nolan"], ["Planting an idea in a dream", "Innestare un'idea in un sogno"],
    ["Dreams within dreams", "Sogni dentro i sogni"], ["Spinning top totem", "Totem della trottola"],
    ["Leonardo DiCaprio in dreams", "Leonardo DiCaprio nei sogni"], ["I N C _ P T I O N", "I N C _ P T I O N"]
  )
];

const fileContent = "export default " + JSON.stringify(qs, null, 2) + ";";
fs.writeFileSync("server/questions.js", fileContent);
console.log("Questions updated!");
