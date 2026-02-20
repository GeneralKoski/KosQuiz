// Pre-generated quiz rounds with translations
// Each round: category + 3 questions (generic→specific, 3pts→1pt)
// Answers are also translated per language

const rounds = [
  {
    category: { en: "World Capitals", it: "Capitali del Mondo", fr: "Capitales du Monde", es: "Capitales del Mundo" },
    questions: [
      {
        points: 3,
        text: {
          en: "This European capital sits on the Seine river and is known as the City of Light.",
          it: "Questa capitale europea si trova sulla Senna ed è conosciuta come la Città della Luce.",
          fr: "Cette capitale européenne se trouve sur la Seine et est connue comme la Ville Lumière.",
          es: "Esta capital europea se encuentra a orillas del Sena y es conocida como la Ciudad de la Luz."
        },
        answer: { en: "Paris", it: "Parigi", fr: "Paris", es: "París" }
      },
      {
        points: 2,
        text: {
          en: "This city's most famous landmark is an iron lattice tower built in 1889.",
          it: "Il monumento più famoso di questa città è una torre di ferro costruita nel 1889.",
          fr: "Le monument le plus célèbre de cette ville est une tour en fer construite en 1889.",
          es: "El monumento más famoso de esta ciudad es una torre de hierro construida en 1889."
        },
        answer: { en: "Paris", it: "Parigi", fr: "Paris", es: "París" }
      },
      {
        points: 1,
        text: {
          en: "Name the capital of France.",
          it: "Qual è la capitale della Francia?",
          fr: "Quelle est la capitale de la France ?",
          es: "¿Cuál es la capital de Francia?"
        },
        answer: { en: "Paris", it: "Parigi", fr: "Paris", es: "París" }
      }
    ]
  },
  {
    category: { en: "Science", it: "Scienza", fr: "Science", es: "Ciencia" },
    questions: [
      {
        points: 3,
        text: {
          en: "This element is essential for all known life forms and forms the backbone of organic chemistry.",
          it: "Questo elemento è essenziale per tutte le forme di vita conosciute e forma la base della chimica organica.",
          fr: "Cet élément est essentiel à toutes les formes de vie connues et forme la base de la chimie organique.",
          es: "Este elemento es esencial para todas las formas de vida conocidas y forma la base de la química orgánica."
        },
        answer: { en: "Carbon", it: "Carbonio", fr: "Carbone", es: "Carbono" }
      },
      {
        points: 2,
        text: {
          en: "This element has atomic number 6 and its symbol is a single letter.",
          it: "Questo elemento ha numero atomico 6 e il suo simbolo è una singola lettera.",
          fr: "Cet élément a le numéro atomique 6 et son symbole est une seule lettre.",
          es: "Este elemento tiene número atómico 6 y su símbolo es una sola letra."
        },
        answer: { en: "Carbon", it: "Carbonio", fr: "Carbone", es: "Carbono" }
      },
      {
        points: 1,
        text: {
          en: "Diamonds and graphite are both made entirely of which element?",
          it: "Diamanti e grafite sono entrambi composti interamente da quale elemento?",
          fr: "Les diamants et le graphite sont tous deux entièrement composés de quel élément ?",
          es: "¿Los diamantes y el grafito están hechos completamente de qué elemento?"
        },
        answer: { en: "Carbon", it: "Carbonio", fr: "Carbone", es: "Carbono" }
      }
    ]
  },
  {
    category: { en: "Music", it: "Musica", fr: "Musique", es: "Música" },
    questions: [
      {
        points: 3,
        text: {
          en: "This Austrian composer was a child prodigy who wrote his first symphony at age 8.",
          it: "Questo compositore austriaco era un bambino prodigio che scrisse la sua prima sinfonia a 8 anni.",
          fr: "Ce compositeur autrichien était un enfant prodige qui a écrit sa première symphonie à 8 ans.",
          es: "Este compositor austriaco fue un niño prodigio que escribió su primera sinfonía a los 8 años."
        },
        answer: { en: "Mozart", it: "Mozart", fr: "Mozart", es: "Mozart" }
      },
      {
        points: 2,
        text: {
          en: "This composer wrote 'The Magic Flute' and 'Don Giovanni'.",
          it: "Questo compositore scrisse 'Il Flauto Magico' e 'Don Giovanni'.",
          fr: "Ce compositeur a écrit 'La Flûte enchantée' et 'Don Giovanni'.",
          es: "Este compositor escribió 'La Flauta Mágica' y 'Don Giovanni'."
        },
        answer: { en: "Mozart", it: "Mozart", fr: "Mozart", es: "Mozart" }
      },
      {
        points: 1,
        text: {
          en: "Wolfgang Amadeus _____ — fill in the last name of this famous composer.",
          it: "Wolfgang Amadeus _____ — inserisci il cognome di questo famoso compositore.",
          fr: "Wolfgang Amadeus _____ — complétez le nom de famille de ce célèbre compositeur.",
          es: "Wolfgang Amadeus _____ — completa el apellido de este famoso compositor."
        },
        answer: { en: "Mozart", it: "Mozart", fr: "Mozart", es: "Mozart" }
      }
    ]
  },
  {
    category: { en: "Geography", it: "Geografia", fr: "Géographie", es: "Geografía" },
    questions: [
      {
        points: 3,
        text: {
          en: "This is the longest river in Africa and one of the two longest in the world.",
          it: "Questo è il fiume più lungo dell'Africa e uno dei due più lunghi al mondo.",
          fr: "C'est le plus long fleuve d'Afrique et l'un des deux plus longs au monde.",
          es: "Este es el río más largo de África y uno de los dos más largos del mundo."
        },
        answer: { en: "Nile", it: "Nilo", fr: "Nil", es: "Nilo" }
      },
      {
        points: 2,
        text: {
          en: "This river flows through Egypt and was central to ancient Egyptian civilization.",
          it: "Questo fiume attraversa l'Egitto ed era centrale per l'antica civiltà egizia.",
          fr: "Ce fleuve traverse l'Égypte et était central pour la civilisation égyptienne antique.",
          es: "Este río atraviesa Egipto y fue central para la antigua civilización egipcia."
        },
        answer: { en: "Nile", it: "Nilo", fr: "Nil", es: "Nilo" }
      },
      {
        points: 1,
        text: {
          en: "Name the famous river that flows into the Mediterranean Sea through a large delta in northern Egypt.",
          it: "Come si chiama il famoso fiume che sfocia nel Mar Mediterraneo attraverso un grande delta nel nord dell'Egitto?",
          fr: "Quel est le nom du célèbre fleuve qui se jette dans la mer Méditerranée par un grand delta dans le nord de l'Égypte ?",
          es: "¿Cómo se llama el famoso río que desemboca en el mar Mediterráneo a través de un gran delta en el norte de Egipto?"
        },
        answer: { en: "Nile", it: "Nilo", fr: "Nil", es: "Nilo" }
      }
    ]
  },
  {
    category: { en: "Literature", it: "Letteratura", fr: "Littérature", es: "Literatura" },
    questions: [
      {
        points: 3,
        text: {
          en: "This English playwright is often called the greatest writer in the English language, active in the late 16th century.",
          it: "Questo drammaturgo inglese è spesso definito il più grande scrittore in lingua inglese, attivo alla fine del XVI secolo.",
          fr: "Ce dramaturge anglais est souvent considéré comme le plus grand écrivain de langue anglaise, actif à la fin du XVIe siècle.",
          es: "Este dramaturgo inglés es considerado a menudo como el mayor escritor en lengua inglesa, activo a finales del siglo XVI."
        },
        answer: { en: "Shakespeare", it: "Shakespeare", fr: "Shakespeare", es: "Shakespeare" }
      },
      {
        points: 2,
        text: {
          en: "This author wrote 'Romeo and Juliet' and 'Hamlet'.",
          it: "Questo autore scrisse 'Romeo e Giulietta' e 'Amleto'.",
          fr: "Cet auteur a écrit 'Roméo et Juliette' et 'Hamlet'.",
          es: "Este autor escribió 'Romeo y Julieta' y 'Hamlet'."
        },
        answer: { en: "Shakespeare", it: "Shakespeare", fr: "Shakespeare", es: "Shakespeare" }
      },
      {
        points: 1,
        text: {
          en: "William _____ — the Bard of Avon. Fill in the surname.",
          it: "William _____ — il Bardo di Avon. Inserisci il cognome.",
          fr: "William _____ — le Barde d'Avon. Complétez le nom de famille.",
          es: "William _____ — el Bardo de Avon. Completa el apellido."
        },
        answer: { en: "Shakespeare", it: "Shakespeare", fr: "Shakespeare", es: "Shakespeare" }
      }
    ]
  },
  {
    category: { en: "History", it: "Storia", fr: "Histoire", es: "Historia" },
    questions: [
      {
        points: 3,
        text: {
          en: "This ancient wonder of the world is the only one still standing today, located on the Giza plateau.",
          it: "Questa antica meraviglia del mondo è l'unica ancora in piedi oggi, situata sull'altopiano di Giza.",
          fr: "Cette ancienne merveille du monde est la seule encore debout aujourd'hui, située sur le plateau de Gizeh.",
          es: "Esta antigua maravilla del mundo es la única que sigue en pie hoy, ubicada en la meseta de Guiza."
        },
        answer: { en: "Great Pyramid of Giza", it: "Grande Piramide di Giza", fr: "Grande Pyramide de Gizeh", es: "Gran Pirámide de Guiza" }
      },
      {
        points: 2,
        text: {
          en: "Built around 2560 BC, this massive structure served as a tomb for Pharaoh Khufu.",
          it: "Costruita intorno al 2560 a.C., questa struttura massiccia serviva come tomba per il faraone Cheope.",
          fr: "Construite vers 2560 av. J.-C., cette structure massive servait de tombeau au pharaon Khéops.",
          es: "Construida alrededor del 2560 a.C., esta estructura masiva sirvió como tumba del faraón Keops."
        },
        answer: { en: "Great Pyramid of Giza", it: "Grande Piramide di Giza", fr: "Grande Pyramide de Gizeh", es: "Gran Pirámide de Guiza" }
      },
      {
        points: 1,
        text: {
          en: "What is the name of the largest and oldest of the three pyramids in Giza, Egypt?",
          it: "Come si chiama la più grande e antica delle tre piramidi di Giza, in Egitto?",
          fr: "Quel est le nom de la plus grande et la plus ancienne des trois pyramides de Gizeh, en Égypte ?",
          es: "¿Cómo se llama la más grande y antigua de las tres pirámides de Guiza, en Egipto?"
        },
        answer: { en: "Great Pyramid of Giza", it: "Grande Piramide di Giza", fr: "Grande Pyramide de Gizeh", es: "Gran Pirámide de Guiza" }
      }
    ]
  },
  {
    category: { en: "Technology", it: "Tecnologia", fr: "Technologie", es: "Tecnología" },
    questions: [
      {
        points: 3,
        text: {
          en: "This company, founded in a garage in Cupertino in 1976, revolutionized personal computing and mobile phones.",
          it: "Questa azienda, fondata in un garage a Cupertino nel 1976, ha rivoluzionato i computer personali e i telefoni cellulari.",
          fr: "Cette entreprise, fondée dans un garage à Cupertino en 1976, a révolutionné l'informatique personnelle et les téléphones mobiles.",
          es: "Esta empresa, fundada en un garaje en Cupertino en 1976, revolucionó la informática personal y los teléfonos móviles."
        },
        answer: { en: "Apple", it: "Apple", fr: "Apple", es: "Apple" }
      },
      {
        points: 2,
        text: {
          en: "Steve Jobs co-founded this company that created the iPhone, iPad, and Macintosh.",
          it: "Steve Jobs ha co-fondato questa azienda che ha creato l'iPhone, l'iPad e il Macintosh.",
          fr: "Steve Jobs a cofondé cette entreprise qui a créé l'iPhone, l'iPad et le Macintosh.",
          es: "Steve Jobs cofundó esta empresa que creó el iPhone, el iPad y el Macintosh."
        },
        answer: { en: "Apple", it: "Apple", fr: "Apple", es: "Apple" }
      },
      {
        points: 1,
        text: {
          en: "Which tech company uses a bitten fruit as its logo?",
          it: "Quale azienda tecnologica usa un frutto morsicato come logo?",
          fr: "Quelle entreprise technologique utilise un fruit croqué comme logo ?",
          es: "¿Qué empresa tecnológica usa una fruta mordida como logotipo?"
        },
        answer: { en: "Apple", it: "Apple", fr: "Apple", es: "Apple" }
      }
    ]
  },
  {
    category: { en: "Sports", it: "Sport", fr: "Sports", es: "Deportes" },
    questions: [
      {
        points: 3,
        text: {
          en: "This sport, the most popular in the world, is played with a spherical ball by two teams of eleven players.",
          it: "Questo sport, il più popolare al mondo, si gioca con un pallone sferico da due squadre di undici giocatori.",
          fr: "Ce sport, le plus populaire au monde, se joue avec un ballon sphérique par deux équipes de onze joueurs.",
          es: "Este deporte, el más popular del mundo, se juega con un balón esférico por dos equipos de once jugadores."
        },
        answer: { en: "Football", it: "Calcio", fr: "Football", es: "Fútbol" }
      },
      {
        points: 2,
        text: {
          en: "The FIFA World Cup is the biggest international tournament for this sport.",
          it: "La Coppa del Mondo FIFA è il più grande torneo internazionale per questo sport.",
          fr: "La Coupe du Monde FIFA est le plus grand tournoi international pour ce sport.",
          es: "La Copa del Mundo FIFA es el torneo internacional más grande para este deporte."
        },
        answer: { en: "Football", it: "Calcio", fr: "Football", es: "Fútbol" }
      },
      {
        points: 1,
        text: {
          en: "What sport does Lionel Messi play professionally?",
          it: "Quale sport pratica professionalmente Lionel Messi?",
          fr: "Quel sport Lionel Messi pratique-t-il professionnellement ?",
          es: "¿Qué deporte practica profesionalmente Lionel Messi?"
        },
        answer: { en: "Football", it: "Calcio", fr: "Football", es: "Fútbol" }
      }
    ]
  },
  {
    category: { en: "Cinema", it: "Cinema", fr: "Cinéma", es: "Cine" },
    questions: [
      {
        points: 3,
        text: {
          en: "This 1994 film follows a man with a low IQ who unwittingly influences several historical events in the 20th century.",
          it: "Questo film del 1994 segue un uomo con un basso QI che inconsapevolmente influenza diversi eventi storici del XX secolo.",
          fr: "Ce film de 1994 suit un homme au QI faible qui influence involontairement plusieurs événements historiques du XXe siècle.",
          es: "Esta película de 1994 sigue a un hombre con bajo coeficiente intelectual que influye involuntariamente en varios eventos históricos del siglo XX."
        },
        answer: { en: "Forrest Gump", it: "Forrest Gump", fr: "Forrest Gump", es: "Forrest Gump" }
      },
      {
        points: 2,
        text: {
          en: "Tom Hanks won an Oscar for this film where his character famously says 'Life is like a box of chocolates.'",
          it: "Tom Hanks ha vinto un Oscar per questo film in cui il suo personaggio dice la famosa frase 'La vita è come una scatola di cioccolatini.'",
          fr: "Tom Hanks a remporté un Oscar pour ce film où son personnage dit la célèbre phrase 'La vie est comme une boîte de chocolats.'",
          es: "Tom Hanks ganó un Oscar por esta película donde su personaje dice la famosa frase 'La vida es como una caja de bombones.'"
        },
        answer: { en: "Forrest Gump", it: "Forrest Gump", fr: "Forrest Gump", es: "Forrest Gump" }
      },
      {
        points: 1,
        text: {
          en: "_____ Gump — name the 1994 film starring Tom Hanks.",
          it: "_____ Gump — come si chiama il film del 1994 con Tom Hanks?",
          fr: "_____ Gump — nommez le film de 1994 avec Tom Hanks.",
          es: "_____ Gump — nombra la película de 1994 protagonizada por Tom Hanks."
        },
        answer: { en: "Forrest Gump", it: "Forrest Gump", fr: "Forrest Gump", es: "Forrest Gump" }
      }
    ]
  },
  {
    category: { en: "Nature", it: "Natura", fr: "Nature", es: "Naturaleza" },
    questions: [
      {
        points: 3,
        text: {
          en: "This is the tallest mountain on Earth, located on the border between Nepal and Tibet.",
          it: "Questa è la montagna più alta della Terra, situata al confine tra Nepal e Tibet.",
          fr: "C'est la plus haute montagne de la Terre, située à la frontière entre le Népal et le Tibet.",
          es: "Esta es la montaña más alta de la Tierra, ubicada en la frontera entre Nepal y el Tíbet."
        },
        answer: { en: "Mount Everest", it: "Monte Everest", fr: "Mont Everest", es: "Monte Everest" }
      },
      {
        points: 2,
        text: {
          en: "Standing at 8,849 meters, this peak is part of the Himalayan mountain range.",
          it: "Con i suoi 8.849 metri, questa vetta fa parte della catena montuosa dell'Himalaya.",
          fr: "Culminant à 8 849 mètres, ce sommet fait partie de la chaîne de montagnes de l'Himalaya.",
          es: "Con 8.849 metros de altura, este pico es parte de la cordillera del Himalaya."
        },
        answer: { en: "Mount Everest", it: "Monte Everest", fr: "Mont Everest", es: "Monte Everest" }
      },
      {
        points: 1,
        text: {
          en: "What is the name of the highest peak in the world, first summited by Tenzing Norgay and Edmund Hillary in 1953?",
          it: "Come si chiama la vetta più alta del mondo, scalata per la prima volta da Tenzing Norgay ed Edmund Hillary nel 1953?",
          fr: "Quel est le nom du plus haut sommet du monde, gravi pour la première fois par Tenzing Norgay et Edmund Hillary en 1953 ?",
          es: "¿Cómo se llama el pico más alto del mundo, escalado por primera vez por Tenzing Norgay y Edmund Hillary en 1953?"
        },
        answer: { en: "Mount Everest", it: "Monte Everest", fr: "Mont Everest", es: "Monte Everest" }
      }
    ]
  }
];

export default rounds;
