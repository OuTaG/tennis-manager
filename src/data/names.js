// Top 50 réels (noms modifiés), listes de prénoms/noms, nationalités.

// ─── NAME GENERATORS ───────────────────────────────────────────────────────────
// Real top 50 players with their actual nationality codes
// Order matters: index 0 = world #1, etc. (Sinner & Alcaraz are MUCH stronger)
export const NAMES_REAL_TOP50 = [
  { name: "J. Sinterm", code: "it", age: 22 },             // 1
  { name: "C. Alcázar", code: "es", age: 20 },             // 2
  { name: "A. Zwerev", code: "de", age: 26 },              // 3
  { name: "D. Medvedov", code: "rus", age: 27 },           // 4
  { name: "T. Frisk", code: "us", age: 26 },               // 5
  { name: "C. Ruus", code: "no", age: 25 },                // 6
  { name: "N. Djokic", code: "srb", age: 36 },             // 7
  { name: "A. Rublyov", code: "rus", age: 26 },            // 8
  { name: "G. Dimitrev", code: "bg", age: 32 },            // 9
  { name: "S. Tsitsipan", code: "gr", age: 25 },           // 10
  { name: "H. Runne", code: "dk", age: 20 },               // 11
  { name: "U. Humblot", code: "fr", age: 25 },             // 12
  { name: "B. Sheltan", code: "us", age: 21 },             // 13
  { name: "T. Pauls", code: "us", age: 26 },               // 14
  { name: "F. Tiafol", code: "us", age: 25 },              // 15
  { name: "F. Auger-Alassime", code: "ca", age: 23 },      // 16
  { name: "K. Khatchanov", code: "rus", age: 27 },         // 17
  { name: "S. Korba", code: "us", age: 23 },               // 18
  { name: "A. de Minoor", code: "au", age: 24 },           // 19
  { name: "L. Musetri", code: "it", age: 21 },             // 20
  { name: "T. Machac", code: "cz", age: 23 },              // 21
  { name: "J. Lehocka", code: "cz", age: 22 },             // 22
  { name: "F. Cerundano", code: "arg", age: 25 },          // 23
  { name: "A. Davidovich Fontana", code: "es", age: 24 },  // 24
  { name: "T. Griekspaar", code: "nl", age: 27 },          // 25
  { name: "M. Berrettino", code: "it", age: 27 },          // 26
  { name: "A. Mannorino", code: "fr", age: 35 },           // 27
  { name: "B. Nakishima", code: "us", age: 22 },           // 28
  { name: "D. Lajavic", code: "srb", age: 33 },            // 29
  { name: "M. Arnaldi", code: "it", age: 22 },             // 30
  { name: "P. Carreño Bueno", code: "es", age: 32 },       // 31
  { name: "A. Bublak", code: "kz", age: 26 },              // 32
  { name: "F. Coráia", code: "arg", age: 31 },             // 33
  { name: "J. Munoz", code: "es", age: 26 },               // 34
  { name: "Y. Hanfman", code: "de", age: 32 },             // 35
  { name: "A. Vukar", code: "au", age: 27 },               // 36
  { name: "M. Kecmanic", code: "srb", age: 24 },           // 37
  { name: "S. Baéz", code: "arg", age: 22 },               // 38
  { name: "R. Bautista Aput", code: "es", age: 35 },       // 39
  { name: "M. Cilac", code: "hr", age: 35 },               // 40
  { name: "G. Mpetshi Perraud", code: "fr", age: 20 },     // 41
  { name: "F. Marozán", code: "hu", age: 23 },             // 42
  { name: "Z. Borgs", code: "be", age: 24 },               // 43
  { name: "T. Kokkinaks", code: "au", age: 27 },           // 44
  { name: "L. Tienn", code: "us", age: 18 },               // 45
  { name: "M. Fucsavics", code: "hu", age: 32 },           // 46
  { name: "F. Coballi", code: "it", age: 21 },             // 47
  { name: "A. Mullor", code: "fr", age: 26 },              // 48
  { name: "C. Norrey", code: "uk", age: 28 },              // 49
  { name: "M. McDonell", code: "us", age: 28 },            // 50
];

