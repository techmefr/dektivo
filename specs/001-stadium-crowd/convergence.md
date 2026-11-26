# Convergence — 2026-11-26

Résultat : travail logiciel du lot courant réalisé. Les sprites, ola, papiers et fumigènes restent exclus conformément à la spécification.

| Exigences | Éléments vérifiés |
| --- | --- |
| FR-001..005 | Motif fixe supprimé ; un canevas ; géométrie déterministe, enveloppes maximales sans collision et coins arrondis respectés ; tests unitaires et captures. |
| FR-006 | Canevas statique selon les préférences ; test navigateur du changement et de la priorité explicite. |
| FR-007..008 | Activation explicite, commande et curseur natifs accessibles au clavier, traductions FR/EN ; volumes 0 et 100 testés. |
| FR-009..010 | Réaction uniquement à la célébration publique ; dernière animation incluse ; suspension annule les clameurs, reprise sans doublon, nettoyage après navigation. |
| FR-011..012 | Préférences validées et persistance tolérant les erreurs ; nouvelle activation par visite ; erreur audio non bloquante ; repli graphique statique. |
| FR-013 | Moteur et IA inchangés ; aucune action privée utilisée pour le décor ; tests existants validés. |

SC-001..004 et SC-006 : preuve géométrique, contrôles navigateur et tests de cycle de vie. SC-005 : seuil respecté sur Chromium local aux deux dimensions ; validation matérielle sur téléphone réel non effectuée. Aucune conclusion de performance sur appareil physique n’est tirée des mesures simulées.

Relecture des cas limites : géométrie bornée, perte de stockage, indisponibilité audio et dessin, pause, visibilité, volume nul et but décisif couverts. Aucun travail logiciel manquant identifié dans le lot courant. Voir quickstart.md pour les résultats et les limites. Pas de hooks enregistrés dans l’espace SpecKit local ; constitution non renseignée.
