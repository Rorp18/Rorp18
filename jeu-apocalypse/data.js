'use strict';
/* ===== CENDRES — données du jeu (cartes, rôles, scénarios) ===== */

const STATS = {
  force:   { n: 'Force',   i: '💪' },
  adresse: { n: 'Adresse', i: '🎯' },
  savoir:  { n: 'Savoir',  i: '📚' },
  coeur:   { n: 'Cœur',    i: '❤️‍🔥' }
};
const RES = {
  food:  { n: 'Nourriture', i: '🥫' },
  water: { n: 'Eau',        i: '💧' },
  meds:  { n: 'Médicaments', i: '💊' },
  mat:   { n: 'Matériel',   i: '🔧' }
};

const LENGTHS = [
  { days: 8,  goal: 4, n: 'Court',  t: '≈ 30 min' },
  { days: 12, goal: 7, n: 'Normal', t: '≈ 60 min' },
  { days: 16, goal: 9, n: 'Long',   t: '≈ 90 min' }
];

/* ---------- Objets (cartes équipement) ---------- */
const ITEMS = {
  hache:    { n: 'Hache',             i: '🪓', stat: 'force',   b: 2, u: 3 },
  pied:     { n: 'Pied-de-biche',     i: '🪛', stat: 'force',   b: 2, u: 3 },
  pistolet: { n: 'Pistolet',          i: '🔫', stat: 'force',   b: 3, u: 2 },
  arc:      { n: 'Arc',               i: '🏹', stat: 'adresse', b: 2, u: 3 },
  jumelles: { n: 'Jumelles',          i: '🔭', stat: 'adresse', b: 2, u: 3 },
  lampe:    { n: 'Lampe torche',      i: '🔦', stat: 'adresse', b: 1, u: 5 },
  outils:   { n: 'Boîte à outils',    i: '🛠️', stat: 'adresse', b: 2, u: 3 },
  trousse:  { n: 'Trousse de secours', i: '🧰', stat: 'savoir', b: 2, u: 3 },
  livre:    { n: 'Livre de survie',   i: '📖', stat: 'savoir',  b: 2, u: 3 },
  carte:    { n: 'Carte routière',    i: '🗺️', stat: 'savoir',  b: 2, u: 3 },
  radio:    { n: 'Radio à manivelle', i: '📻', stat: 'coeur',   b: 2, u: 3 },
  guitare:  { n: 'Guitare',           i: '🎸', stat: 'coeur',   b: 2, u: 3 }
};

/* ---------- Rôles (cartes personnage) ---------- */
const ROLES = [
  { id: 'medecin',   n: 'Médecin',      i: '🩺', stats: { force: 1, adresse: 2, savoir: 4, coeur: 2 }, item: 'trousse',
    perk: 'Ses soins rendent 1 ❤️ de plus.' },
  { id: 'mecano',    n: 'Mécano',       i: '🔩', stats: { force: 2, adresse: 3, savoir: 3, coeur: 1 }, item: 'outils',
    perk: 'Ses renforts de l\'abri valent +1 défense.' },
  { id: 'chasseur',  n: 'Chasseur',     i: '🏹', stats: { force: 3, adresse: 4, savoir: 1, coeur: 1 }, item: 'arc',
    perk: 'Chaque chasse rapporte +1 🥫.' },
  { id: 'eclaireur', n: 'Éclaireur',    i: '🧭', stats: { force: 1, adresse: 4, savoir: 2, coeur: 2 }, item: 'jumelles',
    perk: '+1 aux jets d\'exploration.' },
  { id: 'cuisinier', n: 'Cuisinier',    i: '🍲', stats: { force: 2, adresse: 2, savoir: 2, coeur: 3 }, item: 'guitare',
    perk: 'Le camp économise 1 🥫 chaque nuit.' },
  { id: 'leader',    n: 'Ancien militaire', i: '🎖️', stats: { force: 3, adresse: 1, savoir: 2, coeur: 3 }, item: 'radio',
    perk: '+1 🕊️ Espoir chaque matin.' }
];