// ─── WTA : TOP 50 RÉEL (noms modifiés) ───────────────────────────────────────
// Classement WTA réel de début 2026, âges en 2026 (pas de décalage).
export const NAMES_REAL_WTA_TOP50 = [
  { name: "A. Sabalenko", code: "by", age: 28 },          // 1
  { name: "I. Swiatak", code: "pl", age: 25 },            // 2
  { name: "C. Gauffe", code: "us", age: 22 },             // 3
  { name: "A. Anisimava", code: "us", age: 25 },          // 4
  { name: "E. Rybakova", code: "kz", age: 27 },           // 5
  { name: "J. Pegola", code: "us", age: 32 },             // 6
  { name: "M. Kees", code: "us", age: 31 },               // 7
  { name: "J. Paolina", code: "it", age: 30 },            // 8
  { name: "M. Andreyeva", code: "rus", age: 19 },         // 9
  { name: "E. Alexandrava", code: "rus", age: 31 },       // 10
  { name: "B. Bencik", code: "ch", age: 29 },             // 11
  { name: "E. Svitolena", code: "ua", age: 32 },          // 12
  { name: "C. Tausen", code: "dk", age: 24 },             // 13
  { name: "L. Noskava", code: "cz", age: 22 },            // 14
  { name: "K. Muchava", code: "cz", age: 30 },            // 15
  { name: "E. Navaro", code: "us", age: 25 },             // 16
  { name: "L. Samsanova", code: "rus", age: 27 },         // 17
  { name: "V. Mboka", code: "ca", age: 20 },              // 18
  { name: "N. Osaki", code: "jp", age: 29 },              // 19
  { name: "E. Mertins", code: "be", age: 31 },            // 20
  { name: "D. Kasatkine", code: "au", age: 29 },          // 21
  { name: "D. Shnaidar", code: "rus", age: 22 },          // 22
  { name: "J. Ostapanko", code: "lv", age: 29 },          // 23
  { name: "B. Krejcikava", code: "cz", age: 30 },         // 24
  { name: "M. Kostyak", code: "ua", age: 24 },            // 25
  { name: "P. Badossa", code: "es", age: 28 },            // 26
  { name: "L. Fernándes", code: "ca", age: 24 },          // 27
  { name: "Q. Zhen", code: "cn", age: 24 },               // 28
  { name: "B. Haddad Maya", code: "br", age: 30 },        // 29
  { name: "I. Jovik", code: "us", age: 19 },              // 30
  { name: "S. Kenen", code: "us", age: 28 },              // 31
  { name: "E. Raducana", code: "uk", age: 24 },           // 32
  { name: "M. Joynt", code: "au", age: 20 },              // 33
  { name: "M. Vondrasova", code: "cz", age: 27 },         // 34
  { name: "A. Kalinskaïa", code: "rus", age: 28 },        // 35
  { name: "V. Kudermetava", code: "rus", age: 29 },       // 36
  { name: "L. Boissin", code: "fr", age: 23 },            // 37
  { name: "M. Frach", code: "pl", age: 28 },              // 38
  { name: "J. Cristiane", code: "ro", age: 28 },          // 39
  { name: "A. Lee", code: "us", age: 26 },                // 40
  { name: "M. Kessner", code: "us", age: 27 },            // 41
  { name: "E. Cocciaretti", code: "it", age: 25 },        // 42
  { name: "S. Cirstia", code: "ro", age: 36 },            // 43
  { name: "D. Yastremskaïa", code: "ua", age: 26 },       // 44
  { name: "Y. Putintsiva", code: "kz", age: 31 },         // 45
  { name: "A. Potapava", code: "at", age: 25 },           // 46
  { name: "D. Vekik", code: "hr", age: 30 },              // 47
  { name: "C. Osario", code: "co", age: 25 },             // 48
  { name: "P. Stearn", code: "us", age: 25 },             // 49
  { name: "T. Mariah", code: "de", age: 39 },             // 50
];

// Pays supplémentaires du circuit féminin (prénoms / noms déjà au féminin).
export const WTA_EXTRA_NAME_LISTS = {
  "Ukraine": ["Elina Marta Dayana Anhelina Lesia Kateryna Yuliia Daria Oleksandra Viktoriia", "Svitolina Kostyuk Yastremska Kalinina Tsurenko Zavatska Kozyreva Bondarenko Snigur Starodubtseva"],
  "Biélorussie": ["Aryna Victoria Aliaksandra Iryna Olga Anastasia Volha Yuliya Darya Lidziya", "Sabalenka Azarenka Sasnovich Shymanovich Govortsova Lapko Marozava Kanapatskaya Hvozdik Ivanova"],
};

