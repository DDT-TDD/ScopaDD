# Credits, Inspirations & Attributions / Riconoscimenti e Fonti (v1.0.0)

---

## 🇬🇧 English: Credits & Attributions

This project (**Version 1.0.0**) celebrates traditional Italian card games (**Scopa**, **Briscola**, **Tressette**, and **Solitaire**), combining the cultural heritage of 8 regional decks with tactile 3D graphics, family safety, and zero-configuration local & online P2P multiplayer.

We gratefully acknowledge the following open-source projects, authors, and historical archives that provided code inspiration, rules reference, and public-domain assets:

### 1. Open Source Projects & Code Inspiration
- **`nico33t/briscola` (Nicola Castellaneta)**
  - *Repository:* <https://github.com/nico33t/briscola>
  - *License:* MIT
  - *Contribution:* High-resolution WebP **Piacentine** card scans (320×528) from Wikimedia Commons; reference choreography for two-stage trick animations (`gioca-dal-basso`, `vola-giu`); card-fan icon composition; and WebRTC/LAN signaling patterns.
- **`diegoami/Tressette` & `mhamilt/Italian-decks`**
  - *Repositories:* <https://github.com/diegoami/Tressette> & <https://github.com/mhamilt/Italian-decks>
  - *License:* GPL-3.0 / Open Source
  - *Contribution:* Traditional **Bresciane**, **Romagnole**, and **Trevisane** regional card decks; inspiration for Tressette 2-player exact endgame (`coda`) solver and Accusi detection.
- **`itzrusso10/tressette`**
  - *Repository:* <https://github.com/itzrusso10/tressette>
  - *License:* MIT / Open Source
  - *Contribution:* Inspiration for 4-player partnership Tressette signals (*Busso*, *Striscio*, *Volo*), *Tressette a Perdere* (*Traversone / Rovescino*), open drawn-card reveal (*pescata scoperta*), and *Ultima Presa* trick inspection.
- **`goblindegook/scopa` (Dan Hough)**
  - *Repository:* <https://github.com/goblindegook/scopa>
  - *License:* MIT
  - *Contribution:* Traditional **Bergamasche** regional deck; inspiration for interactive multi-capture selection directly on table cards.
- **`aflorj/briscola` (Florjan)**
  - *Repository:* <https://github.com/aflorj/briscola>
  - *License:* MIT
  - *Contribution:* Traditional **Triestine** regional deck and classical Briscola trick mechanics.
- **`OMerkel/scopa_marco` (Marco Scarpetta & Oliver Merkel)**
  - *Repository:* <https://github.com/OMerkel/scopa_marco>
  - *License:* GPL-3.0 / Open Source
  - *Contribution:* Historical open-source JavaScript Scopa implementation and capture logic research.
- **`rvenning/scopa` (Richard Venning)**
  - *Repository:* <https://github.com/rvenning/scopa>
  - *License:* Open Source
  - *Contribution:* Traditional **Napoletane** card deck, CC0 photographic textures, and regional rules presets.

### 2. Official Rules & Ethnographic Sources
- **John McLeod — Pagat.com**
  - *Scopa:* <https://www.pagat.com/fishing/scopa.html>
  - *Scopone & Scientifico:* <https://www.pagat.com/fishing/scopone.html>
  - *Briscola:* <https://www.pagat.com/aceten/briscola.html>
  - *Cirulla:* <https://www.pagat.com/fishing/cirulla.html>
  - Authoritative encyclopedic resource on traditional Italian card game rules, Primiera scoring tables, and Briscola points.
- **Modiano S.r.l. & Dal Negro (Italy)**
  - Historic Italian card makers since 1868 and 1928, custodians of the traditional regional suits (*Denari, Coppe, Spade, Bastoni*).

### 3. Graphics, Backgrounds & Sound Effects
- **5 Regional Decks (`public/cards/`)**:
  - *Napoletane*, *Piacentine*, *Bergamasche*, *Triestine* (Public Domain / CC0 scans) and *Fiaba Moderna* (100% original procedural SVG vector deck).
- **7 Scenic Table Backgrounds (`public/backgrounds/`)**:
  - Based on CC0 photographic material textures (*ambientCG*) with carved cushion rails, brass inlay, radial lighting, and thematic seasonal art (*Trattoria*, *Salotto*, *Piazza*, *Notte Stellata*, *Halloween*, *Christmas/Xmas*, *Kids Wonderland*).
- **Acoustic Audio (`public/audio/`)**:
  - Card shuffle, deal, slide, tap, and victory fanfare recordings under CC0 / Public Domain from *Freesound.org*.

### 4. Core Libraries & Engine
- **Three.js** — 3D WebGL renderer and lighting (MIT License).
- **Howler.js** — Audio sprite management (MIT License).
- **Electron & Electron-Builder** — Native Windows portable desktop packaging and embedded local LAN server (MIT License).
- **Vite & Vitest** — Bundler and 40 automated unit tests (MIT License).

---

## 🇮🇹 Italiano: Riconoscimenti e Fonti