/* ---------- Scénarios ---------- */
const SCENARIOS = [
  { id: 'hiver', n: 'L\'Hiver Éternel', i: '❄️',
    blurb: 'Un nuage de cendres a masqué le soleil. −25 °C. Chaque nuit, il faut du bois pour tenir.',
    goalName: 'Atteindre les serres du Sud',
    start: { food: 6, water: 5, meds: 2, mat: 5 }, hope: 6, cold: true, threatMod: 0,
    threat: ['Des pillards affamés rôdent autour du camp.', 'Des silhouettes frigorifiées tentent de forcer l\'entrée.'],
    intro: 'Le ciel est gris depuis des mois. La dernière station de radio a parlé de serres chauffées par géothermie, loin au Sud. Votre groupe a tenu jusqu\'ici. Le froid, lui, ne pardonne pas.',
    win: 'Derrière une colline, des vitres embuées et de la lumière : les serres ! La chaleur vous enveloppe. Vous avez survécu à l\'Hiver.',
    surv: 'Le dégel n\'est pas venu, mais vous êtes toujours debout. Le groupe continuera à avancer, jour après jour.' },
  { id: 'horde', n: 'La Horde', i: '🧟',
    blurb: 'Le virus a emporté le monde. Les infectés errent en meutes. Le bruit est votre ennemi.',
    goalName: 'Rejoindre le convoi militaire',
    start: { food: 6, water: 6, meds: 3, mat: 3 }, hope: 6, cold: false, threatMod: 1,
    threat: ['Une horde cogne aux barricades toute la nuit.', 'Des infectés rampent le long des murs du camp.'],
    intro: 'Trois semaines depuis l\'Épidémie. Une fréquence militaire annonce un dernier convoi d\'évacuation qui passe à l\'est. Il faudra être là à temps, et vivants.',
    win: 'Le grondement des moteurs ! Le convoi s\'arrête, les soldats vous font signe. Vous êtes sauvés.',
    surv: 'Le convoi est passé sans vous, mais le camp tient. Peut-être qu\'un autre viendra.' },
  { id: 'maree', n: 'La Grande Marée', i: '🌊',
    blurb: 'Les océans ont envahi les terres. Il y a de l\'eau partout, sauf à boire. La nourriture manque.',
    goalName: 'Rejoindre l\'Arche des hauts plateaux',
    start: { food: 4, water: 8, meds: 2, mat: 4 }, hope: 6, cold: false, threatMod: 0,
    threat: ['Les crues et les courants sapent vos fondations.', 'Des embarcations de pillards accostent dans le noir.'],
    intro: 'Le niveau de la mer monte chaque jour. Les anciens parlent d\'une Arche, construite sur les hauts plateaux, où l\'on accueille les survivants. Reste à l\'atteindre.',
    win: 'Au sommet de la falaise, l\'Arche se dresse, immense. On vous tend la main : vous avez réussi.',
    surv: 'L\'Arche est encore loin, mais vous avez trouvé un toit sec. Pour l\'instant.' },
  { id: 'silence', n: 'Le Grand Silence', i: '📡',
    blurb: 'Une tempête solaire a grillé toute l\'électronique. Plus rien ne marche. Les hommes se déchirent.',
    goalName: 'Atteindre le bunker de Cheyenne',
    start: { food: 5, water: 5, meds: 3, mat: 4 }, hope: 6, cold: false, threatMod: 0,
    threat: ['Une bande de pillards tente un assaut dans le noir.', 'Des silhouettes armées testent vos défenses.'],
    intro: 'Plus de lumière, plus de réseau, plus de lois. Un vieux radioamateur parle d\'un bunker autonome à plusieurs jours de marche. La route sera longue et peuplée.',
    win: 'Les portes blindées s\'ouvrent sur un monde encore éclairé. Le bunker vous accueille. Le Silence est fini pour vous.',
    surv: 'Le bunker reste un rêve, mais votre groupe est solide. L\'avenir reste à écrire.' }
];

/* ---------- Butin aléatoire ---------- */
function loot() {
  return pick([
    ['Des boîtes de conserve oubliées au fond d\'un placard.', { food: 2 }],
    ['Un bidon d\'eau encore scellé.', { water: 2 }],
    ['De la ferraille et des planches encore saines.', { mat: 2 }],
    ['Une pharmacie de salle de bain presque intacte.', { meds: 1 }],
    ['Un sac de randonneur : un peu de tout.', { food: 1, water: 1, mat: 1 }],
    ['Un objet utile, caché derrière un meuble.', { item: true }],
    ['Une photo de famille, souvenir d\'avant. Ça réconforte.', { hope: 1, mat: 1 }],
    ['Des vivres… et un mot laissé par un ancien occupant.', { food: 2, hope: 1 }]
  ]);
}
function mergeFx(a, b) {
  const o = { ...a };
  for (const k in b) o[k] = (typeof b[k] === 'number' && typeof o[k] === 'number') ? o[k] + b[k] : (o[k] || b[k]);
  return o;
}
function loot2() {
  const a = loot(), b = loot();
  return [a[0] + ' Et ce n\'est pas tout : ' + b[0].charAt(0).toLowerCase() + b[0].slice(1), mergeFx(a[1], b[1])];
}

/* ---------- Actions de la journée (mode Table) ----------
   l: libellé · s: stat testée · d: difficulté (2d6 + stat ≥ d) · c: coût
   w: succès · cw: réussite critique (double 6) · f: échec · t: 'heal' (choisir un patient) */