// Prénoms féminins par pays (même découpage que EXTRA_NAME_LISTS).
export const FEMALE_FIRST_NAMES = {
  "France": "Léa Chloé Manon Camille Inès Clara Jade Alizé Caroline Océane",
  "Espagne": "Lucía Paula Carla Sara Marta Nuria Cristina Garbiñe Jessica Rebeka",
  "Italie": "Giulia Martina Sara Chiara Elisabetta Lucia Camila Jasmine Francesca Sofia",
  "Allemagne": "Laura Anna Lena Jule Tatjana Eva Sabine Angelique Julia Mona",
  "Grande-Bretagne": "Emma Katie Harriet Heather Jodie Sonay Francesca Lily Olivia Amelia",
  "USA": "Ashley Madison Emma Jessica Taylor Hailey Peyton Caroline Alycia Danielle",
  "Argentine": "Julia Nadia Paula María Solana Lourdes Martina Sofía Catalina Camila",
  "Russie": "Anastasia Daria Ekaterina Anna Veronika Liudmila Mirra Polina Erika Kamilla",
  "Autriche": "Julia Sinja Barbara Tamira Lilli Anna Mavie Laura Viktoria Lena",
  "Suisse": "Belinda Viktorija Jil Simona Rebeka Céline Susan Leonie Joanne Ylena",
  "Belgique": "Elise Greet Ysaline Kirsten Yanina Marie Hanne Lien Sofie Lara",
  "Pays-Bas": "Arantxa Lesley Suzan Demi Eva Arianne Indy Bibiane Anouk Lisa Camille",
  "Irlande": "Aoife Siobhán Niamh Ciara Sinéad Róisín Orla Saoirse Clodagh Méabh",
  "Monaco": "Charlotte Pauline Camille Louise Alexandra Clara Juliette Mathilde Anaïs Elsa",
  "Danemark": "Clara Caroline Sofia Ida Freja Emma Karen Mathilde Line Laura",
  "Norvège": "Ulrikke Malene Ingrid Nora Emma Thea Sofie Ida Maja Hedda",
  "Suède": "Rebecca Mirjam Caijsa Johanna Elsa Ebba Linnea Alva Maja Sofia",
  "Finlande": "Anastasia Laura Emma Aino Venla Ella Iida Sanni Oona Eveliina",
  "Estonie": "Anett Kaia Elena Maileen Liisa Kristiina Grete Laura Triin Mari",
  "Lettonie": "Jeļena Anastasija Diāna Daniela Līga Kristīne Laura Elza Darja Paula",
  "Lituanie": "Justina Lukrecija Ieva Gabija Akvilė Rūta Eglė Austėja Kamilė Urtė",
  "Pologne": "Iga Magdalena Magda Katarzyna Maja Weronika Martyna Agnieszka Urszula Alicja",
  "Tchéquie": "Karolína Markéta Barbora Linda Kateřina Petra Marie Lucie Brenda Sára",
  "Slovaquie": "Anna Rebecca Viktória Kristína Dominika Daniela Tereza Renáta Mia Natália",
  "Slovénie": "Tamara Kaja Polona Dalila Ana Nika Katarina Pia Veronika Maša",
  "Croatie": "Donna Petra Jana Ana Antonia Tara Lucija Iva Mirjana Ajla",
  "Serbie": "Olga Aleksandra Nina Lola Ana Jelena Natalija Mia Dejana Teodora",
  "Hongrie": "Anna Dalma Panna Réka Tímea Fanny Natália Luca Amarissa Adrienn",
  "Roumanie": "Simona Sorana Irina Jaqueline Ana Elena Gabriela Mihaela Monica Andreea",
  "Bulgarie": "Viktoriya Elena Tsvetana Isabella Gergana Sesil Petia Denislava Lia Aleksandrina",
  "Grèce": "Maria Despina Valentini Eleni Sapfo Michaela Christina Katerina Ioanna Anna",
  "Turquie": "Zeynep Çağla İpek Berfu Pemra Ayla Elif Duru Ecem Melis",
  "Géorgie": "Ekaterine Mariam Sofia Nino Oksana Tamar Ana Natela Salome Elene",
  "Arménie": "Ani Elina Mariam Anahit Lilit Nare Gayane Arpi Sona Tatev",
  "Azerbaïdjan": "Leyla Aysel Nigar Gunel Sabina Kamila Narmin Fidan Aynur Lala",
  "Kazakhstan": "Elena Yulia Anna Zarina Yaroslava Kamila Galina Dariya Aruzhan Gozal",
  "Ouzbékistan": "Nigina Sabina Akgul Iroda Kamila Dilnoza Madina Shakhzoda Malika Nodira",
  "Israël": "Shahar Lina Noa Maya Yuval Shelly Tamar Lior Ayelet Michal",
  "Portugal": "Francisca Matilde Inês Beatriz Mariana Sara Michelle Carolina Joana Maria",
  "Brésil": "Beatriz Laura Luisa Carolina Gabriela Ingrid Teliana Nauhany Thaísa Ana",
  "Mexique": "Renata Giuliana Fernanda Ana Marcela Victoria María Sofía Camila Valeria",
  "Chili": "Daniela Fernanda Alexa Bárbara Javiera Antonia Catalina Constanza Isidora Trinidad",
  "Colombie": "Camila Mariana Emiliana Yuliana María Valentina Daniela Laura Sofía Paula",
  "Pérou": "Lucciana Anastasia Bianca Romina Camila Valeria Ximena Fernanda Daniela Andrea",
  "Uruguay": "Guillermina Lucía Sofía Agustina Valentina Florencia Camila Martina Josefina Victoria",
  "Paraguay": "Verónica Montserrat Lara Sara Rossana Camila Alexa Fátima Leticia Diana",
  "Venezuela": "Andrea Daniela Gabriela Valentina María Mariana Isabella Lucía Sofía Carolina",
  "Équateur": "Mell Doménica Camila María Valeria Emilia Daniela Paula Gabriela Ana",
  "Canada": "Leylah Victoria Bianca Eugenie Rebecca Marina Gabriela Carol Stacey Kayla",
  "Australie": "Ashleigh Daria Ajla Kimberly Maya Olivia Storm Priscilla Talia Arina",
  "Nouvelle-Zélande": "Lulu Erin Paige Valentina Katherine Emily Monique Sacha Jade Holly",
  "Japon": "Naomi Moyuka Mai Nao Misaki Kurumi Ena Eri Yuki Aoi",
  "Corée du Sud": "Sujeong Nalae Gayoung Dabin Sohyun Jihee Yujin Seoyeon Minji Hyewon",
  "Chine": "Qinwen Xinyu Shuai Lin Yafan Xiyu Saisai Yue Xiaodi Wushuang",
  "Hong Kong": "Eudice Cody Ching Wingyi Hoiki Lamying Tszyan Puishan Kaiwen Yuet",
  "Taïwan": "Suwei Chiajung Yungjan Latisha Joanna Yuchieh Ensheuan Fangan Hsinyu Chiayi",
  "Inde": "Sania Ankita Karman Rutuja Sahaja Vaishnavi Shrivalli Zeel Riya Maaya",
  "Indonésie": "Aldila Priska Jessy Beatrice Janice Angelique Fitriani Lavinia Rifanty Putri",
  "Malaisie": "Aqilah Jawairiah Nurul Siti Meiling Aisyah Farah Huiyi Nadia Sofea",
  "Singapour": "Sarah Charmaine Joanna Shaheen Natalie Kimberly Rachel Grace Emily Chloe",
  "Thaïlande": "Mananchaya Lanlana Peangtarn Luksika Tamarine Patcharin Varunya Noppawan Kamonwan Anchisa",
  "Vietnam": "Linh Anh Mai Thao Huong Lan Ngoc Trang Thuy Vy",
  "Philippines": "Alexandra Marian Shaira Edilyn Jeanette Clarice Andrea Bea Kristine Mae",
  "Afrique du Sud": "Isabella Chanel Zoe Natasha Amanda Lesedi Thandi Megan Lara Kayla",
  "Kenya": "Angela Cynthia Faith Mercy Joy Wanjiru Grace Akinyi Esther Njeri",
  "Nigeria": "Oyinlomo Marylove Blessing Chioma Funmi Ngozi Adaeze Aisha Kemi Tolu",
  "Maroc": "Yasmine Malak Nadia Lina Salma Aya Kenza Rim Ghita Sara",
  "Tunisie": "Ons Chiraz Ola Yasmine Feryel Lina Nour Melek Sarra Emna",
  "Égypte": "Mayar Sandra Lamis Hana Farida Nour Salma Yasmin Malak Jana",
  "Arabie Saoudite": "Yara Lujain Reem Nouf Sara Dana Rawan Hala Lama Jood",
  "Émirats": "Fatima Mariam Shamma Hessa Maitha Alia Mahra Latifa Noora Shaikha",
  "Qatar": "Noor Hamda Aisha Maryam Dana Sheikha Lulwa Moza Ghada Rana",
  "Koweït": "Fatima Danah Shahad Lulwa Maryam Ghalia Sara Haya Nour Rawan",
  "Bahreïn": "Noor Maryam Hessa Latifa Sara Zainab Fatema Shaikha Dana Amal",
  "Oman": "Fatma Muna Ruqaya Huda Asma Shaima Laila Nada Sumaya Amal",
  "Jordanie": "Lana Rania Dana Leen Tala Yara Sarah Zeina Hala Noor",
  "Liban": "Nour Maya Yasmina Rita Christelle Joëlle Carla Lara Stéphanie Mira",
  "Ukraine": "Elina Marta Dayana Anhelina Lesia Kateryna Yuliia Daria Oleksandra Viktoriia",
  "Biélorussie": "Aryna Victoria Aliaksandra Iryna Olga Anastasia Volha Yuliya Darya Lidziya",
};

