# Feature Specification: Public vivant et ambiance de stade

**Feature Branch**: `spec/stadium-crowd`

**Created**: 2026-10-29

**Status**: Implémentation autorisée le 2026-11-26 — voir convergence.md pour les validations

**Input**: Animer le public existant par de légères variations individuelles de taille et de position, sans chevauchement ni second public superposé. Ajouter des bruits de stade. Prévoir pour plus tard un public composé d’images animées avec variantes par tokens, ola, papiers et fumigènes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Voir une foule vivante et lisible (Priority: P1)

Pendant le placement et le match, le joueur voit les points des tribunes bouger à des rythmes différents. Le terrain, le ballon et les commandes restent lisibles.

**Why this priority**: Donner immédiatement de la vie au stade avec le public existant, sans attendre de nouvelles illustrations.

**Independent Test**: Observer les tribunes pendant 30 secondes en paysage sur téléphone et ordinateur, puis redimensionner la fenêtre et vérifier les limites de chaque spectateur.

**Acceptance Scenarios**:

1. **Given** un terrain affiché, **When** les animations sont autorisées, **Then** chaque point de public varie légèrement de position et de taille autour d’un emplacement fixe ; les voisins ne bougent pas tous en phase.
2. **Given** une animation à son amplitude et sa taille maximales, **When** deux spectateurs voisins sont comparés, **Then** leurs surfaces visibles ne se chevauchent pas.
3. **Given** le public animé, **When** le joueur observe les tribunes, **Then** un seul public est visible ; aucun motif de spectateurs fixe ne reste derrière les points animés.
4. **Given** un changement de taille ou d’orientation de l’écran, **When** le terrain se réorganise, **Then** les spectateurs restent dans les tribunes, sans couvrir le terrain ni les commandes.

### User Story 2 - Choisir l’ambiance sonore (Priority: P2)

Le joueur peut activer une ambiance de stade et régler son volume. Un but déclenche une clameur uniquement si le son est activé.

**Why this priority**: Renforcer la sensation de match tout en laissant le joueur maîtriser le son.

**Independent Test**: Lancer une partie silencieuse, activer le son, régler le volume, provoquer un but, couper le son puis quitter le match.

**Acceptance Scenarios**:

1. **Given** une première visite, **When** le match s’ouvre, **Then** aucun son n’est émis avant une action explicite d’activation.
2. **Given** le son activé, **When** le joueur règle le volume ou coupe le son, **Then** le changement s’applique en moins d’une seconde ; le volume nul est silencieux.
3. **Given** une ambiance active, **When** une célébration de but commence, **Then** une seule clameur accompagne ce but puis l’ambiance retrouve son niveau normal.
4. **Given** une partie en cours, **When** le joueur met en pause, masque l’onglet ou quitte le match, **Then** l’ambiance et les clameurs s’arrêtent ; le retour ne crée pas de sons en double et ne rejoue pas les anciens buts.
5. **Given** un appareil refusant la lecture du son, **When** l’activation échoue, **Then** une indication compréhensible est affichée et le match reste entièrement jouable.

### User Story 3 - Réduire les mouvements (Priority: P1)

Le joueur sensible aux animations peut garder des tribunes statiques sans perdre d’information sur la partie.

**Why this priority**: Le décor ne doit pas imposer un mouvement permanent ni gêner le jeu.

**Independent Test**: Activer puis désactiver la réduction des animations et vérifier les tribunes, y compris pendant une célébration.

**Acceptance Scenarios**:

1. **Given** la réduction des animations activée dans le jeu, **When** le terrain apparaît ou qu’un but est marqué, **Then** les spectateurs restent immobiles et leur taille ne varie pas.
2. **Given** aucune préférence explicite dans le jeu, **When** l’appareil demande de réduire les mouvements, **Then** les tribunes sont statiques.
3. **Given** des tribunes statiques et le son coupé, **When** le match se déroule, **Then** le score, les tours et les résultats restent compréhensibles.

### Edge Cases

