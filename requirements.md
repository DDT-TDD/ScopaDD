# Requirements Document: Scopa & Briscola — Premium Italian Card Game Suite

## Introduction

A visually stunning, culturally authentic, offline-first and networked browser-based digital card game featuring Italy's two most iconic and beloved traditional card games: **Scopa** and **Briscola**. 

This application provides an elevated, tactile tabletop experience designed to be **kid-friendly (ages 6–8+)** and **delightfully engaging for adults and seasoned card players**. It runs seamlessly across mobile phones, tablets, laptops, and desktop computers as an installable Progressive Web App (PWA).

### Vision & Architectural Modernization
The project resolves the structural flaws of previous monolithic implementations (such as the unmaintainable 1100+ line UI files, lack of Briscola, and absence of networked multiplayer in the reference codebase) by adopting a strictly decoupled, modular architecture:
1. **Game Engines (`core/engine/`)**: Pure functional, deterministic state machines (`ScopaEngine` and `BriscolaEngine`) that process immutable commands and produce events, with zero UI or network dependencies.
2. **Rules Layer (`core/rules/`)**: Complete authentic rules, combinatorics, and scoring engines for all historical variants of Scopa and Briscola, featuring mathematically verified Primiera tables, Briscola trick logic, and configurable presets.
3. **Multiplayer Layer (`network/`)**: A flexible transport layer supporting **Offline Solo Play** (vs. AI), **Local Pass-and-Play**, **Zero-Configuration Local Network (LAN)**, and **Internet Network Multiplayer** (low-latency WebRTC peer-to-peer and WebSocket rooms with child-safe room codes and QR invites).
4. **Child & Family Safety (`safety/`)**: Built from the ground up to be safe for children and families. Features zero personal data collection, zero account creation, zero third-party tracking, zero advertising, and eliminates unmoderated text chat in favor of rich, expressive, animated Italian card banter and emoji reactions.
5. **Presentation & Aesthetics (`presentation/`)**: A "simply beautiful" 3D tabletop rendered via Three.js with soft ambient lighting, physical card depth, realistic card bending, spring-based physics, and 4 handcrafted table atmospheres (Trattoria Rustica, Piazza al Tramonto, Salotto da Gioco, Notte Stellata), paired with authentic Italian regional card decks (Napoletane, Piacentine, Trevigiane, and a charming modern Illustrated Family Deck). An accessible, zero-dependency 2D DOM fallback ensures smooth 60fps performance on any device.

---

## Glossary

### Core Domain & Card Terms
- **App**: The complete browser application delivering Scopa, Briscola, AI opponents, and multiplayer services.
- **Card**: One of the 40 cards of the traditional Italian card deck across four suits (Denari, Coppe, Spade, Bastoni) and ten ranks (Asso through Re).
- **CardId**: An integer from `0` to `39` uniquely encoding suit and rank (`suit * 10 + rank - 1`), with Denari = 0, Coppe = 1, Spade = 2, Bastoni = 3, and ranks 1 (Asso) to 10 (Re).
- **Deck**: The complete 40-card Italian deck shared by both Scopa and Briscola engines.
- **Regional Decks**: Culturally authentic regional art styles:
  - *Napoletane*: Traditional Neapolitan Spanish-style deck with iconic coins, ornate cups, straight swords, and wooden batons.
  - *Piacentine*: Central/Northern Italian deck featuring distinctive crossed swords and detailed court figures.
  - *Trevigiane (Venete)*: Historic Venetian-style deck featuring long curved scimitars and ceremonial maces.
  - *Fiaba Moderna (Illustrated Family Deck)*: Vibrant, high-contrast, charmingly illustrated deck crafted specifically for young children, family play, and enhanced visual accessibility.
- **Command**: A serialized, sequence-numbered player action (e.g., `PlayCard`, `TakeTrick`, `MakeDeclaration`, `BidScore`) submitted to an engine.
- **MatchState**: The complete, immutable data state of an ongoing match at a given point in time.
- **PublicView**: A filtered, read-only projection of `MatchState` presented to a specific player seat, hiding opponent hand cards and undealt deck contents to maintain imperfect information boundaries.

### Scopa-Specific Terms
- **Scopa_Engine**: Pure functional state machine governing Scopa rules, turn transitions, captures, and hand resolution.
- **Exact-Match Priority**: Traditional Italian rule (*regola del piglio a carta singola*): if a played card equals the value of a single card on the table, it MUST capture that single card and cannot capture a multi-card sum.
- **Scopa**: Clearing all cards from the table with a capture during active play, awarding 1 point; by standard rule, clearing the table with the very last card of a hand never counts as a Scopa.
- **Carte**: Scoring category awarding 1 point to the side capturing 21 or more cards (out of 40).
- **Denari (Ori)**: Scoring category awarding 1 point to the side capturing 6 or more coin cards (out of 10).
- **Sette Bello**: Scoring category awarding 1 point to the side capturing the 7 of Denari (7 of Coins).
- **Primiera (Prime)**: Highest scoring combination of one card from each of the 4 suits, evaluated using authentic Italian point values: 7 = 21, 6 = 18, Asso = 16, 5 = 15, 4 = 14, 3 = 13, 2 = 12, Figures (Re, Cavallo, Fante) = 10. A 4-suit prime always beats any 3-suit prime.
- **Re Bello**: Optional rule awarding 1 extra point for capturing the King of Denari.
- **Napola (Piccola)**: Scoring bonus for capturing an unbroken sequence of Denari starting from Ace (A-2-3 scores 3 pts; each subsequent card adds 1 pt; full suit of 10 wins the game outright or scores 10 pts).
- **Cirulla**: Fast-paced Ligurian variant featuring sum-to-15 captures, the *Matta* (7 of Cups wild card), declarations for hands totaling 9 or less, and dealer bonuses for initial table sums of 15 or 30.