// Nationalités tirées au sort pour les joueuses générées (au-delà du top 50).
export const WTA_NATIONALITIES = [
  { code: "us",  country: "USA",             flag: "🇺🇸", weight: 5 },
  { code: "rus", country: "Russie",          flag: "🇷🇺", weight: 4 },
  { code: "cz",  country: "Tchéquie",        flag: "🇨🇿", weight: 4 },
  { code: "fr",  country: "France",          flag: "🇫🇷", weight: 3 },
  { code: "it",  country: "Italie",          flag: "🇮🇹", weight: 3 },
  { code: "es",  country: "Espagne",         flag: "🇪🇸", weight: 2 },
  { code: "de",  country: "Allemagne",       flag: "🇩🇪", weight: 2 },
  { code: "uk",  country: "Grande-Bretagne", flag: "🇬🇧", weight: 2 },
  { code: "pl",  country: "Pologne",         flag: "🇵🇱", weight: 2 },
  { code: "ro",  country: "Roumanie",        flag: "🇷🇴", weight: 2 },
  { code: "ua",  country: "Ukraine",         flag: "🇺🇦", weight: 2 },
  { code: "cn",  country: "Chine",           flag: "🇨🇳", weight: 2 },
  { code: "jp",  country: "Japon",           flag: "🇯🇵", weight: 2 },
  { code: "au",  country: "Australie",       flag: "🇦🇺", weight: 2 },
  { code: "arg", country: "Argentine",       flag: "🇦🇷", weight: 1 },
  { code: "ca",  country: "Canada",          flag: "🇨🇦", weight: 1 },
  { code: "kz",  country: "Kazakhstan",      flag: "🇰🇿", weight: 1 },
  { code: "by",  country: "Biélorussie",     flag: "🇧🇾", weight: 1 },
  { code: "sk",  country: "Slovaquie",       flag: "🇸🇰", weight: 1 },
  { code: "hr",  country: "Croatie",         flag: "🇭🇷", weight: 1 },
];

export const NAME_PARTS = {
  fr: { first: ["Lucas", "Hugo", "Adrien", "Maxime", "Antoine", "Quentin", "Thomas", "Pierre", "Julien", "Romain", "Florian", "Vincent", "Mathieu", "Damien", "Cyril", "Yoan", "Etienne", "Olivier"], last: ["Martin", "Dubois", "Bernard", "Robert", "Petit", "Durand", "Leroy", "Moreau", "Simon", "Laurent", "Lefebvre", "Roux", "Vincent", "Fournier", "Girard", "Bonnet", "Dupont", "Lambert", "Fontaine"] },
  es: { first: ["Diego", "Pablo", "Carlos", "Javier", "Roberto", "Miguel", "Daniel", "Sergio", "Andrés", "Fernando", "Ricardo", "Joaquín"], last: ["García", "Martínez", "López", "Sánchez", "González", "Rodríguez", "Pérez", "Fernández", "Ruiz", "Torres", "Vives", "Castro"] },
  it: { first: ["Marco", "Luca", "Matteo", "Stefano", "Andrea", "Roberto", "Francesco", "Alessandro", "Davide", "Federico"], last: ["Rossi", "Ferrari", "Russo", "Bianchi", "Romano", "Conti", "Ricci", "Marino", "Gallo", "Costa"] },
  de: { first: ["Lukas", "Tobias", "Jonas", "Felix", "Maximilian", "Henrik", "Stefan", "Daniel", "Florian", "Andreas"], last: ["Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hofmann"] },
  uk: { first: ["James", "William", "Henry", "Oliver", "George", "Charles", "Edward", "Thomas", "Daniel", "Michael"], last: ["Smith", "Jones", "Taylor", "Brown", "Williams", "Davies", "Wilson", "Evans", "Thomas", "Roberts"] },
  us: { first: ["Brandon", "Tyler", "Connor", "Nathan", "Ethan", "Jake", "Aaron", "Brett", "Cole", "Dylan"], last: ["Johnson", "Williams", "Davis", "Miller", "Anderson", "Thompson", "Harris", "Martin", "Walker", "Young"] },
  arg: { first: ["Mateo", "Juan", "Tomás", "Nicolás", "Federico", "Sebastián", "Facundo", "Martín"], last: ["González", "Romero", "Acosta", "Silva", "Pereira", "Domínguez", "Vázquez", "Castro"] },
  rus: { first: ["Pavel", "Anton", "Mikhail", "Igor", "Sergei", "Dmitri", "Alexei", "Roman"], last: ["Petrov", "Volkov", "Sokolov", "Popov", "Lebedev", "Kozlov", "Novikov", "Smirnov"] },
};