const ACTIONS = [
  { id: 'fouiller', n: 'Fouiller les ruines', i: '🏚️', desc: 'Cherche du butin dans les environs.',
    s: 'adresse', d: 8, w: () => loot(), cw: () => loot2(),
    f: ['Tu ne trouves rien d\'utile, juste de la poussière.', {}] },
  { id: 'chasser', n: 'Chasser / pêcher', i: '🍖', desc: 'Rapporte de la nourriture.',
    s: 'force', d: 8,
    w: p => ['Une belle prise !', { food: 2 + (p.role === 'chasseur' ? 1 : 0) }],
    cw: p => ['Un vrai festin !', { food: 4 + (p.role === 'chasseur' ? 1 : 0) }],
    f: ['Les proies ont filé. Bredouille.', {}] },
  { id: 'puiser', n: 'Puiser / purifier l\'eau', i: '🚰', desc: 'Rapporte de l\'eau potable.',
    s: 'savoir', d: 7, w: ['Eau filtrée et bouillie : potable.', { water: 3 }],
    cw: ['Une source claire et abondante !', { water: 5 }],
    f: ['L\'eau est trouble : tu ne prends pas de risque.', {}] },
  { id: 'renforcer', n: 'Renforcer l\'abri', i: '🛡️', desc: 'Dépense 1 🔧 pour monter la défense.',
    s: 'force', d: 7, c: { mat: 1 },
    w: p => ['Les barricades sont plus solides.', { def: 1 + (p.role === 'mecano' ? 1 : 0) }],
    cw: p => ['Une vraie forteresse !', { def: 2 + (p.role === 'mecano' ? 1 : 0) }],
    f: ['Le montage ne tient pas. Matériel perdu.', {}] },
  { id: 'soigner', n: 'Soigner un blessé', i: '🩹', desc: 'Dépense 1 💊 pour rendre des ❤️.', t: 'heal',
    s: 'savoir', d: 6, c: { meds: 1 },
    w: p => ['Les soins font effet.', { heal: 2 + (p.role === 'medecin' ? 1 : 0) }],
    cw: p => ['Guérison remarquable !', { heal: 3 + (p.role === 'medecin' ? 1 : 0) }],
    f: ['Le geste est maladroit, mais ça aide un peu.', { heal: 1 }] },
  { id: 'rassurer', n: 'Remonter le moral', i: '🕊️', desc: 'Gagne de l\'Espoir.',
    s: 'coeur', d: 7, w: ['Tes mots réchauffent le camp.', { hope: 2 }],
    cw: ['Un discours qui reste dans les mémoires !', { hope: 3 }],
    f: ['Personne n\'a le cœur à sourire.', {}] },
  { id: 'explorer', n: 'Explorer vers l\'objectif', i: '🧭', desc: 'Fait avancer vers le but. Risqué.',
    s: 'adresse', d: 9, pb: { eclaireur: 1 },
    w: ['Vous gagnez du terrain vers l\'objectif.', { prog: 1 }],
    cw: ['Une route dégagée : beaucoup de terrain gagné !', { prog: 2 }],
    f: ['Le chemin est impraticable. Tu rebrousses chemin, blessé.', { hp: -1 }] },
  { id: 'repos', n: 'Se reposer', i: '🛏️', desc: 'Récupère 1 ❤️. Aucun jet.',
    w: ['Tu te reposes enfin. Ça fait du bien.', { hp: 1 }] }
];

/* ---------- Cartes événement ---------- */
const EVENTS = [];
const ev = (id, tags, i, n, text, choices) => EVENTS.push({ id, tags, i, n, text, choices });