### Briscola-Specific Terms
- **Briscola_Engine**: Pure functional state machine governing Briscola rules, bidding, trick evaluations, and scoring.
- **Briscola_Trump**: The designated trump suit for the hand, determined by the face-up indicator card dealt after player hands.
- **Briscola Card**: The face-up trump card placed underneath the undealt draw pile (tallone).
- **Briscola Trick Hierarchy**: Point values: Asso (11 pts), Tre (10 pts), Re (4 pts), Cavallo (3 pts), Fante (2 pts), 7/6/5/4/2 (0 pts, ranked 7 > 6 > 5 > 4 > 2). Total deck points = 120; winning threshold = 61+ points (60–60 is a draw).
- **Trick Resolution Rule**: No obligation to follow suit or to play trump. The trick is won by the highest trump card; if no trump is played, the trick is won by the highest card of the suit led.
- **Briscola Chiamata**: Renowned 5-player social variant featuring point bidding, calling a specific card, a secret partner ("Socio"), and dramatic hidden alliances.

### Multiplayer, Safety & Presentation Terms
- **Pass_And_Play**: Local hot-seat multiplayer on a single device with private turn transition screens.
- **LAN_Multiplayer**: Local area network multiplayer allowing devices on the same Wi-Fi to discover each other and connect directly without external internet traffic.
- **Internet_Multiplayer**: Online multiplayer using WebRTC peer-to-peer data channels with lightweight WebSocket signaling.
- **Room_Code**: A friendly, child-safe 4-letter or animal/nature-themed code (e.g. `SOLE`, `LUNA`, `ROMA`, `LUPO`) used to join matches without accounts.
- **Safe_Chat**: Family-friendly communication system strictly prohibiting unmoderated free-text chat, providing instead animated Italian card phrases and cheerful emoji reactions.
- **Simple_Mode (Kids Mode)**: Accessibility and educational mode for players aged 6–8+ displaying automatic legal move highlights, capture arithmetic breakdowns, and card point values without suggesting optimal plays.
- **Table_Atmosphere**: Handcrafted 3D visual environments featuring custom table textures, lighting models, and background acoustics.

---

## Requirements

### Requirement 1: Shared Italian Deck and Regional Card Art

**User Story:** As a player, I want authentic regional Italian card decks and beautiful family-friendly illustrations, so that I can enjoy the rich cultural heritage and visual charm of Italian card games.

#### Acceptance Criteria

1. THE App SHALL represent all cards using a normalized integer `CardId` (0 to 39), where suit is `Math.floor(id / 10)` (0: Denari, 1: Coppe, 2: Spade, 3: Bastoni) and rank is `(id % 10) + 1` (1: Asso through 10: Re).
2. THE App SHALL expose a shared, pure `cards` module providing card queries, localized names, suit symbols, and metadata to both `Scopa_Engine` and `Briscola_Engine`.
3. THE App SHALL provide at least four selectable card-face art decks:
   - **Napoletane Classiche**: Authentic vector representations of traditional Spanish-suited Neapolitan cards.
   - **Piacentine Storiche**: Traditional Northern Italian Spanish-suited deck with distinctive crossed swords and detailed figures.
   - **Trevigiane (Venete)**: Historic Northern Italian deck featuring elongated curved scimitars and ceremonial batons.
   - **Fiaba Moderna (Illustrated Family Deck)**: A vibrant, whimsical, high-contrast illustrated deck designed specifically for children, families, and high visual accessibility.
4. THE App SHALL provide at least six selectable card-back designs: Classic Modiano Diamond, Italian Majolica Ceramic Tile, Vintage Woodblock, Rustic Tartan, Celestial Night, and Whimsical Starry Sky.
5. WHEN a player changes card art or card back in Settings, THE App SHALL update all rendered cards across active 3D and 2D views within 300 milliseconds without restarting or interrupting the active match.
6. THE App SHALL render card faces as crisp, scalable SVG or high-DPI vector assets without visual clipping, distortion, or blur across all viewport widths from 320 px to 3840 px (4K).
7. THE App SHALL provide `cardName(id)` returning English names (e.g., "Seven of Coins") and `cardNameIt(id)` returning Italian names (e.g., "Sette di Denari") for screen readers, tooltips, and log events.
8. IF a query function is invoked with an invalid `CardId` (< 0 or > 39), THEN THE App SHALL return an empty string or null and SHALL NOT throw an unhandled exception.
9. THE App SHALL persist selected card deck styles and card backs in `localStorage` across app sessions.