- Très petites tribunes : réduire l’amplitude, la taille ou la densité avant de permettre un chevauchement.
- Spectateurs en bordure : leur enveloppe complète, taille maximale comprise, reste dans les tribunes.
- Pause, retour d’onglet, navigation répétée et nouvelle partie : aucune accumulation de sons ou d’animations ; ne pas rattraper les réactions manquées.
- Désactivation du son pendant une clameur : arrêt immédiat, sans attendre la fin de la célébration.
- Stockage des préférences indisponible : les commandes fonctionnent pendant la session ; aucune erreur ne bloque le match.
- Animations ou audio indisponibles : conserver un public statique et une partie silencieuse jouable.
- Événements cachés : le décor et le son ne donnent aucun indice sur les positions ou actions secrètes de l’adversaire.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le stade DOIT afficher un seul public, sans doubler le public fixe par un second public animé.
- **FR-002**: Chaque spectateur DOIT avoir un emplacement stable et une zone de variation bornée de sa position et de sa taille.
- **FR-003**: Les enveloppes maximales de deux spectateurs voisins NE DOIVENT PAS se chevaucher, quelle que soit la phase de leur animation ou la taille d’affichage.
- **FR-004**: Les rythmes et décalages DOIVENT varier entre spectateurs ; tous les voisins ne doivent pas effectuer un mouvement identique simultanément.
- **FR-005**: Les variations DOIVENT rester dans les tribunes et ne jamais masquer le terrain, les pièces, le ballon ou les commandes.
- **FR-006**: La réduction des animations DOIT rendre le public entièrement statique. Sans choix explicite du joueur, la préférence de l’appareil est utilisée.
- **FR-007**: Le son DOIT être désactivé à la première visite, activable et désactivable explicitement, avec un volume réglable de 0 à 100 %.
- **FR-008**: Les commandes audio DOIVENT être accessibles au clavier, porter des libellés français et anglais et indiquer leur état sans dépendre uniquement d’une icône.
- **FR-009**: Une ambiance active DOIT accompagner le match et chaque nouvelle célébration de but DOIT provoquer au plus une clameur. Aucun ancien but ne doit être rejoué lors d’une reprise.
- **FR-010**: La pause, le masquage de l’onglet et la sortie du match DOIVENT interrompre les sons. La reprise ne DOIT PAS créer plusieurs ambiances simultanées.
- **FR-011**: Les choix de son et de volume DOIVENT être conservés entre visites lorsque le stockage est disponible. Une nouvelle visite ne DOIT PAS forcer une lecture sans interaction si l’appareil l’interdit.
- **FR-012**: Tout refus ou échec audio DOIT laisser les actions du match disponibles et afficher une indication permettant de continuer sans son.
- **FR-013**: Le public et le son DOIVENT rester purement décoratifs : aucun changement des règles, des délais d’action ou de la visibilité des informations cachées.

### Key Entities

- **Spectateur** : emplacement de base, zone de mouvement, taille de base, taille maximale et rythme individuel.
- **Tribune** : surface autorisée pour les spectateurs et espacement garantissant l’absence de chevauchement.
- **Préférence sonore** : état activé ou coupé et volume choisi par le joueur.
- **Réaction publique** : événement déjà visible du match, notamment un but, pouvant déclencher une clameur unique.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Sur une observation de 30 secondes aux formats téléphone paysage et ordinateur, tous les spectateurs bougent lorsque les mouvements sont autorisés ; aucun chevauchement, doublon ou débordement n’est visible.
- **SC-002**: En réduction des animations, aucun spectateur ne change de position ou de taille pendant 30 secondes, y compris lors d’un but.
- **SC-003**: Activation, coupure et réglage du volume sont possibles au clavier et produisent un résultat audible ou silencieux en moins d’une seconde.
- **SC-004**: Après dix cycles de pause/reprise, masquage/retour et sortie/nouveau match, une seule ambiance est audible ; aucun ancien but ne déclenche de clameur.
- **SC-005**: Sur le même téléphone et ordinateur de référence, une séquence comparable de 60 secondes présente au plus 10 % de dégradation du temps d’affichage au 95e percentile par rapport au décor statique. Les appareils et mesures doivent être consignés lors de la validation.
- **SC-006**: Toutes les actions de jeu restent utilisables sans son et avec un public statique ; les événements secrets ne produisent aucune réaction perceptible du décor.

## Assumptions

- Le lot actuel conserve les points colorés existants. Les amplitudes et tailles précises seront fixées pendant la planification à partir de l’espace disponible.
- L’ambiance sonore concerne le placement et le match ; elle s’interrompt à la fin du match, après la dernière célébration éventuelle.
- Le réglage de réduction des animations du jeu reste prioritaire sur la préférence de l’appareil lorsqu’un choix explicite existe.
- Les sons seront fournis ou produits avec des droits adaptés au projet ; le choix des ressources relève de la planification.
- La validation porte sur le jeu de la branche `feat/playable-match-vs-ai`. La branche `main` ne contient actuellement que la documentation.
- Ce document spécifie le besoin ; le plan, les tâches et les résultats de réalisation sont suivis dans les documents voisins.

## Future Evolution — hors du lot actuel

Un lot ultérieur pourra remplacer les points par des personnages illustrés animés image par image, dans l’esprit des décors de jeux d’arcade. Des tokens décriront les variantes de vêtements, couleurs, accessoires et poses pour composer une foule variée. Ici, « token » désigne un paramètre de variation visuelle, pas une monnaie ni une obligation de génération par IA pendant le jeu.

Les réactions collectives envisagées sont l’ola progressive par rangée, les bras levés, les papiers ou confettis et les fumigènes décoratifs. Ce lot futur conservera un seul public et la lisibilité du terrain, respectera la réduction des animations et fera l’objet d’une spécification distincte. Aucun sprite, système de tokens, ola, papier ou fumigène n’est à réaliser dans le lot actuel.