Questo progetto (**Versione 1.0.0**) nasce dall'amore per i tradizionali giochi di carte italiani (**Scopa**, **Briscola**, **Tressette** e **Solitario**), combinando la ricchezza culturale di 8 mazzi regionali con moderne tecnologie web, grafica 3D e accessibilità per bambini, nonni e famiglie.

Riconosciamo e ringraziamo con profonda stima i progetti e le fonti che hanno fornito ispirazione, riferimenti storici e materiale di pubblico dominio:

### 1. Progetti Open Source e Codice di Riferimento
- **`nico33t/briscola` (Nicola Castellaneta)**
  - *Repository:* <https://github.com/nico33t/briscola>
  - *Licenza:* MIT
  - *Contributo:* Set di carte regionali **Piacentine** in alta risoluzione WebP (320×528) ricavate da Wikimedia Commons, ispirazione per la coreografia a due tempi delle prese (`gioca-dal-basso`, `vola-giu`) e composizione dell'icona a ventaglio.
- **`diegoami/Tressette` & `mhamilt/Italian-decks`**
  - *Repository:* <https://github.com/diegoami/Tressette> & <https://github.com/mhamilt/Italian-decks>
  - *Licenza:* GPL-3.0 / Open Source
  - *Contributo:* Mazzi regionali **Carte Bresciane**, **Carte Romagnole** e **Carte Trevisane**, oltre a ispirazione per il solutore esatto di finale (*coda*) nel Tressette.
- **`itzrusso10/tressette`**
  - *Repository:* <https://github.com/itzrusso10/tressette>
  - *Licenza:* MIT / Open Source
  - *Contributo:* Ispirazione per il Tressette in Quattro a coppie con segnali tradizionali (*Busso*, *Striscio*, *Volo*), il *Tressette a Perdere* (*Traversone / Rovescino*), la rivelazione della carta pescata e l'ispezione dell'*Ultima Presa*.
- **`goblindegook/scopa` (Dan Hough)**
  - *Repository:* <https://github.com/goblindegook/scopa>
  - *Licenza:* MIT
  - *Contributo:* Mazzo tradizionale di **Carte Bergamasche** e ispirazione per la selezione interattiva delle prese multiple direttamente sulle carte del tavolo.
- **`aflorj/briscola` (Florjan)**
  - *Repository:* <https://github.com/aflorj/briscola>
  - *Licenza:* MIT
  - *Contributo:* Mazzo tradizionale di **Carte Triestine** e dinamiche classiche di Briscola.
- **`OMerkel/scopa_marco` (Marco Scarpetta & Oliver Merkel)**
  - *Repository:* <https://github.com/OMerkel/scopa_marco>
  - *Licenza:* GPL-3.0 / Open Source
  - *Ispirazione:* Implementazione pionieristica in JavaScript del gioco della Scopa con supporto per varianti storiche e logica di cattura.
- **`rvenning/scopa` (Richard Venning)**
  - *Repository:* <https://github.com/rvenning/scopa>
  - *Licenza:* Open Source
  - *Ispirazione:* Mazzo di **Carte Napoletane**, texture fotografiche CC0 dei tavoli e ricerca sulle varianti regionali.

### 2. Regole Ufficiali e Fonti Etnografiche
- **John McLeod — Pagat.com**
  - *Scopa:* <https://www.pagat.com/fishing/scopa.html>
  - *Scopone & Scientifico:* <https://www.pagat.com/fishing/scopone.html>
  - *Briscola:* <https://www.pagat.com/aceten/briscola.html>
  - *Cirulla:* <https://www.pagat.com/fishing/cirulla.html>
- **Modiano S.r.l. & Dal Negro**
  - Storiche manifatture italiane di carte da gioco, custodi dei semi regionali (*Denari, Coppe, Spade, Bastoni*).

### 3. Grafica, Carte Regionali, Sfondi Scenografici e Audio
- **5 Mazzi Regionali (`public/cards/`)**:
  - *Napoletane*, *Piacentine*, *Bergamasche*, *Triestine* (scansioni storiche di Pubblico Dominio / CC0) e *Fiaba Moderna* (vettoriale originale).
- **7 Sfondi e Tavoli Scenografici (`public/backgrounds/`)**:
  - Basati su texture fotografiche CC0 (*ambientCG*) arricchite con illuminazione radiale, sponde imbottite, intarsi in ottone e decorazioni stagionali (*Trattoria*, *Salotto*, *Piazza*, *Notte Stellata*, *Halloween Stregato*, *Festa di Natale / Xmas*, *Regno dei Bimbi*).
- **Effetti Sonori (`public/audio/`)**:
  - Registrazioni acustiche di mazzi di carte da *Freesound.org* (CC0 / Public Domain).

### 4. Tecnologie e Librerie
- **Three.js** — Motore grafico 3D WebGL (MIT).
- **Howler.js** — Gestione audio e sprite sonori (MIT).
- **Electron & Electron-Builder** — Packaging nativo Windows `.exe` con server LAN domestico integrato (MIT).
- **Vite, Vitest & TypeScript** — Tooling di sviluppo e 40 test unitari automatizzati (MIT / Apache-2.0).
