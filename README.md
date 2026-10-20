# Francis Gérardin · maquette « Carnet de route »

Site statique (HTML, CSS, JavaScript), sans étape de construction. Prêt pour Vercel (`vercel.json`, adresses propres).

## Pages

- `index.html` accueil
- `animateur.html` animation d'événements, agenda, demande de date
- `formateur.html` ateliers d'improvisation, caucus, demande de devis
- `coach.html` coaching personnel, calendrier indicatif, prise de rendez-vous
- `parcours.html` frise et CV
- `contact.html` coordonnées et formulaire
- `mentions-legales.html` modèle à compléter
- `404.html` page introuvable (servie automatiquement par Vercel)

## Modifier les contenus

- Agenda et parcours : `assets/js/data.js` (une ligne par événement, date au format AAAA-MM-JJ ; le site trie seul entre « à venir » et « passées »).
- Les éléments surlignés « À compléter » ou « À confirmer » attendent une information de Francis Gérardin.
- Formulaires, réservation et devis sont simulés : rien n'est envoyé.

## Images

- Photos réelles : `assets/img/*.webp` (plusieurs tailles par photo).
- Images d'ambiance Grok : `assets/img/grok/`. Tant qu'une image manque, un croquis à l'encre dessiné en code la remplace.

## Mouvement

GSAP (ScrollTrigger, SplitText, DrawSVG, ScrambleText), Lenis, OGL pour la trame offset WebGL. Tout est hébergé dans `assets/vendor`.
Le bouton « Mode calme » et le réglage système « réduire les animations » affichent une version complète sans animation.

## Avant la mise en ligne définitive

- Retirer la ligne `<meta name="robots" content="noindex, nofollow">` de chaque page : elle empêche Google d'indexer la maquette.
- Relier les formulaires à un service d'envoi réel (par exemple Formspree ou une fonction Vercel).