---

### Requirement 2: Scopa Game Engine & Authentic Rule Presets

**User Story:** As a Scopa player, I want the game engine to enforce authentic Italian rules, exact-match priorities, Primiera scoring, and popular regional presets accurately.

#### Acceptance Criteria

1. THE Scopa_Engine SHALL execute the complete Classic Scopa deal and play loop: deal 3 cards per player and 4 face-up cards to the table; players take turns playing 1 card to capture matching table cards; redeal 3 cards per player when all hands are empty until the 40-card deck is exhausted.
2. IF the initial 4 face-up table cards contain three or four Kings (Re), THEN THE Scopa_Engine SHALL automatically void the deal, reshuffle the deck, and redeal before the first turn.
3. WHEN a player plays a card that equals the value of a single card on the table, THE Scopa_Engine SHALL mandate that the single card be captured (Exact-Match Priority) and SHALL reject any command attempting to capture a multi-card sum when an exact single-card match is available.
4. WHEN no single card matches the played card, THE Scopa_Engine SHALL allow the player to capture two or more table cards whose face values sum exactly to the played card's value (A=1, 2–7=face, Fante=8, Cavallo=9, Re=10); IF multiple distinct combinations exist, THE Scopa_Engine SHALL allow the player to select which combination to capture.
5. IF a played card cannot make any legal single or sum capture, THEN THE Scopa_Engine SHALL place the played card face-up onto the table.
6. WHEN a player's capture leaves the table completely empty during active play, THE Scopa_Engine SHALL award a **Scopa** (+1 point) to that player/team, marked by a face-up sideways card; HOWEVER, clearing the table with the final card of the 40-card deck SHALL NOT score a Scopa.
7. WHEN the 40th card of a hand is played, THE Scopa_Engine SHALL award any remaining face-up table cards to the player or team who made the last successful capture of that hand.
8. WHEN scoring a completed hand, THE Scopa_Engine SHALL evaluate and award points for the five standard categories:
   - **Scope**: 1 point per Scopa achieved during play.
   - **Carte**: 1 point for capturing 21 or more cards (tie = 0 points).
   - **Denari**: 1 point for capturing 6 or more coin cards (tie = 0 points).
   - **Sette Bello**: 1 point for capturing the 7 of Denari.
   - **Primiera**: 1 point for the highest prime score using the authentic Italian scale:
     $$\text{Seven} = 21, \quad \text{Six} = 18, \quad \text{Ace} = 16, \quad \text{Five} = 15, \quad \text{Four} = 14, \quad \text{Three} = 13, \quad \text{Two} = 12, \quad \text{Figures (8, 9, 10)} = 10$$
     A player must hold at least one card in each of the four suits to have a valid 4-suit Primiera; a 4-suit Primiera SHALL always beat a 3-suit Primiera; tied prime totals SHALL award 0 points.
9. THE Scopa_Engine SHALL implement the following named presets via modular `RulesConfig` settings:
   - **Classic Scopa**: 2, 3, or 4 players (individual or 2v2 partnership), target 11 or 21 points.
   - **Scopone**: 4 players in two partnerships, 9 cards dealt to each player, 4 face-up on table, no redeals, target 11 or 21.
   - **Scopone Scientifico**: 4 players in two partnerships, 10 cards dealt to each player, 0 on table, no redeals, target 21.
   - **Scopa d'Assi / Asso Pigliatutto**: Playing an Ace when no Ace is on the table sweeps all table cards; configurable whether an Ace sweep scores a Scopa.
   - **Scopa di Quindici**: Captures require the played card plus captured table cards to sum to exactly 15.
   - **Napola / Piccola**: Capturing A, 2, 3 of Denari awards 3 bonus points, plus 1 point for each additional consecutive coin card captured (up to 10 points for all coins).
   - **Re Bello**: Capturing the King of Denari awards 1 bonus point.
   - **Cirulla**: Fast Ligurian variant implementing sum-to-15 captures, Ace sweeps, Matta (7 of Cups wild), declarations for hand sums $\le 9$ (3 points) or triples (10 points), and dealer table bonuses for initial deals summing to 15 (1 scopa) or 30 (2 scope).
10. THE Scopa_Engine SHALL be a pure, deterministic state machine: given the same `MatchSetup` (including numeric seed) and command log, `replay(setup, log)` SHALL produce an identical `MatchState`.

---

### Requirement 3: Briscola Game Engine & Authentic Rule Presets

**User Story:** As a Briscola player, I want an authentic Briscola engine supporting trick taking, trump dynamics, 2-player, 4-player team, and 5-player Briscola Chiamata formats.

#### Acceptance Criteria