// -- Générales
ev('epave', ['*'], '🚗', 'L\'épave', 'Une voiture renversée bloque la route. Le coffre est entrouvert, quelque chose brille à l\'intérieur.', [
  { l: 'Fouiller le coffre', s: 'adresse', d: 8, w: ['Sous les sièges, un sac de sport rempli de conserves.', { food: 3 }], f: ['Le métal tranchant te lacère la main.', { hp: -1 }] },
  { l: 'Passer son chemin', w: ['Vous contournez l\'épave. Mieux vaut ne pas tenter le diable.', {}] }
]);
ev('blesse', ['*'], '🩹', 'L\'inconnu blessé', 'Un homme est étendu au bord du chemin, la jambe en sang. Il murmure : « S\'il vous plaît… »', [
  { l: 'Le soigner (−1 💊)', c: { meds: 1 }, s: 'savoir', d: 6, w: ['Il se remet vite. En remerciement, il vous livre l\'emplacement d\'une cache.', { food: 2, mat: 1, hope: 1 }], f: ['Malgré vos soins, il s\'éteint dans la nuit. Le groupe est ébranlé.', { hope: -1 }] },
  { l: 'Lui laisser de l\'eau (−1 💧)', c: { water: 1 }, w: ['Il vous remercie d\'un faible sourire. Vous continuez, la conscience tranquille.', { hope: 1 }] },
  { l: 'L\'abandonner', w: ['Vous passez sans un regard. Le silence pèse lourd sur le camp.', { hope: -1 }] }
]);
ev('orage', ['*'], '🌧️', 'La pluie noire', 'Le ciel gronde. Une pluie sombre et froide se met à tomber sur le camp.', [
  { l: 'Récolter l\'eau avec des bâches', s: 'adresse', d: 7, w: ['Les bâches se remplissent vite : de quoi boire pour plusieurs jours.', { water: 3 }], f: ['L\'eau est souillée de cendres. Inutilisable.', {}] },
  { l: 'Se mettre à l\'abri', w: ['Vous attendez que ça passe, serrés les uns contre les autres.', { hope: 1 }] }
]);
ev('radio', ['*'], '📻', 'Voix dans la nuit', 'Un grésillement sort d\'un vieux poste : une voix annonce un point de ralliement.', [
  { l: 'Décrypter le message', s: 'savoir', d: 8, w: ['Les coordonnées sont claires : vous avez gagné du temps sur la route.', { prog: 1, hope: 1 }], f: ['Trop de parasites. Le message se perd.', { hope: -1 }] },
  { l: 'Éteindre : ça attire l\'attention', w: ['Le silence retombe. Prudent, mais frustrant.', {}] }
]);
ev('puits', ['*'], '🕳️', 'Le vieux puits', 'Un puits au milieu d\'un champ. L\'eau est trouble, mais elle existe.', [
  { l: 'Filtrer et boire', s: 'savoir', d: 8, w: ['Après filtrage, une eau claire et fraîche.', { water: 4 }], f: ['Une mauvaise eau. Des crampes toute la nuit.', { hp: -1 }] },
  { l: 'Remplir quelques bidons sans risque', w: ['Vous prenez le strict minimum.', { water: 1 }] }
]);
ev('intox', ['*'], '🤢', 'Conserves avariées', 'Les boîtes de la veille étaient pourries. Plusieurs d\'entre vous se tordent de douleur.', [
  { l: 'Soigner tout le monde (−1 💊)', c: { meds: 1 }, w: ['Les médicaments calment les symptômes. Vous vous en tirez sans trop de mal.', {}] },
  { l: 'Serrer les dents', w: ['Une nuit horrible. Tout le monde y laisse des forces.', { hpAll: -1 }] }
]);
ev('dispute', ['*'], '😠', 'La dispute', 'Un reproche de trop, et la tension explose : on s\'accuse de gaspiller les vivres.', [
  { l: 'Calmer les esprits', s: 'coeur', d: 8, w: ['Les voix se baissent, on se serre la main. Plus soudés qu\'avant.', { hope: 2 }], f: ['Les mots font mal. Quelqu\'un claque la porte.', { hope: -2 }] },
  { l: 'Laisser couler', w: ['La tension retombe d\'elle-même, mais la rancune reste.', { hope: -1 }] }
]);
ev('cache', ['*'], '🏚️', 'La trappe', 'Une trappe dissimulée sous un tapis : une cache de survivaliste ?', [
  { l: 'Forcer la trappe', s: 'force', d: 9, w: ['Un abri rempli de provisions !', { food: 3, water: 2, mat: 1, item: true }], f: ['La trappe résiste… et vous blesse à la main.', { hp: -1 }] },
  { l: 'La contourner', w: ['Peut-être un piège. Vous ne prenez pas le risque.', {}] }
]);
ev('chien', ['*'], '🐕', 'Le chien errant', 'Un chien maigre vous suit à distance depuis ce matin.', [
  { l: 'L\'apprivoiser (−1 🥫)', c: { food: 1 }, s: 'coeur', d: 7, w: ['Il remue la queue. Une présence réconfortante.', { hope: 2 }], f: ['Il grogne et s\'enfuit avec la nourriture.', {}] },
  { l: 'L\'ignorer', w: ['Il finit par disparaître derrière une colline.', {}] }
]);
ev('enfant', ['*'], '🧒', 'La petite fille', 'Une petite fille, seule, serre un ours en peluche. Elle ne parle pas.', [
  { l: 'La rassurer', s: 'coeur', d: 8, w: ['Elle vous prend la main. Pour la première fois depuis longtemps, quelqu\'un sourit.', { hope: 3 }], f: ['Elle s\'enfuit en pleurant. Vous vous sentez impuissant.', { hope: -1 }] },
  { l: 'Lui laisser des vivres (−1 🥫)', c: { food: 1 }, w: ['Elle disparaît avec le paquet. Vous espérez la revoir.', { hope: 1 }] }
]);
ev('pont', ['*'], '🌉', 'Le pont brisé', 'Un pont à moitié effondré barre le chemin. De l\'autre côté, la route semble dégagée.', [
  { l: 'Traverser sur les poutrelles', s: 'adresse', d: 9, w: ['Vous franchissez le vide ! Un raccourci précieux.', { prog: 1 }], f: ['Une poutre cède : chute douloureuse.', { hp: -2 }] },
  { l: 'Chercher un détour', w: ['Le détour est long mais sûr.', {}] }
]);
ev('marchand', ['*'], '🛒', 'Le marchand', 'Un marchand ambulant traîne sa charrette. « Tout se troque, mes amis. »', [
  { l: 'Échanger 2 🥫 contre un objet', c: { food: 2 }, w: ['Il vous tend un objet emballé dans un chiffon.', { item: true }] },
  { l: 'Échanger 2 💧 contre 2 💊', c: { water: 2 }, w: ['Marché conclu. Il disparaît dans la brume.', { meds: 2 }] },
  { l: 'Refuser poliment', w: ['Le marchand hausse les épaules et poursuit sa route.', {}] }
]);
ev('calme', ['*'], '🌙', 'Un jour de répit', 'Aujourd\'hui, rien. Pas un bruit, pas une menace. Le camp en profite pour souffler.', [
  { l: 'Profiter du calme', w: ['Chacun récupère un peu de ses blessures.', { hpAll: 1 }] },
  { l: 'Mettre à profit pour réparer', w: ['Vous consolidez les barricades.', { def: 1 }] }
]);
ev('incendie', ['*'], '🔥', 'La ferme en flammes', 'Une colonne de fumée monte d\'une ferme voisine. Des réserves sont peut-être encore intactes.', [
  { l: 'Sauver ce qui peut l\'être', s: 'force', d: 8, w: ['Vous sortez des sacs de grains avant l\'effondrement.', { food: 3 }], f: ['Les flammes vous brûlent le bras.', { hp: -1 }] },
  { l: 'Rester à distance', w: ['Vous regardez la ferme brûler en silence.', {}] }
]);
ev('journal', ['*'], '📔', 'Le journal', 'Dans un tiroir, le journal d\'un survivant qui a tenu 200 jours.', [
  { l: 'Le lire à voix haute', s: 'coeur', d: 6, w: ['Ses mots donnent du courage à tout le monde.', { hope: 2 }], f: ['La fin du journal est sombre… le moral en prend un coup.', { hope: -1 }] },
  { l: 'Y chercher des conseils pratiques', s: 'savoir', d: 7, w: ['Des astuces précieuses pour mieux fortifier le camp.', { def: 1 }], f: ['Rien d\'utile, juste des souvenirs.', {}] }
]);

