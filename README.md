# 🎴 Scopa, Briscola, Tressette & Solitario — Italian Card Game Suite (v1.0.0)

> **A tactile, authentic, and family-friendly Italian card game suite designed for kids, grandparents, and families worldwide.**  
> *100% free, offline-first, zero ads, zero tracking, with 8 authentic regional decks, 7 scenic table atmospheres (including Halloween, Christmas/Xmas, and Kids Wonderland), natural card-play choreography, interactive multi-capture selection, and zero-configuration LAN & Serverless Online P2P multiplayer.*

[![Node Version](https://img.shields.io/badge/Node-22%2B-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5%2B-blue.svg)](https://www.typescriptlang.org)
[![Electron](https://img.shields.io/badge/Electron-45%2B-47848F.svg)](https://www.electronjs.org)
[![Three.js](https://img.shields.io/badge/Three.js-r174-black.svg)](https://threejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🇬🇧 English Documentation

### 🌟 Key Features

* **4-in-1 Playable Traditional Card Games (All Included in the Executable)**:
  * **🧹 Scopa**: 8 authentic regional variants (Classic, Scopone 4-player, Scopone Scientifico with all 10 cards dealt, Asso Pigliatutto, Quindici sum-to-15, Napola coin sequence run, Re Bello, and Cirulla Ligure with Accuso bonuses). Supports **2 Players (1v1)**, **3 Players (1v1v1)**, and **4 Players (2v2 Partnerships)**.
  * **🎺 Briscola**: 4 game modes (Classic 1v1, Partnership 2v2 with 4 players, Open-Hand *Briscola Scoperta* for kids and learners, and Fast *Briscola to 31*). Features right-side *Tallone* draw stock with face-up trump card rotated 90° underneath.
  * **👑 Tressette**: 4 complete modes (**Tressette in Due** 1v1 with 20-card *Tallone* and face-up drawn-card reveal, **Tressette in Quattro** 2v2 partnerships with *Busso*, *Striscio*, and *Volo* partner signals, and **Traversone / Rovescino** *A Perdere* for 2 or 4 players where the lowest score wins and the Ace of Clubs is worth 11 points). Enforces the authentic rank hierarchy (`3 > 2 > A > Re > Cavallo > Fante > 7 > 6 > 5 > 4`), mandatory suit-following with dimmed illegal cards, *Terzi* (⅓ point) + *Ultima* scoring, automatic *Accusi* (*Napoletana*, *Tris*, *Quattro*), and an *Ultima Presa* (Last Trick) inspector.
  * **🃏 Italian 40-Card Solitaire (Solitario)**: 4 scrollable tableau columns and 4 foundation piles (Coins, Cups, Swords, Batons) building from Ace (1) to King (10), with unlimited waste recycling, Stock/Waste/Foundation card counters, Undo (`↩️`), and Auto-Move (`⚡`).
* **Natural Card-Play Choreography & Paced Animations**:
  * Cards enter with natural arc physics (`gioca-dal-basso` / `gioca-dallalto`).
  * A clear pause and hold on trick resolution (`900ms`) ensures players see the cards played and captured before they sweep away.
  * Directional trick sweep flight (`vola-giu` / `vola-su`) moves captured cards directly to the winning player's pile.
* **Intuitive Interactive Multi-Capture Selection (e.g. `7 = 5 + 2` vs `4 + 3`)**:
  * **Click directly on table cards**: When playing a card that can capture multiple combinations, capturable cards glow with a cyan border while non-capturable cards dim. Click the cards directly on the table (e.g., clicking 5 then 2) to execute the capture!
  * **Combination buttons**: Clear visual buttons in the hand tray display exact card names and arithmetic formulas (e.g., `✨ 5 + 2 = 7`), with mouse-over card highlighting.
  * **Optional Helper / Kids Mode (`💡 Helper: ON/OFF`)**: Card value badges are hidden in normal mode for an authentic uncluttered look, and can be toggled on at any time for children and beginners.
* **8 Authentic Regional Italian Card Decks**:
  1. **☀️ Carte Napoletane (Classiche)**: Historical Neapolitan deck scans.
  2. **⚔️ Carte Piacentine (Tradizionali)**: High-resolution clean recentered Piacentine deck.
  3. **🦁 Carte Bresciane (Dal Negro)**: Classic Lombard Bresciane deck.
  4. **🐓 Carte Romagnole (Classiche)**: Traditional Emilia-Romagna deck.
  5. **🏛️ Carte Trevisane (Venete)**: Traditional Venetian Trevisane deck.
  6. **🏔️ Carte Bergamasche (Lombarde)**: Traditional Bergamo regional deck.
  7. **⚓ Carte Triestine (Veneto-Giuliane)**: Traditional Trieste regional deck.
  8. **✨ Fiaba Moderna (Illustrate Bimbi)**: 100% original custom Renaissance vector deck with court character illustrations.
* **7 Scenic Table Atmospheres**:
  1. **🪵 Legno di Trattoria** (Rustic Italian Walnut Wood)
  2. **🟩 Panno Verde Classico** (Classic Emerald Casino Felt)
  3. **🏛️ Marmo Veneziano** (Venetian Carrara Marble)
  4. **🌌 Notte Stellata** (Midnight Starry Sky & Indigo Linen)
  5. **🎃 Halloween Stregato** (Enchanted Twilight Purple with Cobwebs & Glowing Lanterns)
  6. **🎄 Festa di Natale / Xmas** (Velvet Crimson & Pine Green with Golden Snowflakes)
  7. **🌈 Regno dei Bimbi** (Bright Kids Wonderland with Pastel Confetti)

---

### 🌐 How to Play Together (Pass & Play, Home Wi-Fi LAN, and Online P2P)

Click **`👥 Play Together`** in the top bar (or choose your desired mode inside **`⚙️ New Game`**):

#### 1. 🤝 Pass & Play (Same Screen)
* Click **`🎮 Start Pass & Play`**.
* Two players share the same PC or tablet. Between every turn, an automatic privacy shield hides the hand until the next player clicks *"I am Ready — Show My Cards"*.

#### 2. 🏠 Home Wi-Fi / Local LAN (Zero Configuration)
When running `Scopa-Suite.exe`, a lightweight local home server starts automatically on port `8135`:
1. **Player 1 (Host)**: Open **`👥 Play Together`**, pick a 4-letter table word (e.g. `SOLE`, `LUNA`, `MARE`), and click **`🏠 Host Table "SOLE" (Player 1)`**.
2. **Player 2 (Joining on Home Wi-Fi)**:
   * **From any Phone, Tablet, or Browser**: Open the displayed address shown on Player 1's screen (e.g. `http://192.168.1.x:8135/?room=SOLE`). You immediately join as Player 2 with your own hand!
   * **From a 2nd PC running `Scopa-Suite.exe`**: Open **`👥 Play Together`**, enter Player 1's local IP address (shown on Player 1's screen), select the same 4-letter word (`SOLE`), and click **`🔗 Join "SOLE" (Player 2)`**.

#### 3. 🌍 Live Online Play (Serverless WebRTC Peer-to-Peer)
Play live in real time across the internet with zero accounts or external game servers:
1. **Player 1 (Host)**: In **`👥 Play Together`**, select **"I am Player 1 (Create Match)"** and click **`1. Generate & Copy Offer Code (Step 1)`**. Send the copied code to Player 2 via WhatsApp, Telegram, or Email.
2. **Player 2 (Guest)**: Select **"I am Player 2 (Join Match)"**, paste Player 1's code into the box, and click **`🔑 Generate Answer`**. Send the automatically copied Answer Code back to Player 1.
3. **Player 1 (Host)**: Paste Player 2's Answer Code into **Step 2** and click **`🚀 2. Connect & Play!`**. Both screens connect directly Peer-to-Peer and start the live match (`Player 1 = Seat 0`, `Player 2 = Seat 1`)!

---

### 🚀 How to Run

#### 1. Standalone Windows Executable (`Scopa-Suite.exe`)
Double-click **`Scopa-Suite.exe`** in the project root. Everything (all Scopa/Briscola/Solitario modes, 2P/3P/4P options, all 5 decks, all 7 backgrounds, audio, LAN server, and WebRTC P2P) is packaged inside the portable executable.

#### 2. Web Development & Tests
```bash
# 1. Install dependencies
npm install

# 2. Type-check & automated test suite
npm run typecheck
npm test

# 3. Live development server
npm run dev

# 4. Production build & packaging
npm run build
npm run dist:exe
```

---

## 🇮🇹 Documentazione in Italiano

### 🌟 Panoramica e Funzionalità Principali

* **Suite Tradizionale 4-in-1 (Tutte le modalità incluse nell'eseguibile)**:
  * **🧹 Scopa**: 8 varianti regionali (Classica, Scopone a 4, Scopone Scientifico a 10 carte senza carte sul tavolo, Asso Pigliatutto, Quindici a somma 15, Napola con scala di denari, Re Bello e Cirulla Ligure con bonus d'Accuso). Supporta **2 Giocatori (1 contro 1)**, **3 Giocatori (Tutti contro Tutti)** e **4 Giocatori (2 contro 2 a Squadre)**.
  * **🎺 Briscola**: 4 modalità (Classica 1 contro 1, A Coppie 2 contro 2 in 4 giocatori, Briscola Scoperta per bambini e principianti, e Briscola Rapida a 31). Include il *Tallone* sulla destra con la carta di briscola ruotata di 90° sotto il mazzo.
  * **👑 Tressette**: 4 modalità complete (**Tressette in Due** 1 contro 1 con tallone e *pescata scoperta*, **Tressette in Quattro** a coppie 2 contro 2 con i segnali tradizionali *Busso*, *Striscio* e *Volo*, e **Traversone / Rovescino** *A Perdere* per 2 o 4 giocatori dove vince chi fa meno punti e l'Asso di Bastoni vale 11 punti). Include la gerarchia ufficiale (`3 > 2 > A > Re > Cavallo > Fante > 7 > 6 > 5 > 4`), l'obbligo di rispondere al seme di mano con attenuazione visiva delle carte non giocabili, il calcolo in *terzi di punto* + *Ultima*, gli *Accusi* (*Napoletana*, *Tris*, *Quattro*) e il pulsante *Ultima Presa*.
  * **🃏 Solitario a 40 Carte**: 4 colonne del tableau con scorrimento fluido e 4 basi (Denari, Coppe, Spade, Bastoni) dall'Asso (1) al Re (10), con riciclo illimitato degli scarti, contatori di carte, pulsante Annulla (`↩️`) e Mossa Automatica (`⚡`).
* **Coreografia Naturale e Animazioni Rilassate**:
  * Entrata morbida delle carte a ventaglio dal basso o dall'alto (`gioca-dal-basso` / `gioca-dallalto`).
  * Pausa dedicata sulla presa (`900ms`) per mostrare chiaramente quale carta ha preso e quali carte sono state catturate prima della raccolta.
  * Volo direzionale delle carte prese (`vola-giu` / `vola-su`) verso il mazzetto del vincitore della mano.
* **Selezione Intuitiva delle Prese Multiple (es. `7 = 5 + 2` o `4 + 3`)**:
  * **Selezione diretta cliccando sul tavolo**: Toccando una carta in mano, le carte catturabili sul tavolo si illuminano in ciano mentre le altre si attenuano. È possibile cliccare direttamente le carte sul tavolo per scegliere la combinazione preferita.
  * **Pulsanti combinazione dedicati**: Nel vassoio della mano compaiono pulsanti chiari con la formula aritmetica e i nomi delle carte (es. `✨ 5 + 2 = 7`), con evidenziazione al passaggio del mouse.
  * **Modalità Aiuto / Bimbi Opzionale (`💡 Aiuto: ON/OFF`)**: In modalità normale le carte non mostrano numerini aggiuntivi per mantenere l'aspetto tradizionale pulito; attivando l'Aiuto compaiono i valori e i suggerimenti matematici per bambini e principianti.
* **8 Mazzi Regionali Italiani Autentici**:
  1. **☀️ Carte Napoletane (Classiche)**
  2. **⚔️ Carte Piacentine (Tradizionali Centrate)**
  3. **🦁 Carte Bresciane (Dal Negro)**
  4. **🐓 Carte Romagnole (Classiche)**
  5. **🏛️ Carte Trevisane (Venete)**
  6. **🏔️ Carte Bergamasche (Lombarde)**
  7. **⚓ Carte Triestine (Veneto-Giuliane)**
  8. **✨ Fiaba Moderna (Illustrate Bimbi)**
* **7 Sfondi Scenografici per il Tavolo**:
  1. **🪵 Legno di Trattoria**
  2. **🟩 Panno Verde Classico**
  3. **🏛️ Marmo Veneziano**
  4. **🌌 Notte Stellata**
  5. **🎃 Halloween Stregato**
  6. **🎄 Festa di Natale / Xmas**
  7. **🌈 Regno dei Bimbi**

---

### 🌐 Come Giocare Insieme (Stesso Schermo, Wi-Fi di Casa / LAN e Online P2P)

Clicca su **`👥 Gioca Insieme`** nella barra in alto (oppure scegli la modalità nella finestra **`⚙️ Nuova Partita`**):

#### 1. 🤝 Passa e Gioca (Stesso Schermo)
* Clicca su **`🎮 Inizia Passa e Gioca`**.
* Due giocatori condividono lo stesso PC o tablet. A ogni cambio turno uno schermo di cortesia copre automaticamente le carte finché il giocatore successivo non clicca *"Sono Pronto — Mostra le mie carte"*.

#### 2. 🏠 In Casa su Wi-Fi / Rete Locale LAN (Senza Configurazione)
Avviando `Scopa-Suite.exe`, un server domestico leggero si attiva automaticamente sulla porta `8135`:
1. **Giocatore 1 (Chi crea il tavolo)**: Apri **`👥 Gioca Insieme`**, scegli una parola di 4 lettere (es. `SOLE`, `LUNA`, `MARE`) e clicca **`🏠 Crea Tavolo "SOLE" (Giocatore 1)`**.
2. **Giocatore 2 (Chi entra sul Wi-Fi di casa)**:
   * **Da Telefono, Tablet o Browser**: Apri nel browser l'indirizzo mostrato sullo schermo del Giocatore 1 (es. `http://192.168.1.x:8135/?room=SOLE`). Entrerai subito come Giocatore 2 vedendo le tue carte!
   * **Da un 2° PC con `Scopa-Suite.exe`**: Apri **`👥 Gioca Insieme`**, inserisci l'indirizzo IP del PC del Giocatore 1, seleziona la stessa parola (`SOLE`) e clicca **`🔗 Entra in "SOLE" (Giocatore 2)`**.

#### 3. 🌍 Gioca Online a Distanza in Tempo Reale (WebRTC Peer-to-Peer Diretto)
Gioca in diretta via internet con amici o parenti lontani senza bisogno di account o server esterni:
1. **Giocatore 1 (Host)**: In **`👥 Gioca Insieme`**, seleziona **"Sono il Giocatore 1 (Crea Partita)"** e clicca **`1. Genera & Copia Codice Invito (Step 1)`**. Invia il codice copiato al Giocatore 2 su WhatsApp, Telegram o Email.
2. **Giocatore 2 (Ospite)**: Seleziona **"Sono il Giocatore 2 (Partecipa)"**, incolla il codice ricevuto dal Giocatore 1 e clicca **`🔑 Genera Risposta`**. Invia il Codice Risposta (copiato automaticamente) al Giocatore 1.
3. **Giocatore 1 (Host)**: Incolla il Codice Risposta del Giocatore 2 nel **Passo 2** e clicca **`🚀 2. Connetti e Gioca!`**. I due dispositivi si collegano direttamente in tempo reale!
