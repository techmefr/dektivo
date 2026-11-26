# UI contract

- Bouton Son du stade : libellé français/anglais, aria-pressed, état et nouvelle tentative.
- Volume : curseur natif 0..100, libellé et valeur accessibles ; zéro signifie silence.
- Commandes disponibles pendant le placement et le jeu ; messages audio non bloquants.
- Match en pause ou onglet masqué : silence, aucune ancienne réaction rejouée.
- Fin du match : silence après la dernière célébration ; navigation : ressources libérées.
- Réduction des mouvements : canevas statique ; choix explicite du jeu prioritaire.
