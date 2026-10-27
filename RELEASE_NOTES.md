# Release Notes - v1.0.0

🎉 **Initial Official Release of Scopa, Briscola, Tressette & Solitario Suite**

A complete, tactile, authentic, and family-friendly Italian card game suite built with TypeScript, Vite, Three.js, and Electron. Designed for players of all generations, fully playable offline, on local home Wi-Fi networks (LAN), or online via serverless WebRTC Peer-to-Peer.

---

## 🌟 What's New in v1.0.0

### 🎴 4 Traditional Italian Card Games

1. **🧹 Scopa**
   - **8 Authentic Regional Rule Variants**: Classic Scopa, Scopone (4 players), Scopone Scientifico (all 10 cards dealt upfront), Asso Pigliatutto, Quindici (sum-to-15), Napola (coin run 1-2-3...), Re Bello (King of Coins bonus point), and Cirulla Ligure (with sum-to-15 capture & Accuso bonuses).
   - **Player Counts**: 2 Players (1v1), 3 Players (1v1v1), and 4 Players (2v2 Partnerships).
   - **Interactive Multi-Capture Selection**: When a card can capture multiple subsets (e.g. `7 = 5 + 2` or `4 + 3`), tap cards directly on the table or use formula buttons with cyan highlight guides.
   - **Optional Helper / Kids Mode**: On-demand value badges for beginners and kids.

2. **🎺 Briscola**
   - **4 Game Modes**: Classic (1v1), Partnership (2v2), Open-Hand *Briscola Scoperta* (open cards for training and children), and Fast *Briscola a 31*.
   - Authentic right-side *Tallone* draw stock with face-up trump card rotated 90° underneath.

3. **👑 Tressette**
   - **4 Complete Modes**:
     - *Tressette in Due* (1v1 with 20-card Tallone and face-up drawn card reveal).
     - *Tressette in Quattro* (2v2 partnerships with traditional partner signals: *Busso*, *Striscio*, *Volo*).
     - *Traversone / Rovescino* (A Perdere negative scoring; lowest score wins, Ace of Clubs penalty = 11 pts).
   - Strict card rank order: `3 > 2 > A > Re > Cavallo > Fante > 7 > 6 > 5 > 4`.
   - Mandatory suit-following with dimmed illegal cards.
   - Automatic *Accusi* scoring (*Napoletana*, *Tris*, *Quattro*) and *Ultima Presa* inspector.

4. **🃏 Italian 40-Card Solitaire (Solitario)**
   - 4 scrollable tableau columns and 4 suit foundation piles (Coins, Cups, Swords, Batons) building from Ace to King.
   - Stock, Waste, and Foundation counters.
   - Quality-of-life features: Unlimited waste recycling, Undo (`↩️`), and Auto-Move (`⚡`).

---

### 🎨 Visuals, Decks & Atmospheres

- **8 Authentic Regional Italian Card Decks**:
  1. *Carte Napoletane* (Classiche)
  2. *Carte Piacentine* (Tradizionali)
  3. *Carte Bresciane* (Dal Negro)
  4. *Carte Romagnole* (Classiche)
  5. *Carte Trevisane* (Venete)
  6. *Carte Bergamasche* (Lombarde)
  7. *Carte Triestine* (Veneto-Giuliane)
  8. *Fiaba Moderna* (Illustrate Bimbi — custom vector art deck)

- **7 Scenic Table Atmospheres**:
  - 🪵 Legno di Trattoria (Rustic Walnut Wood)
  - 🟩 Panno Verde Classico (Casino Emerald Felt)
  - 🏛️ Marmo Veneziano (Venetian Carrara Marble)
  - 🌌 Notte Stellata (Midnight Starry Sky & Linen)
  - 🎃 Halloween Stregato (Twilight Purple, Webbing & Lanterns)
  - 🎄 Festa di Natale / Xmas (Crimson, Pine Green & Gold Snowflakes)
  - 🌈 Regno dei Bimbi (Pastel Wonderland & Confetti)

- **Choreography & Animation Physics**:
  - Smooth card-throw arcs (`gioca-dal-basso` / `gioca-dallalto`).
  - Clear 900ms trick-resolution inspection hold.
  - Directional trick sweep flight into the winning player's capture pile.

---

### 👥 Multiplayer Everywhere (Zero Configuration)

- **🤝 Pass & Play**: Single device turn-sharing with an automatic privacy shield.
- **🏠 Home Wi-Fi / Local LAN**: Automatic built-in HTTP server on port 8135. Join instantly with phones, tablets, or other PCs by opening the local IP or matching room word.
- **🌍 Live Online P2P (WebRTC)**: Serverless direct connection via Offer/Answer exchange code. No registration, no tracking, and no external servers required.

---

### 💻 System & Packaging

- **Standalone Portable Executable**: Packaged with Electron for Windows 64-bit (`Scopa-Suite.exe`). Zero installation required.
- **Modern Web Architecture**: TypeScript 5.7, Vite 6, Three.js r174, Howler audio engine, Motion animations, and Vitest test suite.