// -- Hiver
ev('tempete', ['hiver'], '🌨️', 'Tempête de neige', 'Le blizzard s\'abat sur le camp. Le vent arrache les bâches.', [
  { l: 'Colmater les brèches (−1 🔧)', c: { mat: 1 }, s: 'force', d: 8, w: ['Le camp tient bon malgré la tourmente.', { def: 1 }], f: ['Le blizzard emporte une partie du toit.', { hpAll: -1 }] },
  { l: 'Se serrer autour du feu', w: ['Vous brûlez des meubles pour survivre à la nuit.', { mat: -1, hope: 1 }] }
]);
ev('lac', ['hiver'], '🎣', 'Le lac gelé', 'Sous la glace, des ombres fugitives : des poissons.', [
  { l: 'Percer la glace et pêcher', s: 'adresse', d: 8, w: ['Une pêche miraculeuse !', { food: 4 }], f: ['La glace craque : bain glacé !', { hp: -1 }] },
  { l: 'Ramasser du bois sur la rive', s: 'force', d: 7, w: ['Du bois sec : de quoi tenir plusieurs nuits.', { mat: 3 }], f: ['Rien que de la neige.', {}] }
]);
ev('traces', ['hiver'], '👣', 'Traces dans la neige', 'Des traces de pas mènent vers le sud. Quelqu\'un connaît le chemin des serres.', [
  { l: 'Suivre les traces', s: 'savoir', d: 8, w: ['Elles vous mènent sur un sentier balisé.', { prog: 1 }], f: ['Les traces s\'effacent sous la neige.', { hope: -1 }] },
  { l: 'Rester prudent', w: ['Mieux vaut ne pas courir derrière des fantômes.', {}] }
]);