1. THE Briscola_Engine SHALL implement standard 2-player dealing: 3 cards dealt to each player, the 7th card placed face-up on the table as the Briscola Trump card, and the remaining 33 cards placed face-down as the draw pile (tallone) overlapping the trump card.
2. THE Briscola_Engine SHALL enforce the authentic Briscola card hierarchy and point values:
   $$\text{Asso} = 11 \text{ pts}, \quad \text{Tre} = 10 \text{ pts}, \quad \text{Re} = 4 \text{ pts}, \quad \text{Cavallo} = 3 \text{ pts}, \quad \text{Fante} = 2 \text{ pts}, \quad 7, 6, 5, 4, 2 = 0 \text{ pts}$$
   Card ranking for tricks: $\text{Asso} > \text{Tre} > \text{Re} > \text{Cavallo} > \text{Fante} > 7 > 6 > 5 > 4 > 2$. Total capturable points in the deck SHALL equal exactly 120.
3. WHEN a player plays a card in Briscola, THE Briscola_Engine SHALL NOT impose any obligation to follow suit or play a trump card; any card in the player's hand SHALL be legally playable on any turn.
4. WHEN resolving a trick, THE Briscola_Engine SHALL award the trick to:
   - The highest trump card played, if one or more trump cards were played.
   - The highest card of the suit led by the first player, if no trump cards were played.
   - The first card played, if subsequent cards match neither the led suit nor the trump suit.
5. AFTER each trick while the draw pile contains cards, THE Briscola_Engine SHALL have the trick winner draw one card first, followed by each other player in turn order; WHEN exactly 1 card remains in the draw pile, the trick winner SHALL draw that card and the other player SHALL take the face-up Briscola card.
6. WHEN all cards have been played, THE Briscola_Engine SHALL sum captured card points per side; the side with 61 or more points SHALL be declared the winner; IF both sides total exactly 60 points, THE Briscola_Engine SHALL declare the hand a draw.
7. THE Briscola_Engine SHALL support the following player configurations and variants:
   - **2-Player Classic**: 3 cards each, 1v1 match play to 1, 2, or 3 game wins.
   - **3-Player Briscola**: Played with a 39-card deck (removing the 2 of Denari), 3 cards each, 13 tricks, individual scoring.
   - **4-Player Partnership**: 2 teams of 2 seated in alternating positions, combined team capture scores, with optional table secret signals (*segni*) enabled or disabled.
   - **5-Player Briscola Chiamata (Bugiarda / Quintilio)**: All 40 cards dealt (8 cards each); players participate in an auction bidding phase (bidding points from 61 to 120); highest bidder becomes Caller and names a specific card; holder of that card becomes the secret Friend (*Socio*); the alliance remains hidden until the called card is played.
   - **6-Player Partnership**: Played with a 36-card deck (removing all four 2s), structured as two teams of 3 or three teams of 2.
   - **Briscola a 31**: Fast-paced variant where first player to capture 31 points may claim immediate victory; an erroneous claim results in immediate forfeiture.
   - **Briscola Scoperta**: Open-hand variant where all players' hands are rendered face-up for perfect information play.
   - **Briscolone**: 5 cards dealt per player, no trump suit, tricks resolved strictly by card ranking within the led suit.
8. THE Briscola_Engine SHALL be a pure, deterministic state machine supporting reproducible replay from seed and command logs.

---

### Requirement 4: Multiplayer Suite — Offline, LAN & Internet

**User Story:** As a group of friends or a family, we want to play together seamlessly offline on one device, over our home Wi-Fi (LAN), or over the internet using easy room codes, without account logins.

#### Acceptance Criteria

1. THE App SHALL support three distinct multiplayer operating modes:
   - **Offline Pass-and-Play**: 2 to 6 players sharing a single physical phone, tablet, or PC.
   - **Local Network (LAN)**: Direct connection between devices on the same Wi-Fi or subnet without requiring external internet bandwidth.
   - **Internet Multiplayer**: Online rooms connecting players globally via WebRTC data channels with lightweight WebSocket signaling.
2. WHILE Pass-and-Play is active:
   - THE App SHALL display a privacy shield transition screen between player turns stating "Pass device to [Player Name]".
   - WHILE the transition screen is active, THE App SHALL hide all hand cards from the screen.
   - THE App SHALL only reveal the active player's hand cards after the active player confirms readiness via button click or screen tap.
3. WHILE Local Network (LAN) multiplayer is active:
   - THE App SHALL utilize local mDNS or local subnet broadcast / direct IP entry so players on the same Wi-Fi network can discover and join hosted games with zero internet dependency.
4. WHILE Internet multiplayer is active:
   - THE App SHALL generate memorable, child-safe 4-letter or animal/nature-themed Room Codes (e.g. `SOLE`, `MARE`, `LUNA`, `LUPO`, `ROMA`, `GATTO`).
   - THE App SHALL generate a shareable join URL (e.g. `https://.../?room=SOLE`) and an on-screen QR Code for instantaneous camera joining from smartphones and tablets.
   - THE App SHALL establish low-latency, encrypted WebRTC peer-to-peer DataChannels between the host and client players, falling back to secure WebSocket relay if direct P2P connections are blocked by NAT/firewalls.
