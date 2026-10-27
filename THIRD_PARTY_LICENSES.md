# Third-Party Licenses & Attributions (Version 1.0.0)

This document acknowledges and credits the third-party software libraries, open-source packages, media assets, and historical references used in **Scopa, Briscola & Solitario Suite v1.0.0**.

---

## 🇬🇧 English: Licenses & Attributions

### 1. Open Source Software Dependencies

#### Three.js
- **Purpose**: 3D WebGL tabletop rendering, directional shadows, and material lighting.
- **License**: MIT License
- **Copyright**: (c) 2010-2024 Three.js Authors
- **URL**: <https://github.com/mrdoob/three.js>

#### Howler.js
- **Purpose**: Cross-browser Web Audio management, sound sprites, and stereo panning.
- **License**: MIT License
- **Copyright**: (c) 2013-2024 James Simpson and GoldFire Studios, Inc.
- **URL**: <https://github.com/goldfire/howler.js>

#### Electron & Electron-Builder
- **Purpose**: Standalone desktop native packaging for Microsoft Windows.
- **License**: MIT License
- **Copyright**: (c) Electron contributors / loopline systems
- **URL**: <https://github.com/electron/electron>

#### Vite
- **Purpose**: Next-generation frontend tooling and bundler.
- **License**: MIT License
- **Copyright**: (c) 2019-present Evan You & Vite Contributors
- **URL**: <https://github.com/vitejs/vite>

#### Vitest
- **Purpose**: Unit testing framework with TypeScript execution.
- **License**: MIT License
- **Copyright**: (c) 2021-present Anthony Fu and Vitest contributors
- **URL**: <https://github.com/vitest-dev/vitest>

---

### 2. Graphic & Media Assets

