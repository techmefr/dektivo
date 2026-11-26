# Validation — public et ambiance

## Exécution

Node 22+ et pnpm. Depuis la racine :

```sh
pnpm install
pnpm verify
python3 -m http.server 4178 --directory .output/public
```

Dans un autre terminal, avec Playwright installé sur la machine :

```sh
node scripts/check-stadium.mjs
node scripts/check-stadium-performance.mjs
```

Sans installation de Playwright dans le projet, une installation temporaire est possible :

```sh
npm install --prefix /tmp/dektivo-browser-tools playwright
export PLAYWRIGHT_MODULE=/tmp/dektivo-browser-tools/node_modules/playwright/index.mjs
/tmp/dektivo-browser-tools/node_modules/.bin/playwright install chromium
node scripts/check-stadium.mjs
node scripts/check-stadium-performance.mjs
```

`STADIUM_URL` change le serveur (défaut http://127.0.0.1:4178). `CHROMIUM_PATH` permet de sélectionner un Chromium déjà installé. Les captures et mesures sont écrites sous `/tmp/dektivo-*`.

## Résultats du 2026-11-26

- `pnpm verify` : typage validé, 64 tests validés sur 10 fichiers et génération statique réussie.
- Géométrie : enveloppes disjointes et incluses dans les tribunes pour tous les spectateurs ; phases différentes et mode statique testés.
- Chromium local sans interface : une couche, images animées différentes, réduction des animations immobile, préférence explicite de mouvement prioritaire sur celle du système.
- Audio réel : contexte absent avant activation ; signal mesuré non nul après activation (RMS environ 0,027 au volume 35 %), volume clavier 0/100, clameur, silence en pause, dix cycles pause/reprise, visibilité simulée et nettoyage à la navigation.
- But décisif : la clameur reste possible pendant la dernière animation même lorsque l’état de la partie est déjà terminé.
- Replis : échec AudioContext non bloquant ; absence de contexte de dessin remplacée par une foule statique unique.
- Captures : ordinateur 1280×800 et paysage 844×390. Le terrain entier est contenu dans la hauteur disponible.
- Performance : quatre séquences de 60 secondes, statique et animée aux deux tailles. P95 environ 16,7 ms dans chaque cas ; variation inférieure à 0,01 %, sous le seuil de 10 % dans cet environnement.

Preuves : [mesures](validation/performance.json), [audio](validation/browser-results.json), [ordinateur](validation/dektivo-stadium-desktop.png), [paysage](validation/dektivo-stadium-phone.png).

## Limites des vérifications

Chromium sur WSL, Node 22.23.3 et bureau sans interface ; les dimensions paysage sont une simulation de taille et non un téléphone physique. La visibilité est simulée par le scénario navigateur. La mesure vérifie la cadence d’affichage de la scène, pas la qualité subjective du son ni tous les matériels. Safari/iOS et Android réels restent à vérifier avant une diffusion large.

Parcours manuel conseillé : activer le son, régler le volume, jouer jusqu’au dernier but, passer l’appareil en arrière-plan, reprendre, couper le son et activer la réduction des animations. Vérifier l’absence de foule doublée et de sons résiduels.