// First names / last names for every country of the game (space-separated,
// '_' stands for a space inside a last name). Parsed lazily by namesForCountry().
export const EXTRA_NAME_LISTS = {
  "Autriche": ["Dominic Sebastian Jurij Lukas Filip Alexander Maximilian Gerald Thomas Jakob", "Gruber Huber Wagner Bauer Pichler Moser Hofer Leitner Ofner Novak"],
  "Suisse": ["Luca Noah Leandro Marc Dominic Jérôme Henri Stan Yannick Alexander", "Keller Meier Brunner Frei Baumann Zimmermann Riedi Hüsler Stricker Laaksonen"],
  "Belgique": ["Arthur Louis Victor Gilles Raphaël Jules David Steve Kimmer Zizou", "Peeters Janssens Maes Jacobs Mertens Willems Goffin Bergs Coppejans Darcis"],
  "Pays-Bas": ["Tallon Botic Jesper Robin Thiemo Gijs Daan Jesse Bram Tim Camille", "de_Jong Jansen de_Vries van_Dijk Bakker Visser Griekspoor van_Rijthoven Brouwer Haase Dejongh"],
  "Irlande": ["Conor Seán Cian Oisín Darragh Liam Niall Ciarán Eoin Rory", "Murphy Kelly Byrne Ryan O'Brien Walsh O'Connor McCarthy Doyle Gallagher"],
  "Monaco": ["Lucas Valentin Hugo Romain Benjamin Louis Mathieu Thomas Arnaud Julien", "Catarina Balleret Grimaldi Pastor Ghiglione Médecin Boisson Vatrican Lorenzi Rossi"],
  "Danemark": ["Holger Mikael August Elmer Rasmus Kristian Frederik Oliver Magnus Emil", "Rune Nielsen Jensen Hansen Pedersen Møller Larsen Torpegaard Kristensen Andersen"],
  "Norvège": ["Casper Viktor Magnus Nicolai Ola Henrik Sondre Eirik Jonas Tobias", "Ruud Durasovic Johansen Olsen Berg Haugen Bakken Lund Dahl Solberg"],
  "Suède": ["Elias Leo Mikael Filip Oscar Rafael Karl Isak Johan Viktor", "Ymer Andersson Johansson Karlsson Nilsson Eriksson Larsson Lindqvist Borg Söderling"],
  "Finlande": ["Emil Otto Eero Harri Jarkko Patrik Mikael Aleksi Juho Veeti", "Ruusuvuori Virtanen Korhonen Nieminen Mäkinen Heliövaara Lehtonen Hämäläinen Koskinen Salminen"],
  "Estonie": ["Mark Kristjan Siim Rasmus Markus Karl Sten Oliver Robin Jürgen", "Tamm Saar Sepp Mägi Kask Kukk Rebane Ilves Lepik Koppel"],
  "Lettonie": ["Ernests Mārtiņš Kārlis Roberts Artūrs Jānis Rihards Edgars Dāvis Andris", "Gulbis Bērziņš Kalniņš Ozoliņš Liepiņš Krūmiņš Podžus Vītols Kļaviņš Zariņš"],
  "Lituanie": ["Ričardas Vilius Lukas Mantas Tadas Jonas Dovydas Laurynas Edas Matas", "Berankis Kazlauskas Petrauskas Jankauskas Grigas Vasiliauskas Butkus Paulauskas Žukauskas Stankevičius"],
  "Pologne": ["Hubert Kamil Jerzy Łukasz Maks Jakub Mateusz Filip Szymon Piotr", "Kowalski Nowak Wiśniewski Majchrzak Zieliński Kubot Lewandowski Woźniak Dąbrowski Hurkacz"],
  "Tchéquie": ["Jiří Tomáš Jakub Vít Dalibor Zdeněk Lukáš Radek Adam Ondřej", "Novák Lehečka Menšík Macháč Kopřiva Veselý Svoboda Dvořák Černý Procházka"],
  "Slovaquie": ["Lukáš Martin Alex Jozef Norbert Andrej Filip Miloš Peter Marek", "Klein Molčan Gombos Kováč Horváth Varga Tóth Lacko Zelenay Polášek"],
  "Slovénie": ["Aljaž Blaž Žiga Jan Nik Luka Matic Tadej Gregor Rok", "Bedene Kavčič Rola Novak Horvat Krajnc Zupan Potočnik Kovačič Mlakar"],
  "Croatie": ["Borna Marin Ivan Mate Luka Dino Nino Franko Duje Antonio", "Ćorić Čilić Dodig Pavić Prižmić Serdarušić Horvat Kovačević Babić Marić"],
  "Serbie": ["Novak Dušan Laslo Filip Miomir Viktor Nikola Stefan Marko Janko", "Lajović Kecmanović Međedović Krajinović Troicki Tipsarević Petrović Jovanović Nikolić Marković"],
  "Hongrie": ["Márton Fábián Zsombor Attila Máté Dániel Bence Péter Gergő Balázs", "Fucsovics Marozsán Piros Nagy Kovács Tóth Szabó Horváth Varga Kiss"],
  "Roumanie": ["Marius Filip Nicholas Victor Dragoș Andrei Radu Ștefan Cezar Gabriel", "Copil Cornea Jianu Hănescu Tecău Popescu Ionescu Dumitru Stan Constantin"],
  "Bulgarie": ["Grigor Dimitar Adrian Alexander Petar Iliyan Viktor Georgi Nikolay Todor", "Dimitrov Kuzmanov Andreev Lazarov Ivanov Georgiev Petrov Nikolov Stoyanov Todorov"],
  "Grèce": ["Stefanos Petros Michail Aristotelis Konstantinos Nikolaos Dimitrios Georgios Ioannis Christos", "Tsitsipas Pervolarakis Kalovelonis Papadopoulos Nikolaidis Georgiou Oikonomou Pappas Vlachos Makris"],
  "Turquie": ["Cem Altuğ Ergi Yankı Marsel Emre Burak Mert Arda Kerem", "İlkel Çelikbilek Kırkın Erel Yılmaz Kaya Demir Şahin Aydın Öztürk"],
  "Géorgie": ["Nikoloz Aleksandre Giorgi Luka Irakli Levan Davit Saba Nika Zurab", "Basilashvili Metreveli Beridze Kapanadze Lomidze Gelashvili Chkheidze Tsiklauri Maisuradze Gogoladze"],
  "Arménie": ["Aram Davit Tigran Arman Hayk Narek Gor Levon Artur Sargis", "Hovhannisyan Sargsyan Grigoryan Petrosyan Harutyunyan Avetisyan Karapetyan Hakobyan Mkrtchyan Vardanyan"],
  "Azerbaïdjan": ["Elvin Rashad Tural Orkhan Kamran Nijat Farid Ruslan Samir Emil", "Aliyev Mammadov Huseynov Hasanov Guliyev Ismayilov Abbasov Karimov Babayev Rzayev"],
  "Kazakhstan": ["Alexander Mikhail Dmitry Timofei Beibit Denis Andrey Grigoriy Aslan Dias", "Bublik Kukushkin Shevchenko Nedovyesov Popko Golubev Zhukayev Skatov Khabibulin Yevseyev"],
  "Ouzbékistan": ["Denis Sanjar Farrukh Jurabek Khumoyun Sergey Temur Akmal Bekzod Jasur", "Istomin Fayziev Dustov Karimov Sultanov Rakhimov Yusupov Nurmatov Abdullaev Tursunov"],
  "Israël": ["Dudi Jonathan Yshai Daniel Edan Amir Noam Itay Ido Omer", "Sela Erlich Glinik Cukierman Levy Cohen Mizrahi Peretz Biton Friedman"],
  "Portugal": ["João Nuno Tiago Rui Pedro Gonçalo Francisco Diogo Miguel Rodrigo", "Sousa Rodrigues Ferreira Gonçalves Carvalho Pinto Borges Cardoso Faria Lopes"],
  "Brésil": ["Thiago João Pedro Gustavo Rafael Felipe Bruno Lucas Matheus Guilherme", "Silva Santos Oliveira Souza Pereira Costa Almeida Ferreira Monteiro Menezes"],
  "Mexique": ["Santiago Emiliano Diego Rodrigo Alejandro Luis Jorge Eduardo Andrés Ricardo", "Hernández García Martínez López González Ramírez Flores Torres Rivera Morales"],
  "Chili": ["Benjamín Vicente Cristóbal Matías Joaquín Tomás Nicolás Ignacio Felipe Agustín", "Muñoz Rojas Díaz Soto Contreras Silva Sepúlveda Garín Araya Fuentes"],
  "Colombie": ["Santiago Sebastián Camilo Andrés Juan Daniel Julián Mateo Felipe Esteban", "Rodríguez Gómez Cárdenas Ospina Castaño Restrepo Vargas Rincón Mejía Galán"],
  "Pérou": ["Luis Jorge Renzo Piero Diego Álvaro Gonzalo Paolo Hugo Bruno", "Quispe Flores Rojas Huamán Mendoza Varillas Chávez Salazar Ramos Castillo"],
  "Uruguay": ["Martín Pablo Franco Nicolás Joaquín Diego Facundo Gonzalo Rodrigo Agustín", "Pereira Rodríguez Fernández Suárez Cuevas Olivera Bentancur Méndez Sosa Rivero"],
  "Paraguay": ["Hugo Diego Marcelo Óscar Carlos Enzo Nelson Fabián Julio Gustavo", "Benítez Ortiz Giménez Cáceres Villalba Duarte Aquino Ramírez Báez Riquelme"],
  "Venezuela": ["Luis José Carlos Ricardo Daniel Andrés Gabriel Alejandro Miguel Oscar", "Rodríguez Pérez González Hernández Martínez Rondón Salazar Lugo Bermúdez Cedeño"],
  "Équateur": ["Emilio Diego Roberto Andrés Iván Nicolás Gonzalo Xavier Pablo Mauricio", "Zambrano Andrade Cevallos Mera Vera Quiroz Escobar Gómez Estrella Moreira"],
  "Canada": ["Félix Denis Milos Vasek Gabriel Alexis Liam Nicolas Steven Frank", "Tremblay Gagnon Roy Côté Bouchard Galarneau Draxl Diallo Pospisil Dancevic"],
  "Australie": ["Alex Alexei Thanasi Jordan Rinky Max Christopher Aleksandar Adam James", "Walton Duckworth Thompson Purcell O'Connell Vukic Smith Wilson Kelly Mitchell"],
  "Nouvelle-Zélande": ["Kiranpal Rubin Michael Artem Ajeet Marcus José Finn Jack Oliver", "Pannu Statham Venus Sitak Rai Daniell Wilson Taylor Walker Brown"],
  "Japon": ["Kei Yoshihito Taro Yosuke Shintaro Sho Rio Yasutaka Hiroki Go", "Nishikori Nishioka Watanuki Mochizuki Shimabukuro Uchiyama Sugita Soeda Ito Tanaka"],
  "Corée du Sud": ["Soonwoo Hyeon Seongchan Duckhee Yunseong Jisung Minkyu Jaewon Seungwoo Taehyun", "Kwon Chung Hong Lee Kim Park Nam Choi Jung Kang"],
  "Chine": ["Zhizhen Yibing Juncheng Yunchao Haoran Jiaxuan Zihan Mingyu Tianyi Jun", "Zhang Wu Shang Li Wang Liu Chen Yang Zhou Huang"],
  "Hong Kong": ["Coleman Kailun Hoyin Chunhin Tszfung Kaming Wingkit Paklong Mankit Hei", "Wong Chan Leung Cheung Lau Lee Ng Ho Yip Tang"],
  "Taïwan": ["Chunhsin Yuhsiou Tunglin Yenhsun Chengpeng Hsinhan Jason Ray Weichen Pohsuan", "Tseng Hsu Wu Lu Chen Lin Huang Wang Chang Liu"],
  "Inde": ["Sumit Ramkumar Yuki Prajnesh Sasikumar Mukund Arjun Rohan Leander Aditya", "Nagal Ramanathan Bhambri Gunneswaran Kadhe Bopanna Paes Sharma Patel Singh"],
  "Indonésie": ["Christopher Aldila Nathan Justin Rifqi David Gunawan Muhammad Anthony Rizky", "Rungkat Sutjiadi Barki Susanto Fitriadi Agung Wibowo Santoso Pratama Halim"],
  "Malaisie": ["Mitsuki Syed Adam Darren Sheng Ahmad Wei Muhammad Aidil Jun", "Leong Naguib Tan Lim Chong Ismail Rahman Ong Wong Abdullah"],
  "Singapour": ["Shaheed Roy Daniel Ryan Luca Ethan Marcus Junwei Isaac Jonas", "Alam Lim Tan Ong Goh Chua Ng Teo Koh Yeo"],
  "Thaïlande": ["Kasidit Pruchya Wishaya Maximus Sanchai Sonchat Danai Thanapet Palaphoom Krittin", "Samrej Isaro Trongcharoenchaikul Ratiwatana Udomchoke Srichaphan Chuaytanapong Kovapitukted Boonsri Suwan"],
  "Vietnam": ["Hoang Nam Linh Minh Quang Duc Tuan Huy Khanh Phuc", "Ly Nguyen Tran Le Pham Hoang Vu Dang Bui Do"],
  "Philippines": ["Alex Treat Ruben Francis Johnny Jeson Marcus Paolo Carlo Miguel", "Eala Huey Gonzales Alcantara Arcilla Patrombon Reyes Santos Cruz Bautista"],
  "Afrique du Sud": ["Lloyd Kevin Raven Kris Wayne Philip Ruan Pieter Lucas Thabo", "Harris Anderson Klaasen van_der_Merwe Ferreira Henning Roelofse Botha Nel Dlamini"],
  "Kenya": ["Albert Ismael Kevin Brian Collins Dennis Ian Victor Joshua Samuel", "Njogu Changawa Cheruiyot Kiprono Otieno Wanjala Kamau Mwangi Ochieng Kiplagat"],
  "Nigeria": ["Sylvester Christian Abdul Joseph Emeka Chidi Tunde Segun Uche Musa", "Emmanuel Paul Mumuni Imeh Okafor Adeyemi Okonkwo Balogun Eze Bello"],
  "Maroc": ["Mehdi Yassine Amine Reda Anas Adam Othmane Hamza Karim Younes", "Benali Amrani Bennani Chaoui Idrissi Tazi Ouahabi Lahlou Alami Berrada"],
  "Tunisie": ["Aziz Malek Skander Moez Wassim Ilyes Amine Yassine Karim Anis", "Dougaz Jaziri Echargui Trabelsi Ben_Salah Jebali Chaabane Mansouri Gharbi Hamdi"],
  "Égypte": ["Mohamed Ahmed Omar Youssef Karim Mostafa Mahmoud Khaled Tarek Hassan", "Safwat Ibrahim Mostafa Abdelrahman Fawzy Shaker Nasser Soliman Gamal Farag"],
  "Arabie Saoudite": ["Abdullah Faisal Saud Khalid Sultan Hamad Rashid Nasser Fahad Majid", "Al_Harbi Al_Qahtani Al_Otaibi Al_Ghamdi Al_Dosari Al_Shehri Al_Zahrani Al_Mutairi Al_Anazi Al_Juhani"],
  "Émirats": ["Mohammed Saeed Rashid Hamdan Ahmed Omar Khalifa Mansour Zayed Majid", "Al_Mansoori Al_Shamsi Al_Nuaimi Al_Ketbi Al_Mazrouei Al_Hammadi Al_Dhaheri Al_Suwaidi Al_Falasi Al_Marzooqi"],
  "Qatar": ["Mubarak Jabor Khalid Tamim Hamad Ali Nasser Abdulrahman Fahad Saoud", "Al_Thani Al_Kuwari Al_Marri Al_Sulaiti Al_Mohannadi Al_Naimi Al_Emadi Al_Hajri Al_Kaabi Al_Attiyah"],
  "Koweït": ["Abdullah Mohammad Yousef Fahad Bader Salem Nawaf Talal Mishal Ali", "Al_Sabah Al_Mutairi Al_Ajmi Al_Enezi Al_Rashidi Al_Shammari Al_Kandari Al_Hajri Al_Otaibi Al_Awadhi"],
  "Bahreïn": ["Isa Salman Hamad Ali Ahmed Khalid Yusuf Nasser Mohammed Abdulla", "Al_Khalifa Al_Dosari Al_Mahmood Al_Ansari Al_Zayani Al_Moayyed Al_Shirawi Al_Sayed Al_Qassab Bukhammas"],
  "Oman": ["Sultan Said Faisal Haitham Salim Khalid Ahmed Mazin Talal Hilal", "Al_Balushi Al_Busaidi Al_Harthy Al_Hinai Al_Rawahi Al_Maskari Al_Lawati Al_Farsi Al_Kindi Al_Siyabi"],
  "Jordanie": ["Abdullah Omar Rami Ziad Hashem Tareq Laith Yazan Majed Fadi", "Al_Majali Haddad Nasser Awad Hanna Mansour Tarawneh Khasawneh Obeidat Rawashdeh"],
  "Liban": ["Karim Rami Ziad Fadi Samer Nadim Jad Elie Georges Marc", "Khoury Haddad Saab Aoun Rizk Hage Karam Nassar Chamoun Frem"],
};