#### Regional Card Decks (Napoletane, Piacentine, Bresciane, Romagnole, Trevisane, Bergamasche, Triestine)
- **Carte Napoletane (`public/cards/napoletane/*.webp`)**: Scanned historic public-domain playing cards from Wikimedia Commons / open sources (<https://github.com/rvenning/scopa>).
- **Carte Piacentine (`public/cards/piacentine/*.webp`)**: High-resolution 320x528 WebP assets from `nico33t/briscola` (Nicola Castellaneta, <https://github.com/nico33t/briscola>) and Wikimedia Commons (`File:Carte piacentine al completo.jpg`).
- **Carte Bresciane, Romagnole & Trevisane (`public/cards/bresciane/`, `romagnole/`, `trevisane/`)**: Traditional regional decks sourced from <https://github.com/diegoami/Tressette> and <https://github.com/mhamilt/Italian-decks>.
- **Carte Bergamasche (`public/cards/bergamasche/*.webp`)**: Traditional Bergamo regional deck assets from Dan Hough (<https://github.com/goblindegook/scopa>), converted to 320x528 WebP.
- **Carte Triestine (`public/cards/triestine/*.webp`)**: Traditional Trieste regional deck assets from Florjan (<https://github.com/aflorj/briscola>), converted to 320x528 WebP.
- **Carte Fiaba Moderna (`public/cards/fiaba/*.webp`)**: 100% original procedural vector illustrations and rank badges created directly for Scopa Suite.

#### Photographic Table Textures (Felt, Walnut, Marble, Linen)
- **Source**: High-resolution material scans from ambientCG / CC0 Textures.
- **Files**: `public/textures/felt.webp`, `public/textures/walnut.webp`, `public/textures/marble.webp`, `public/textures/linen.webp`.
- **License**: Creative Commons Zero (CC0 1.0 Universal - Public Domain Dedication).
- **URL**: <https://ambientcg.com>

#### Sound Effects & Ambient Audio
- **Source**: Freesound.org and custom synthesized audio recordings.
- **Files**: `public/audio/sprite.mp3`, `public/audio/sprite.webm`, `public/audio/ambience.mp3`, `public/audio/ambience.webm`.
- **License**: Creative Commons Zero (CC0 1.0 Universal) / Public Domain Dedication.
- **Attributions**:
  - Card handling sounds (shuffle, deal, slide, tap) recorded under CC0.
  - Café ambient murmurs licensed under CC0.

---

### 3. Inspirations & Prior Art

- **nico33t/briscola** (Nicola Castellaneta):
  - Online repository: <https://github.com/nico33t/briscola>
  - High-res Piacentine cards and card play animation concepts.
- **diegoami/Tressette**:
  - Online repository: <https://github.com/diegoami/Tressette>
  - Bresciane, Romagnole, and Trevisane decks and Tressette endgame solver concepts.
- **itzrusso10/tressette**:
  - Online repository: <https://github.com/itzrusso10/tressette>
  - 4-player partnership Tressette signals (*Busso*, *Striscio*, *Volo*), *Traversone* (*A Perdere*), and drawn-card reveal ergonomics.
- **goblindegook/scopa** (Dan Hough):
  - Online repository: <https://github.com/goblindegook/scopa>
  - Bergamasche deck and interactive card-capture table ergonomics.
- **aflorj/briscola** (Florjan):
  - Online repository: <https://github.com/aflorj/briscola>
  - Triestine deck and classical trick game mechanics.
- **OMerkel/scopa_marco** (Marco Scarpetta & Oliver Merkel):
  - Online repository: <https://github.com/OMerkel/scopa_marco>
  - Inspirational study of classic Scopa game loop in open-source JavaScript (GPL-3.0 / MIT compatible study).
- **rvenning/scopa** (Richard Venning):
  - Online repository: <https://github.com/rvenning/scopa>
  - Historic Neapolitan card scans, tabletop textures, and regional rules presets.
- **Pagat.com (John McLeod)**:
  - Canonical international reference for authentic Italian card game rules, Primiera values, Briscola points, and regional variants (<https://www.pagat.com>).

---

## 🇮🇹 Italiano: Licenze e Riconoscimenti di Terze Parti

Questo documento elenca le licenze e i riconoscimenti per le librerie software, i progetti open-source, gli asset grafici e i riferimenti storici utilizzati in **Scopa, Briscola & Solitario Suite v1.0.0**.

### 1. Dipendenze Software Open Source
- **Three.js** (Licenza MIT): Rendering 3D WebGL per il tavolo da gioco e illuminazione (<https://github.com/mrdoob/three.js>).
- **Howler.js** (Licenza MIT): Gestione audio multipiattaforma e sprite sonori (<https://github.com/goldfire/howler.js>).
- **Electron & Electron-Builder** (Licenza MIT): Packaging nativo per Windows e server locale integrato (<https://github.com/electron/electron>).
- **Vite & Vitest** (Licenza MIT): Ambiente di compilazione e test unitari automatici (<https://github.com/vitejs/vite>, <https://github.com/vitest-dev/vitest>).

### 2. Asset Grafici e Multimediali
- **Carte Napoletane**: Scansioni storiche di Pubblico Dominio da Wikimedia Commons e archivio open source (<https://github.com/rvenning/scopa>).
- **Carte Piacentine**: Immagini WebP in alta risoluzione (320x528) da `nico33t/briscola` (<https://github.com/nico33t/briscola>) e Wikimedia Commons.
- **Carte Bergamasche**: Mazzo tradizionale lombardo convertito in WebP da Dan Hough (<https://github.com/goblindegook/scopa>).
- **Carte Triestine**: Mazzo tradizionale giuliano convertito in WebP da Florjan (<https://github.com/aflorj/briscola>).
- **Carte Fiaba Moderna**: Grafica originale vettoriale procedurale creata appositamente per la suite.
- **Texture dei Tavoli**: Texture fotografiche CC0 da ambientCG (<https://ambientcg.com>).
- **Effetti Sonori**: Campionamenti acustici da Freesound.org rilasciati con licenza CC0 / Pubblico Dominio.

### 3. Fonti di Ispirazione e Riferimenti Ufficiali
- **nico33t/briscola** (Nicola Castellaneta): <https://github.com/nico33t/briscola>
- **diegoami/Tressette**: <https://github.com/diegoami/Tressette>
- **itzrusso10/tressette**: <https://github.com/itzrusso10/tressette>
- **goblindegook/scopa** (Dan Hough): <https://github.com/goblindegook/scopa>
- **aflorj/briscola** (Florjan): <https://github.com/aflorj/briscola>
- **OMerkel/scopa_marco** (Marco Scarpetta & Oliver Merkel): <https://github.com/OMerkel/scopa_marco>
- **rvenning/scopa** (Richard Venning): <https://github.com/rvenning/scopa>
- **Pagat.com (John McLeod)**: <https://www.pagat.com> (Enciclopedia internazionale delle regole tradizionali dei giochi di carte).
