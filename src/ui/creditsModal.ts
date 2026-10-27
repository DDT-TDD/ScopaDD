import { getLang } from '../content/i18n';

export class CreditsModal {
  public el: HTMLElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'modal-backdrop hidden';
    this.render();
  }

  render() {
    const isIt = getLang() === 'it';
    this.el.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'modal-card credits-card';

    card.innerHTML = `
      <div class="modal-header">
        <h2>${isIt ? 'ℹ️ Riconoscimenti, Licenze & Versione 1.0.0' : 'ℹ️ Credits, Licenses & Version 1.0.0'}</h2>
        <button class="btn-close" aria-label="Chiudi">✕</button>
      </div>

      <div class="credits-body">
        <div class="credit-section" style="border-color: rgba(245, 158, 11, 0.45); background: rgba(245, 158, 11, 0.08);">
          <h4>🏷️ Scopa, Briscola, Tressette & Solitario Suite — Version 1.0.0 (Stable Release)</h4>
          <p style="font-size: 0.85rem; color: #e2e8f0; line-height: 1.5;">
            ${
              isIt
                ? 'Edizione 1.0.0 — Sicura al 100% per bambini, nonni e famiglie (Zero pubblicità, Zero tracciamento, Server Wi-Fi domestico integrato, WebRTC P2P e 8 mazzi regionali).'
                : 'Release 1.0.0 — 100% safe for kids, grandparents, and families (Zero ads, Zero telemetry, built-in Home Wi-Fi server, WebRTC P2P, and 8 regional decks).'
            }
          </p>
        </div>

        <p class="credits-intro">
          ${
            isIt
              ? 'Questo progetto nasce per celebrare e preservare i tradizionali giochi di carte italiani (Scopa, Briscola, Tressette e Solitario), offrendo una grafica 3D curata, 8 mazzi regionali autentici e un ambiente sicuro e giocabile per bambini, nonni e famiglie.'
              : 'This project celebrates traditional Italian card games (Scopa, Briscola, Tressette, and Solitaire), offering tactile 3D graphics, 8 authentic regional decks, and a safe, family-friendly environment for kids and grandparents.'
          }
        </p>

        <div class="credit-section">
          <h4>${isIt ? 'Mazzi Regionali e Progetti Open Source' : 'Regional Decks & Open Source Projects'}</h4>
          <ul>
            <li><b>Carte Napoletane:</b> Scansioni storiche ad alta risoluzione da Wikimedia Commons e archivio open source (rvenning/scopa).</li>
            <li><b>nico33t/briscola</b> (Nicola Castellaneta) — Mazzo <b>Carte Piacentine</b> in WebP e coreografia di Briscola.</li>
            <li><b>diegoami/Tressette</b> & <b>mhamilt/Italian-decks</b> — Mazzi regionali <b>Carte Bresciane</b>, <b>Carte Romagnole</b> e <b>Carte Trevisane</b>, più ispirazione per il solutore di finale del Tressette.</li>
            <li><b>itzrusso10/tressette</b> — Ispirazione per i segnali di coppia (Busso, Striscio, Volo), pescata scoperta e Tressette a Perdere (Traversone).</li>
            <li><b>goblindegook/scopa</b> (Dan Hough) — Mazzo tradizionale <b>Carte Bergamasche</b> e selezione interattiva delle prese.</li>
            <li><b>aflorj/briscola</b> (Florjan) — Mazzo tradizionale <b>Carte Triestine</b> e dinamiche classiche di Briscola.</li>
            <li><b>OMerkel/scopa_marco</b> & <b>rvenning/scopa</b> — Ispirazioni storiche per le varianti regionali di Scopa.</li>
          </ul>
        </div>

        <div class="credit-section">
          <h4>${isIt ? 'Regole Ufficiali e Tradizione' : 'Official Rules & Tradition'}</h4>
          <ul>
            <li><b>John McLeod (Pagat.com)</b> — Enciclopedia mondiale per le regole di Scopa, Scopone, Briscola, Asso Piglia Tutto e Cirulla.</li>
            <li><b>Modiano S.r.l. & Dal Negro</b> — Storiche manifatture italiane custodi delle tradizioni regionali delle carte.</li>
          </ul>
        </div>

        <div class="credit-section">
          <h4>${isIt ? 'Grafica 3D, Tavoli Festivi e Audio' : '3D Graphics, Festive Tables & Audio'}</h4>
          <ul>
            <li><b>Tavoli e Atmosfere:</b> Superfici fotografiche CC0 (Noce, Panno Verde, Marmo, Notte) e temi festivi (Halloween, Natale, Regno dei Bimbi).</li>
            <li><b>Audio:</b> Effetti sonori di carte e prese sotto licenza CC0.</li>
          </ul>
        </div>
      </div>
    `;

    card.querySelector('.btn-close')?.addEventListener('click', () => this.hide());
    this.el.appendChild(card);
  }

  show() {
    this.render();
    this.el.classList.remove('hidden');
  }

  hide() {
    this.el.classList.add('hidden');
  }
}