// Country (French name) → key of the original NAME_PARTS lists.
export const COUNTRY_NAME_KEYS = { "France": "fr", "Espagne": "es", "Italie": "it", "Allemagne": "de", "Grande-Bretagne": "uk", "USA": "us", "Argentine": "arg", "Russie": "rus" };

// All nationalities used (Top 50 plus fillers for rest of pool)
export const NATIONALITIES = [
  { code: "fr", country: "France", flag: "🇫🇷", weight: 4 },
  { code: "es", country: "Espagne", flag: "🇪🇸", weight: 3 },
  { code: "it", country: "Italie", flag: "🇮🇹", weight: 3 },
  { code: "de", country: "Allemagne", flag: "🇩🇪", weight: 3 },
  { code: "uk", country: "Grande-Bretagne", flag: "🇬🇧", weight: 2 },
  { code: "us", country: "USA", flag: "🇺🇸", weight: 4 },
  { code: "arg", country: "Argentine", flag: "🇦🇷", weight: 2 },
  { code: "rus", country: "Russie", flag: "🇷🇺", weight: 2 },
];

// Specific nationality lookups (for top 50 only - they don't use the random pool)
export const NAT_BY_CODE = {
  fr:  { code: "fr",  country: "France",          flag: "🇫🇷" },
  es:  { code: "es",  country: "Espagne",         flag: "🇪🇸" },
  it:  { code: "it",  country: "Italie",          flag: "🇮🇹" },
  de:  { code: "de",  country: "Allemagne",       flag: "🇩🇪" },
  uk:  { code: "uk",  country: "Grande-Bretagne", flag: "🇬🇧" },
  us:  { code: "us",  country: "USA",             flag: "🇺🇸" },
  arg: { code: "arg", country: "Argentine",       flag: "🇦🇷" },
  rus: { code: "rus", country: "Russie",          flag: "🇷🇺" },
  ca:  { code: "ca",  country: "Canada",          flag: "🇨🇦" },
  au:  { code: "au",  country: "Australie",       flag: "🇦🇺" },
  cz:  { code: "cz",  country: "Tchéquie",        flag: "🇨🇿" },
  srb: { code: "srb", country: "Serbie",          flag: "🇷🇸" },
  hr:  { code: "hr",  country: "Croatie",         flag: "🇭🇷" },
  no:  { code: "no",  country: "Norvège",         flag: "🇳🇴" },
  dk:  { code: "dk",  country: "Danemark",        flag: "🇩🇰" },
  bg:  { code: "bg",  country: "Bulgarie",        flag: "🇧🇬" },
  gr:  { code: "gr",  country: "Grèce",           flag: "🇬🇷" },
  nl:  { code: "nl",  country: "Pays-Bas",        flag: "🇳🇱" },
  be:  { code: "be",  country: "Belgique",        flag: "🇧🇪" },
  hu:  { code: "hu",  country: "Hongrie",         flag: "🇭🇺" },
  kz:  { code: "kz",  country: "Kazakhstan",      flag: "🇰🇿" },
  // Circuit WTA
  by:  { code: "by",  country: "Biélorussie",     flag: "🇧🇾" },
  pl:  { code: "pl",  country: "Pologne",         flag: "🇵🇱" },
  lv:  { code: "lv",  country: "Lettonie",        flag: "🇱🇻" },
  ua:  { code: "ua",  country: "Ukraine",         flag: "🇺🇦" },
  ch:  { code: "ch",  country: "Suisse",          flag: "🇨🇭" },
  jp:  { code: "jp",  country: "Japon",           flag: "🇯🇵" },
  cn:  { code: "cn",  country: "Chine",           flag: "🇨🇳" },
  br:  { code: "br",  country: "Brésil",          flag: "🇧🇷" },
  ro:  { code: "ro",  country: "Roumanie",        flag: "🇷🇴" },
  co:  { code: "co",  country: "Colombie",        flag: "🇨🇴" },
  at:  { code: "at",  country: "Autriche",        flag: "🇦🇹" },
  sk:  { code: "sk",  country: "Slovaquie",       flag: "🇸🇰" },
};
