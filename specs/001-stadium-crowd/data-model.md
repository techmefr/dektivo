# Data model

- Spectateur : x/y fixes, rayon 0,55–0,70 ; déplacement maximal 0,18 par axe ; agrandissement maximal 1,10 ; phase et durée individuelles déterministes. Enveloppe maximale : rayon × 1,10 + hypot(0,18; 0,18).
- Tribune : vue x=-16, y=-14, largeur=122, hauteur=98 ; exclusion du rectangle intérieur x=-10..100 et y=-8..78 ; marge extérieure pour coins arrondis.
- Préférences : audio activé (défaut faux), volume (0..100, défaut 35), réduction des animations existante. Stockage invalide : défauts sûrs.
- Audio : non initialisé → activé → suspendu → activé ; tout état → détruit. Échec → message et nouvelle tentative explicite. Un numéro de requête invalide les reprises obsolètes.
- Clameur : déclenchée une fois par transition vers une nouvelle célébration ; suspendre ou couper remet son gain à zéro.
