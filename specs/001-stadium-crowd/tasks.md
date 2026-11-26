# Tasks: Public vivant et ambiance de stade

## Setup
- [x] T001 Rédiger plan et décisions dans specs/001-stadium-crowd/plan.md et research.md.
- [x] T002 Définir données et contrat dans specs/001-stadium-crowd/data-model.md et contracts/ui.md.

## US1 — foule
- [x] T003 [US1] Générer des enveloppes disjointes dans app/utils/stadium-crowd.ts.
- [x] T004 [US1] Remplacer le motif par app/components/StadiumCrowd.vue dans app/components/PitchSvg.vue.

## US3 — mouvement réduit
- [x] T005 [US3] Arrêter le dessin animé selon les préférences, la pause et la visibilité dans app/components/StadiumCrowd.vue.

## US2 — audio
- [x] T006 [US2] Ajouter préférences robustes dans app/stores/preferences.ts.
- [x] T007 [US2] Implémenter le cycle sonore et les clameurs dans app/utils/stadium-audio.ts.
- [x] T008 [US2] Ajouter app/components/StadiumAudio.vue et ses traductions dans i18n/locales.
- [x] T009 [US2] Intégrer les contrôles et les états publics dans app/pages/match.vue.

## Validation
- [x] T010 Vérifier géométrie et cycle audio dans app/utils/*.test.ts.
- [x] T011 Exécuter les vérifications et consigner les résultats dans specs/001-stadium-crowd/quickstart.md.
- [x] T012 Vérifier la convergence dans specs/001-stadium-crowd/convergence.md et pousser la branche.

## Dependencies and strategy
T001→T002→T003→T004→T005 ; T006→T007→T008→T009 ; T010→T011→T012.
US1 et US2 sont indépendants ; US3 utilise le rendu US1.
Parallélisation possible : géométrie US1 et moteur audio US2 ; rendu et traductions ne partagent pas de fichier.
Livrer d’abord foule + réduction, puis audio ; sprites et effets collectifs restent hors lot.
