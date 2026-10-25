/* Données éditables du site. Un seul fichier pour l'agenda et le parcours.
   Pour ajouter une animation : copier une ligne d'EVENEMENTS et changer les valeurs (date au format AAAA-MM-JJ).
   Le site classe tout seul les dates entre « à venir » et « passées ». */

export const EVENEMENTS = [
  {
    date: '2018-03-08',
    titre: 'Café littéraire, Journée internationale des droits des femmes',
    lieu: 'Tour de la Liberté, Saint-Dié-des-Vosges',
    format: 'Café littéraire',
    note: 'Lieu repris du site actuel ; date et intitulé lus sur l’affiche visible sur la photo, à confirmer.',
  },
]

/* Parcours repris des CV du site actuel (mis à jour pour la dernière fois en novembre 2022).
   fin: null = activité toujours en cours en 2022, à confirmer pour aujourd'hui. */
export const PARCOURS = [
  { piste: 'journalisme', debut: 1987.75, fin: 1988.45, titre: 'Cours « Journalisme radio et animation »', lieu: 'European Broadcasting School, Rueil-Malmaison' },
  { piste: 'journalisme', debut: 1990.6, fin: 2000.3, titre: 'Rédacteur localier', lieu: 'La Liberté de l’Est, Saint-Dié' },
  { piste: 'journalisme', debut: 2001.25, fin: 2001.4, titre: 'Stage « Initiation au journalisme télévisé »', lieu: 'Centre de Formation des Journalistes, Paris' },
  { piste: 'journalisme', debut: 2002.5, fin: 2015.4, titre: 'Reporter rédacteur, présentateur des locales', lieu: 'France 3 Lorraine, Nancy et Metz' },
  { piste: 'journalisme', debut: 2006.85, fin: 2006.95, titre: 'Stage « Présentation de flashs et de JT »', lieu: 'Centre de Formation des Journalistes, Paris' },
  { piste: 'journalisme', debut: 2016.6, fin: null, titre: 'Animateur modérateur d’événements', lieu: 'Micro-entreprise, Strasbourg' },
  { piste: 'impro', debut: 2003.7, fin: 2016.5, titre: 'Improvisateur puis formateur', lieu: 'ImproDisiaque, Nancy' },
  { piste: 'impro', debut: 2015.7, fin: 2019.5, titre: 'Coach d’une équipe « Joute libre »', lieu: 'LOLITA, Strasbourg' },
  { piste: 'impro', debut: 2018.7, fin: null, titre: 'Membre de la troupe des Anodins', lieu: 'Strasbourg' },
  { piste: 'impro', debut: 2019.7, fin: null, titre: 'Coach des UP’rovisateurs', lieu: 'Université Populaire Européenne, Strasbourg' },
  { piste: 'formation', debut: 2016.8, fin: 2019.9, titre: 'Ateliers scientifiques et de psycho-sociologie', lieu: 'Les Petits Débrouillards, Strasbourg' },
  { piste: 'formation', debut: 2018.35, fin: 2018.45, titre: 'Certificat « Exercer la mission de formateur en entreprise »', lieu: 'CCI Meurthe-et-Moselle, Nancy' },
  { piste: 'formation', debut: 2019.3, fin: 2020.55, titre: 'Formateur en entreprise, langue française', lieu: 'Méthodia Formation, Strasbourg' },
  { piste: 'formation', debut: 2019.35, fin: 2019.45, titre: 'Formation « Animation de débats »', lieu: 'Les Petits Débrouillards, Nancy' },
  { piste: 'formation', debut: 2021.2, fin: 2021.5, titre: 'Formateur bénévole en Français Langue Étrangère', lieu: 'Contact et promotion, Strasbourg' },
  { piste: 'formation', debut: 2021.7, fin: 2021.95, titre: 'Formateur en éducation civique', lieu: 'Office Français de l’Immigration, Strasbourg' },
  { piste: 'formation', debut: 2021.7, fin: null, titre: 'Professeur d’éducomédias', lieu: 'Université Populaire Européenne, Strasbourg' },
  { piste: 'formation', debut: 2021.8, fin: 2022.3, titre: 'Diplôme d’école « Coach professionnel »', lieu: 'Institut de Coaching d’Alsace, Osthouse' },
]

export const PISTES = [
  { id: 'journalisme', nom: 'Journalisme et animation' },
  { id: 'impro', nom: 'Théâtre d’improvisation' },
  { id: 'formation', nom: 'Formation et coaching' },
]

/* Jeu de démonstration du caucus : situations d'exemple, sans lien avec un atelier réel. */
export const CAUCUS = {
  themes: [
    'Le dernier jour avant les vacances', 'Deux voisins, une seule clé', 'La panne d’ascenseur',
    'Le premier jour dans un nouveau métier', 'Un trésor au grenier', 'La réunion qui tourne à l’opéra',
    'Le train est annulé', 'Une lettre arrivée trente ans trop tard', 'La recette de grand-mère a disparu',
    'Le marché de Noël sous la neige', 'Un discours de mariage improvisé', 'La visite guidée qui déraille',
  ],
  natures: ['Mixte', 'Comparée'],
  categories: ['Libre', 'Chantée', 'Sans paroles', 'Rimée', 'En alexandrins', 'À la manière d’un JT'],
  joueurs: ['2 joueurs', '3 joueurs', 'Illimité'],
  durees: ['2 min', '3 min', '4 min'],
}
