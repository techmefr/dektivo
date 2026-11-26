# Implementation Plan: Public vivant et ambiance de stade

**Branch**: spec/stadium-crowd | **Date**: 2026-11-26 | **Spec**: [spec.md](spec.md)

## Summary
Réaliser US1 et US3 avec un canevas unique dans le décor SVG existant. Réaliser US2 avec un moteur Web Audio générant un murmure filtré et une clameur, sans ressource distante. Le joueur a demandé la réalisation complète : plan, tâches et implémentation suivent dans cette livraison.

## Technical Context
TypeScript, Nuxt 4, Vue 3 et Pinia existants. Aucun paquet de production ajouté.
Stockage : préférences locales tolérant les erreurs.
Tests : Vitest pour géométrie, préférences et cycle audio ; vérification Nuxt ; contrôle navigateur si disponible.
Plateforme : navigateurs ordinateur et téléphone paysage.
Performance : dessin limité à 20 images/s, résolution adaptée à la taille affichée et plafonnée ; boucle arrêtée pour animation réduite, pause et onglet masqué.
Contraintes : un seul public, enveloppes disjointes, aucune donnée secrète consommée.
Portée : un dépôt, aucun backend ou changement Supabase.

## Constitution Check
La constitution installée est un modèle non renseigné ; elle ne définit aucune règle produit adoptée. Les contraintes vérifiables de spec.md gouvernent ce lot. Pas d’extension ni de hook multirepo enregistré dans cet espace. Code et documents restent dans le dépôt demandé ; aucun dépôt supplémentaire publié.

## Project Structure
- app/utils/stadium-crowd.ts : géométrie et mouvement déterministes.
- app/components/StadiumCrowd.vue : rendu et nettoyage.
- app/utils/stadium-audio.ts : graphe sonore et cycle de vie.
- app/components/StadiumAudio.vue : activation, volume et réaction aux buts publics.
- app/stores/preferences.ts : persistance.
- app/components/PitchSvg.vue, app/pages/match.vue : intégration.
- app/**/*.test.ts : vérifications ciblées.
- specs/001-stadium-crowd/ : plan, recherche, modèle, contrat, tâches et validation.

## Design
Les rayons maximaux et déplacements sont définis dans la même unité que le terrain et restent inférieurs à la demi-distance entre centres. Les points sont générés seulement dans les bandes extérieures des tribunes. Le canevas remplace entièrement le motif fixe.
Le moteur sonore est créé après clic explicite. Un seul graphe bouclé par composant ; gain général pour le volume, gain séparé pour la clameur. Suspendre annule la clameur ; détruire arrête et ferme le graphe. Les reprises asynchrones portent un numéro de requête pour empêcher un retour sonore tardif.
L’interface écoute uniquement celebratingTeam, un état de présentation public, et non les actions privées.