// -- Horde
ev('grenier', ['horde'], '🧟', 'Bruits dans le grenier', 'Des grattements au-dessus de vos têtes. Quelque chose bouge.', [
  { l: 'Monter et attaquer', s: 'force', d: 8, w: ['Un infecté isolé : il ne se relèvera pas. Et il portait des provisions.', { food: 2, hope: 1 }], f: ['Il vous mord au bras avant de tomber !', { hp: -2 }] },
  { l: 'Condamner la trappe (−1 🔧)', c: { mat: 1 }, w: ['La trappe est clouée. Les grattements s\'estompent.', { def: 1 }] }
]);
ev('leurre', ['horde'], '🔔', 'Le leurre', 'Une centaine d\'infectés errent près de la route principale. Un bruit pourrait les attirer ailleurs.', [
  { l: 'Lancer un leurre bruyant', s: 'adresse', d: 9, w: ['La horde s\'éloigne : la route est libre.', { prog: 1, hope: 1 }], f: ['Le leurre rate sa cible : plusieurs infectés se tournent vers vous.', { hpAll: -1 }] },
  { l: 'Se faire discret', w: ['Vous patientez des heures dans le silence.', {}] }
]);
ev('super', ['horde'], '🛒', 'Supermarché infesté', 'Les rayons sont pleins, mais des silhouettes titubent entre les allées.', [
  { l: 'Se faufiler en silence', s: 'adresse', d: 9, w: ['Vous remplissez vos sacs à la barbe des infectés.', { food: 3, water: 2 }], f: ['Une étagère s\'écroule : le bruit attire les infectés. Fuite en urgence.', { hp: -1, hope: -1 }] },
  { l: 'Passer par les toits', s: 'force', d: 8, w: ['Par le conduit de ventilation, vous récupérez du matériel.', { mat: 2, meds: 1 }], f: ['Vous glissez et vous blessez en tombant.', { hp: -1 }] }
]);

// -- Marée
ev('radeau', ['maree'], '🛶', 'Le radeau', 'Des bidons et des planches dérivent. Assez pour fabriquer un radeau ?', [
  { l: 'Construire le radeau', s: 'savoir', d: 8, w: ['Un radeau solide. Vous avancerez bien plus vite sur l\'eau.', { prog: 1, mat: -1 }], f: ['Il se disloque à la première vague.', { mat: -1 }] },
  { l: 'Récupérer simplement les bidons', w: ['Du matériel flottant, c\'est déjà ça.', { mat: 2 }] }
]);
ev('crue', ['maree'], '🌊', 'La crue', 'L\'eau monte brusquement dans les étages inférieurs !', [
  { l: 'Dresser une digue (−1 🔧)', c: { mat: 1 }, s: 'force', d: 8, w: ['La digue tient. Le niveau se stabilise.', { def: 1 }], f: ['La digue cède : une partie des vivres est emportée.', { food: -2 }] },
  { l: 'Évacuer les vivres vers les étages', s: 'adresse', d: 7, w: ['Vous sauvez tout in extremis.', { hope: 1 }], f: ['Une partie des vivres est perdue.', { food: -1 }] }
]);
ev('poissons', ['maree'], '🐟', 'Un banc de poissons', 'Des milliers de poissons, jetés par les crues, frétillent dans les rues.', [
  { l: 'En ramasser le plus possible', s: 'adresse', d: 6, w: ['De quoi manger plusieurs jours !', { food: 4 }], f: ['Glissants, ils vous échappent, mais vous en gardez quelques-uns.', { food: 1 }] },
  { l: 'Se contenter de quelques-uns', w: ['Pas de risque, pas de gaspillage.', { food: 2 }] }
]);

// -- Silence
ev('panneau', ['silence'], '🔆', 'Le panneau solaire', 'Un vieux panneau solaire fonctionne encore sur un toit.', [
  { l: 'Le démonter et le raccorder', s: 'savoir', d: 8, w: ['La lumière revient quelques heures par jour. Ça remonte le moral !', { hope: 2, mat: 1 }], f: ['Un court-circuit. Vous perdez des composants.', { mat: -1 }] },
  { l: 'Le laisser en place', w: ['Ce n\'est pas votre priorité.', {}] }
]);
ev('barrage', ['silence'], '🚧', 'Barrage de pillards', 'Un barrage de voitures et des hommes armés. « Péage ! »', [
  { l: 'Négocier', s: 'coeur', d: 9, w: ['Ils vous laissent passer contre quelques babioles.', { prog: 1, hope: 1 }], f: ['Ils exigent 2 🥫, et vous bousculent.', { food: -2, hp: -1 }] },
  { l: 'Payer le péage (−2 🥫)', c: { food: 2 }, w: ['Ils vous laissent passer sans histoire.', { prog: 1 }] },
  { l: 'Faire demi-tour', w: ['Vous rebroussez chemin, sans gloire.', {}] }
]);
ev('bunker', ['silence'], '🚪', 'Le bunker du quartier', 'Une porte blindée à moitié ouverte. Un mot sur le mur : « Réservé aux résidents ».', [
  { l: 'Crocheter la serrure', s: 'savoir', d: 9, w: ['Un abri intact ! Vous y trouvez de quoi tenir.', { food: 2, water: 2, meds: 2, mat: 2 }], f: ['Une alarme mécanique se déclenche. Il faut fuir.', { hope: -1 }] },
  { l: 'Passer sans y toucher', w: ['Pas question de piller les morts.', { hope: 1 }] }
]);