5. THE App SHALL maintain synchronization using a deterministic, host-authoritative command protocol:
   - The host validates commands and broadcasts sequenced state events to all connected clients.
   - Each client executes the deterministic engine locally to guarantee identical state representation and zero desynchronization.
6. IF a connected player temporarily loses network connectivity, THEN THE App SHALL:
   - Maintain the player's seat and game state during a 60-second grace period.
   - Display a non-intrusive "Reconnecting [Player Name]..." status banner.
   - Seamlessly substitute a Standard AI opponent if the player does not reconnect within the grace period, allowing remaining human players to complete the match without disruption.
   - Allow the disconnected player to rejoin and seamlessly reclaim their seat if they return before the match concludes.
7. THE App SHALL support Spectator Mode, allowing non-playing family members or friends to join a room code as observers with a public table view.

---

### Requirement 5: Child & Family Safety Architecture

**User Story:** As a parent, I want to ensure my children can play safely without exposure to strangers, online harassment, data tracking, or commercial exploitation.

#### Acceptance Criteria

1. THE App SHALL collect ZERO personally identifiable information (PII), requiring NO account registration, NO email addresses, NO passwords, NO phone numbers, and NO social logins.
2. THE App SHALL contain ZERO commercial advertisements, ZERO tracking cookies, ZERO third-party analytics telemetry, and ZERO in-app microtransactions.
3. THE App SHALL be strictly compliant with the Children's Online Privacy Protection Act (COPPA) and General Data Protection Regulation for Kids (GDPR-K).
4. THE App SHALL strictly prohibit unmoderated free-text chat in multiplayer modes, eliminating cyberbullying, predatory behavior, and inappropriate language.
5. THE App SHALL provide a rich, expressive **Safe Chat** system featuring:
   - **Authentic Italian Card Banter**: Canned audio-visual speech bubbles with positive, wholesome cultural phrases:
     - *"Scopa!"*
     - *"Bella presa!"* (Great capture!)
     - *"Mamma Mia!"*
     - *"Complimenti!"* (Well played!)
     - *"Occhio!"* (Watch out!)
     - *"Forza!"* (Let's go!)
     - *"Buona mano!"* (Good hand!)
     - *"Ci siamo!"* (Here we go!)
     - *"Che combinazione!"* (What a combination!)
   - **Animated Emoji & Reaction Wheel**: Kid-friendly animated stickers (thumbs up, smiling sun, cheerful Italian gesture 🤌, clapping hands, espresso cup, celebratory confetti, friendly mascot wave).
6. THE App SHALL provide an **Avatar & Persona Picker** with at least 16 charming, hand-crafted, family-friendly characters (Nonna Rosa, Nonno Mario, Luppolo the wolf, Chicco the sparrow, Bella the cat, Gigi the fox, etc.) paired with an automated child-friendly name generator.
7. THE App SHALL include a **Parental Controls Lock**:
   - Parents can restrict the app to "Offline / LAN Only" via a simple parental PIN or math confirmation gate, preventing unassisted internet matchmaking.

---

### Requirement 6: Simple Mode (Kids 8+) & Interactive Learning

**User Story:** As a child or beginner learning Scopa or Briscola, I want clear visual helpers and step-by-step guidance, so that I can learn card arithmetic and game rules with confidence.

#### Acceptance Criteria

1. THE App SHALL provide two selectable play assistance modes: **Simple Mode (Kids Mode)** and **Full Mode (Standard/Pro)**, switchable at any time from the in-game HUD or Settings.
2. WHILE Simple Mode is active in Scopa:
   - WHEN the player selects or hovers over a hand card, THE App SHALL highlight all legal table cards and multi-card combinations that can be captured with prominent glowing borders.
   - THE App SHALL display clear mathematical equation badges over candidate table cards (e.g. displaying `[3] + [4] = 7` when a 7 is selected).
   - THE App SHALL display a child-friendly text explanation of legal captures beneath the tray (e.g., "Take the 7 of Swords" or "Take the 3 of Cups and 4 of Coins").
3. WHILE Simple Mode is active in Briscola:
   - THE App SHALL render point-value badges directly on cards (+11 for Ace, +10 for Three, +4 for King, +3 for Knight, +2 for Jack, 0 for lisci).
   - THE App SHALL display a subtle trump icon badge on all cards belonging to the active Briscola Trump suit.
4. THE App SHALL NOT make tactical move suggestions or automate plays for the user in Simple Mode; it SHALL purely illuminate legal options and mathematics to foster learning.
5. THE App SHALL include fully interactive, step-by-step **Tutorials** for both Scopa and Briscola using the real game engine:
   - Guided practice hands with visual directional indicators.
   - "Coach Nonna" explanations explaining dealing, capturing, sweeping, trump dynamics, and scoring calculations.
   - Practice challenges allowing the learner to execute captures and tricks with immediate encouraging feedback.

---

### Requirement 7: "Simply Beautiful" 3D Tabletop & Atmospheres

**User Story:** As a player, I want a visually stunning, warm, and inviting 3D tabletop atmosphere with realistic cards, lighting, and textures, creating a luxurious gaming experience.

#### Acceptance Criteria

1. THE App SHALL render the card table in 3D using Three.js with realistic physical card meshes (incorporating physical card thickness, subtle corner beveling, and paper specular sheen).
2. THE App SHALL provide dynamic lighting with soft contact shadows cast by cards onto the table surface and onto overlapping cards.
3. THE App SHALL provide at least four handcrafted **Table Atmospheres**:
   - **Trattoria Rustica**: Warm weathered olive wood surface, red-and-white checkered linen cloth, dappled Mediterranean sunlight.
   - **Piazza al Tramonto**: Smooth travertine marble tabletop, terracotta terrace accents, warm golden-hour evening light.
   - **Salotto da Gioco**: Luxurious emerald green card felt, polished walnut rim with brass inlays, cozy overhead pendant lamp.
   - **Notte Stellata**: Deep midnight-blue slate felt, warm candlelight flickers, cinematic ambient shadows.
4. THE App SHALL derive card 3D poses (position, rotation, elevation) purely from the `MatchState` via a pure `sceneModel(state)` transformation function.
5. THE App SHALL provide an accessible, high-performance **2D Flat Table Fallback**:
   - If WebGL 2 is unavailable, low-power mode is enabled, `prefers-reduced-motion` is active, or the frame rate drops below 30 fps for 3 seconds, THE App SHALL seamlessly engage the Flat Table mode.
   - The Flat Table SHALL present all cards as hardware-accelerated DOM elements with identical game features, visual clarity, and full accessibility.
6. THE 3D Tabletop SHALL sustain 60 frames per second at viewports up to 3840 × 2160 on WebGL 2 capable devices.

---

### Requirement 8: Spring-Based Card Physics & Tactile Haptics

**User Story:** As a player, I want cards to move with natural weight, loft, and tactile snap, so that playing digital cards feels as satisfying as playing with a real physical deck.

#### Acceptance Criteria

1. THE App SHALL animate card movements (dealing, playing to table, gathering tricks, clearing scope) using realistic spring physics via the Motion library or custom damped spring solvers.
2. WHEN cards are dealt or played, THE App SHALL animate cards along parabolic flight arcs with subtle natural aerodynamic tilt (pitch and roll) based on movement velocity.
3. WHEN a user drags a card on touchscreens or with a mouse, THE App SHALL dynamically tilt the card in 3D toward the cursor with subtle physical resistance and card bending.
4. WHEN an animation is interrupted by rapid input or incoming network events, THE App SHALL smoothly redirect the card to its new destination without visual snapping or frame jitter exceeding 2 pixels.
5. THE App SHALL provide tactile **Haptic Feedback** on supported mobile devices (via the Web Vibration API):
   - A subtle 10ms haptic tick when selecting or dragging a card.
   - A crisp 25ms haptic confirmation when a card is placed or captures cards.
   - A celebratory dual-pulse pattern (50ms - 30ms - 50ms) when scoring a Scopa or winning a decisive trick.
6. WHEN Reduced Motion is enabled in Settings or OS preferences, THE App SHALL disable decorative flight arcs and camera tilts while preserving functional card position transitions.

---

### Requirement 9: Audio System & Italian Soundscapes

**User Story:** As a player, I want authentic card acoustics, satisfying sweeps, and relaxing acoustic ambience that immerse me in a traditional Italian setting.

#### Acceptance Criteria

1. THE App SHALL play high-fidelity, binaural stereo audio recordings of authentic Italian card mechanics using Howler.js:
   - Crisp card riffle shuffles and cuts.
   - Smooth card slides over wood and felt surfaces.
   - Satisfying physical table slap sounds upon card play.
   - Celebratory Scopa chimes and match victory fanfares.
2. THE App SHALL apply spatial stereo panning to card audio events scaled linearly from -0.5 (far left of table) to +0.5 (far right of table) based on the card's 3D table coordinate.
3. THE App SHALL provide optional, relaxing ambient Italian soundscapes (gentle acoustic classical guitar/mandolin melodies, soft outdoor café murmurs, or peaceful summer crickets).
4. THE App SHALL provide three independent volume sliders in Settings (Sound Effects, Interface, Ambience) adjustable from 0% to 100%.
5. IF audio assets fail to load or Web Audio encounters an error, THEN THE App SHALL gracefully fallback to synthesized Web Audio oscillator tones without crashing or halting gameplay.
6. WHEN the browser tab is hidden or backgrounded, THE App SHALL automatically pause ambient audio playback and resume smoothly upon return.

---

### Requirement 10: AI Opponents & Simulation Framework

**User Story:** As a solo player, I want intelligent, engaging AI opponents that offer a fun challenge for beginners and authentic tactical play for experts.

#### Acceptance Criteria

1. THE App SHALL provide three distinct AI difficulty levels for both Scopa and Briscola:
   - **Relaxed (Principiante)**: Selects moves randomly from legal options with gentle play suited for young children and beginners.
   - **Standard (Esperto di Casa)**: Evaluates immediate point values (prioritizing 7 of Coins, coin suits, high cards, and scope in Scopa; high-value cards and trump preservation in Briscola).
   - **Expert (Campione del Circolo)**: Executes determinized Monte Carlo tree sampling over unobserved hidden cards, tracking played cards, calculating opponent hand probabilities, and optimizing long-term point differentials.
2. THE App SHALL execute all AI computation within background **Web Workers**, ensuring the main browser UI thread is never blocked for more than 16 milliseconds during AI thinking.
3. THE AI SHALL select decisions within a humanized timing window (400ms to 1200ms) to emulate natural contemplation without causing frustrating delays.
4. THE App SHALL include a headless batch simulation runner (`npm run sim`) capable of simulating 1,000+ seeded matches between AI personalities across all presets, outputting win rates, Primiera distributions, and zero illegal moves.

---

### Requirement 11: Modular & Maintainable Code Architecture

**User Story:** As a developer, I want a clean, decoupled, component-based codebase with strict separation of concerns, eliminating monolithic files and technical debt.

#### Acceptance Criteria

1. THE App codebase SHALL be organized into strictly separated architectural domains:
   - `src/core/engine/`: Pure state machine engines (`ScopaEngine`, `BriscolaEngine`) with no DOM, Canvas, or network imports.
   - `src/core/rules/`: Pure rule validators, combinatorics, scoring functions, and preset definitions.
   - `src/network/`: Transport adapters (Local, LAN, WebRTC, WebSocket) using a unified message interface.
   - `src/presentation/`: 3D WebGL renderer (`Table3D`), 2D DOM renderer (`TableFlat`), audio manager, and particle effects.
   - `src/ui/`: Modular view components (HUD, SetupWizard, Lobby, ScoreSheet, SafeChatWheel, TutorialCoach).
2. NO source code file in `src/ui/` or `src/presentation/` SHALL exceed 400 lines of code; monolithic controller patterns (such as the legacy 1143-line `game.ts` in the reference) SHALL be strictly replaced by modular components.
3. THE entire codebase SHALL be written in TypeScript with strict type checking (`"strict": true` in `tsconfig.json`) and zero use of `any` types.
4. ALL game engine state transformations SHALL be immutable and side-effect free, verified by unit tests confirming that input state objects are never mutated.

---

### Requirement 12: Rules Configuration & Shareable Rules Code

**User Story:** As a player, I want to share my custom house rules with friends via a short, shareable code or link.

#### Acceptance Criteria

1. THE App SHALL serialize any valid Scopa rule configuration into a compact string prefixed `SCOPA1-` (maximum 150 characters) and any Briscola rule configuration into a string prefixed `BRIS1-`.
2. THE App SHALL provide a two-way encoder and decoder: `decodeRules(encodeRules(config))` SHALL produce an object identical to `config`.
3. WHEN a player pastes or enters a Rules Code into the setup screen, THE App SHALL immediately decode the code and configure all match settings.
4. IF a player enters an invalid or unrecognized Rules Code, THE App SHALL display a friendly error message and retain existing settings without crashing.
5. THE App SHALL support embedding the Rules Code into URL query parameters (e.g. `?rules=SCOPA1-...`) for one-click sharing via messaging apps.

---

### Requirement 13: Progressive Web App & Offline Installation

**User Story:** As a mobile player, I want to install the game on my home screen and play smoothly on trains or flights without an internet connection.

#### Acceptance Criteria

1. THE App SHALL register a Service Worker that precaches all application assets (HTML, CSS, JS, SVG card art, 3D models/textures, and audio sprites) during the initial load.
2. WHEN offline, THE App SHALL load instantly and provide full access to Solo Play vs. AI, Pass-and-Play Multiplayer, Tutorials, and Settings without network connectivity.
3. THE App SHALL satisfy all Progressive Web App (PWA) criteria, providing a complete Web App Manifest (`manifest.webmanifest`) with icons, start URL, theme colors, and display configuration for installation on iOS Safari and Android Chrome.
4. WHEN an application update is published, the Service Worker SHALL download assets in the background and present a non-blocking "Update Available" notification; clicking the notification SHALL activate the update without losing saved match data.

---

### Requirement 14: Save State, Persistence & Statistics

**User Story:** As a player, I want my active game to save automatically and my win/loss records to be tracked privately on my device.

#### Acceptance Criteria

1. THE App SHALL automatically save the complete `MatchState` and command history to `localStorage` after every played move for both Scopa and Briscola.
2. WHEN the App is reopened with an in-progress game, THE App SHALL present a clear "Resume Match" or "New Game" prompt.
3. THE App SHALL track per-game, per-variant statistics locally (matches played, wins, losses, draws, Scope scored, Primiera won, Sette Bello captured, current win streak, longest win streak).
4. THE App SHALL provide a "Reset All Data" option in Settings, protected by a confirmation dialog, that completely wipes saved matches and statistics from `localStorage`.

---

### Requirement 15: Accessibility & Inclusivity (WCAG 2.1 AA)

**User Story:** As a player using a screen reader, keyboard, or with low vision, I want full access to the game with high contrast and intuitive navigation.

#### Acceptance Criteria

1. THE App SHALL be 100% playable using keyboard navigation alone (Tab, Shift-Tab, Enter, Space, Arrow keys), with visible, high-contrast focus rings (minimum 3:1 contrast ratio against backgrounds).
2. THE App SHALL announce all game events (cards played, captures made, scope scored, hand scores, trick winners) to screen readers via polite ARIA live regions.
3. ALL cards SHALL have explicit, descriptive `aria-label` attributes in the active language (e.g., "Sette di Denari, valore 7, punto Settebello").
4. THE App SHALL provide a High-Contrast Card Face mode and adjustable UI text scaling for players with low vision.
5. ALL interactive touch targets SHALL maintain a minimum physical dimension of 44 × 44 CSS pixels on touch devices.

---

### Requirement 16: Internationalization (Italian & English)

**User Story:** As an Italian or international player, I want the option to play in authentic Italian or English with culturally accurate terminology.

#### Acceptance Criteria

1. THE App SHALL default to Italian (`it-IT`), displaying authentic card names and terminology (Denari, Coppe, Spade, Bastoni, Settebello, Primiera, Scopa, Briscola, Asso, Fante, Cavallo, Re).
2. THE App SHALL support full English (`en-US`) localization, switchable with a single tap in Settings or on the title bar.
3. ALL user-facing text strings SHALL reside in decoupled localization dictionaries (`src/content/locales/`), strictly prohibiting hardcoded UI strings in game engines or renderers.

---

### Requirement 17: Score Ceremony & Match Celebrations

**User Story:** As a player, I want an exciting, suspenseful score ceremony at the end of every hand and match that highlights each point won.

#### Acceptance Criteria

1. WHEN a hand ends in Scopa, THE App SHALL display a suspenseful step-by-step score ceremony:
   - Revealing Carte, Denari, Sette Bello, Primiera, and Scope with individual 800ms pacing, accompanying celebratory audio effects, and highlighting captured cards.
2. WHEN a hand ends in Briscola, THE App SHALL tally points with an animated counter, revealing point cards captured by each side.
3. WHEN a Scopa is scored during live play, THE App SHALL trigger a celebratory on-screen banner ("SCOPA!"), accompanied by card particle bursts and a satisfying sound effect.
4. WHEN Reduced Motion is active, score ceremonies SHALL display as an immediate, clean static summary list without animated delays.

---

### Requirement 18: Game Setup Wizard & Lobby

**User Story:** As a player, I want an inviting setup wizard to easily configure game type, player counts, AI or multiplayer modes, and card styles.

#### Acceptance Criteria

1. WHEN starting a new game, THE App SHALL present a streamlined setup wizard:
   - Step 1: Select Game (Scopa or Briscola).
   - Step 2: Select Play Mode (Solo vs. AI, Pass-and-Play, Local LAN, or Internet Room).
   - Step 3: Select Rule Preset & Target Score (with bullet-point summaries of rules).
   - Step 4: Seat Configuration (assigning Human or AI difficulty to each seat).
   - Step 5: Table Atmosphere & Card Deck Selection.
2. THE App SHALL remember the player's last-used game settings as default selections for subsequent games.

---

### Requirement 19: Comprehensive Testing & Quality Assurance

**User Story:** As a developer, I want comprehensive test coverage across rules, state machines, AI, networking, and rendering, ensuring zero regressions.

#### Acceptance Criteria

1. THE App SHALL maintain automated test suites in `tests/`:
   - `tests/rules/`: Validating capture logic, exact-match priorities, 1,000+ random table combinations, authentic Primiera scoring tables, and Briscola trick resolution.
   - `tests/engine/`: Validating state transitions, dealing exhaustion, Kings redeals, dealer rotations, and deterministic replay.
   - `tests/ai/`: Validating legal move generation, Web Worker communication, information boundary isolation, and seeded reproducibility.
   - `tests/network/`: Validating room creation, command serialization, state synchronization, and reconnection handling.
   - `tests/presentation/`: Validating 3D/2D table mode transitions, spring physics bounds, and audio volume controls.
2. WHEN `npm test` is executed, 100% of test suites SHALL pass with zero failures.

---

### Requirement 20: Build, Deployment & CI/CD

**User Story:** As a developer, I want automated builds, typechecks, and GitHub Pages deployments on every repository push.

#### Acceptance Criteria

1. THE App SHALL compile to a static `dist/` directory using Vite and TypeScript (`npm run build`).
2. THE build process SHALL execute strict TypeScript typechecking (`tsc --noEmit`) and fail the build if any type errors are encountered.
3. THE project SHALL include a GitHub Actions workflow (`.github/workflows/deploy.yml`) that executes tests, typechecks, builds, and deploys the static site to GitHub Pages on every push to the `main` branch.
4. THE App SHALL provide a production preview command (`npm run preview`) that serves the compiled `dist/` bundle over a local HTTP server for testing PWA installation and offline capabilities.