/* ---------- Scènes personnelles (mode Destins séparés) ---------- */
const SCENES = [];
const sc = (id, i, n, text, choices) => SCENES.push({ id, i, n, text, choices });

sc('s1', '🏠', 'La maison vide', 'Seul dans une maison abandonnée, tu fouilles les placards.', [
  { l: 'Fouiller de fond en comble', s: 'adresse', d: 8, w: () => loot(), f: ['Rien, juste de la poussière et des souvenirs.', {}] },
  { l: 'Te reposer dans un coin', w: ['Tu fermes les yeux un instant. Ça fait du bien.', { hp: 1 }] }
]);
sc('s2', '🏞️', 'La rivière', 'Une rivière traverse la vallée. L\'eau a l\'air presque claire.', [
  { l: 'Remplir des bidons', s: 'savoir', d: 7, w: ['Tu filtres l\'eau avec soin.', { water: 3 }], f: ['L\'eau est trop sale. Tu rentres bredouille.', {}] },
  { l: 'Pêcher', s: 'adresse', d: 8, w: ['Deux poissons au bout de la ligne !', { food: 2 }], f: ['Pas une touche.', {}] }
]);
sc('s3', '🥾', 'Une piste', 'Un sentier à demi effacé part vers l\'objectif.', [
  { l: 'Le suivre en éclaireur', s: 'adresse', d: 9, w: ['Tu repères une route plus sûre : le groupe avance.', { prog: 1 }], f: ['Tu tombes dans un fossé.', { hp: -1 }] },
  { l: 'Retourner au camp', w: ['Mieux vaut ne pas prendre de risque seul.', {}] }
]);
sc('s4', '🏭', 'L\'atelier', 'Un vieil atelier a échappé aux pillages.', [
  { l: 'Récupérer des matériaux', s: 'force', d: 7, w: ['Des planches, des clous, du fil de fer.', { mat: 3 }], f: ['Tout est rouillé ou pourri.', { mat: 1 }] },
  { l: 'Consolider le camp (−1 🔧)', c: { mat: 1 }, s: 'force', d: 8, w: ['Les barricades sont plus solides.', { def: 1 }], f: ['Le travail est bâclé : le matériel est perdu.', {}] }
]);
sc('s5', '🎧', 'Un souvenir d\'avant', 'Tu retrouves un vieux baladeur au fond d\'un sac.', [
  { l: 'Le faire écouter aux autres', s: 'coeur', d: 6, w: ['La musique réchauffe les cœurs.', { hope: 2 }], f: ['Les piles sont mortes. Ça rappelle trop de souvenirs.', { hope: -1 }] },
  { l: 'Le garder pour toi', w: ['Un moment rien qu\'à toi. Tu respires.', { hp: 1 }] }
]);
sc('s6', '💊', 'La pharmacie', 'La devanture a explosé. L\'arrière-boutique est peut-être intacte.', [
  { l: 'Fouiller les arrière-salles', s: 'savoir', d: 8, w: ['Quelques boîtes de médicaments intactes.', { meds: 2 }], f: ['Les étagères sont vides : quelqu\'un est passé avant toi.', {}] },
  { l: 'Passer ton chemin', w: ['Ça sent le piège.', {}] }
]);
sc('s7', '🧍', 'Un inconnu au loin', 'Une silhouette t\'observe, de l\'autre côté de la route.', [
  { l: 'Lui parler', s: 'coeur', d: 8, w: ['Il te donne des informations utiles.', { prog: 1, hope: 1 }], f: ['Il te menace avec un couteau et te vole des vivres.', { food: -1, hp: -1 }] },
  { l: 'Te cacher', w: ['Tu le regardes s\'éloigner.', {}] }
]);
sc('s8', '🌾', 'Le champ', 'Un champ envahi de ronces. Au bout, peut-être un potager.', [
  { l: 'Traverser prudemment', s: 'adresse', d: 8, w: ['Au bout, un potager abandonné.', { food: 3 }], f: ['Les ronces te lacèrent.', { hp: -1 }] },
  { l: 'Contourner', w: ['Le détour te prend la journée.', {}] }
]);
sc('s9', '🦌', 'La chasse', 'Des traces fraîches dans la boue : du gibier.', [
  { l: 'Poser des pièges', s: 'adresse', d: 7, w: ['Deux lapins pris au piège.', { food: 2 }], f: ['Les pièges sont vides.', {}] },
  { l: 'Chasser activement', s: 'force', d: 9, w: ['Un cerf ! Il y a de quoi tenir plusieurs jours.', { food: 4 }], f: ['Il te charge et te blesse.', { hp: -2 }] }
]);
sc('s10', '🗼', 'La tour de guet', 'Une vieille tour de guet domine le camp.', [
  { l: 'Monter la garde', s: 'adresse', d: 7, w: ['Tu repères des intrus avant qu\'ils n\'approchent : le camp est mieux préparé.', { def: 1 }], f: ['Tu t\'endors à ton poste.', { hope: -1 }] },
  { l: 'Te reposer', w: ['Tu reprends des forces.', { hp: 1 }] }
]);
sc('s11', '🩸', 'Une blessure qui lance', 'Une vieille blessure te fait souffrir. Tu devrais la soigner.', [
  { l: 'Te soigner (−1 💊)', c: { meds: 1 }, w: ['Les soins font effet.', { hp: 2 }] },
  { l: 'Serrer les dents', w: ['Ça passera.', {}] }
]);
sc('s12', '📜', 'Le message griffonné', 'Un message gravé sur un mur : une carte vers un abri.', [
  { l: 'Décoder la carte', s: 'savoir', d: 9, w: ['Tu parviens à décoder la carte : le groupe avance.', { prog: 1, hope: 1 }], f: ['Fausse piste. Tu rentres bredouille.', {}] },
  { l: 'Garder le message', w: ['Tu le plies au fond de ta poche.', {}] }
]);

/* ---------- Destins personnels (3 étapes + récompense) ---------- */
const DESTINIES = {
  medecin: { n: 'Le remède', i: '🧪', a: 'savoir', b: 'adresse',
    steps: ['Dans les notes d\'un laboratoire, tu trouves la formule d\'un traitement contre la toux noire. Il manque des composants.',
            'Une pharmacie pillée cache peut-être le principe actif. Le sol est jonché de verre brisé.',
            'Tu as tout. Il reste à préparer le remède dans le calme et à le tester sur toi-même.'],
    rt: 'Le remède est prêt ! Tout le camp en profite.', rf: { hpAll: 2, meds: 3, hope: 2 } },
  mecano: { n: 'Le moteur', i: '🚙', a: 'adresse', b: 'savoir',
    steps: ['Une camionnette repose dans un garage effondré. Moteur noyé, mais récupérable.',
            'Il manque une pièce : l\'alternateur. Tu en repères un dans une carcasse de bus.',
            'Premier démarrage. Si ça tourne, le groupe peut avancer vite.'],
    rt: 'Le moteur rugit : la camionnette est prête !', rf: { prog: 2, def: 1, mat: 2 } },
  chasseur: { n: 'La piste sûre', i: '🧭', a: 'force', b: 'adresse',
    steps: ['Tu reconnais des traces de passage régulier : un sentier qui évite les zones dangereuses.',
            'Le sentier traverse un ravin. Il faut installer un passage.',
            'Tu balises la route pour que tout le groupe puisse suivre.'],
    rt: 'La route est balisée, et le gibier abonde le long du chemin.', rf: { prog: 2, food: 4 } },
  eclaireur: { n: 'La voix à la radio', i: '📡', a: 'adresse', b: 'coeur',
    steps: ['Entre deux grésillements, une voix répète ton nom de famille. Elle semble venir du nord.',
            'Tu grimpes sur un toit pour capter un meilleur signal. Le vent est violent.',
            'Rendez-vous fixé : tu retrouves enfin ta sœur, vivante, avec des provisions.'],
    rt: 'Des retrouvailles bouleversantes. Elle a apporté des vivres.', rf: { hope: 3, prog: 1, food: 3, water: 2 } },
  cuisinier: { n: 'Le potager', i: '🌱', a: 'savoir', b: 'coeur',
    steps: ['Dans une serre fissurée, quelques graines ont survécu. Il faut les protéger.',
            'Il faut de l\'eau propre et de la terre saine pour les semis.',
            'Les premières pousses sont là. Tu prépares une vraie récolte pour tous.'],
    rt: 'La récolte est abondante : un vrai repas pour tous !', rf: { food: 6, hope: 2 } },
  leader: { n: 'Le serment', i: '🤝', a: 'coeur', b: 'force',
    steps: ['Un autre groupe de survivants campe à proximité. Méfiants, armés. Il faudrait leur parler.',
            'Ils exigent une preuve de bonne foi avant de partager quoi que ce soit.',
            'Le pacte est sur le point d\'être scellé. Un faux pas et tout s\'effondre.'],
    rt: 'Le pacte est scellé : les deux groupes s\'entraident.', rf: { hope: 3, prog: 1, food: 2, water: 2, mat: 2 } }
};
