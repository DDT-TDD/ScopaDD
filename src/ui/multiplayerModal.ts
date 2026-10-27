import { audio } from '../presentation/audio/audio';
import { getLang, t } from '../content/i18n';
import type { WebRTCSessionStatus } from '../net/webrtc';

export interface MultiplayerModalCallbacks {
  onStartPassAndPlay: () => void;
  onStartLanRoom: (roomCode: string, isHost: boolean, hostIp?: string) => void;
  onCreateOnlineOffer: () => Promise<string>;
  onAcceptOnlineOffer: (offerCode: string) => Promise<string>;
  onAcceptOnlineAnswer: (answerCode: string) => Promise<void>;
  onExportInviteCode: () => string;
  onImportInviteCode: (code: string) => boolean;
}

const EASY_WORDS = ['SOLE', 'LUNA', 'MARE', 'ROSA', 'LUPO', 'VINO', 'ORSO', 'FARO'];

export class MultiplayerModal {
  public el: HTMLElement;
  private cardEl: HTMLElement;
  private callbacks: MultiplayerModalCallbacks;
  private selectedWord: string = 'SOLE';
  private customHostIp: string = '';
  private lanIps: string[] = [];
  private lanPort: number = 8135;

  // WebRTC P2P state
  private p2pRole: 'host' | 'guest' = 'host';
  private generatedOfferCode: string = '';
  private generatedAnswerCode: string = '';
  private p2pFeedback: string = '';

  constructor(callbacks: MultiplayerModalCallbacks) {
    this.callbacks = callbacks;
    this.el = document.createElement('div');
    this.el.className = 'modal-backdrop hidden';

    // Persistent card container so scrollTop is preserved across updates
    this.cardEl = document.createElement('div');
    this.cardEl.className = 'modal-card wizard-card mp-modal-card';
    this.el.appendChild(this.cardEl);
  }

  public show(focusSection?: 'lan' | 'online') {
    this.el.classList.remove('hidden');
    this.fetchLanInfo();
    this.render(true);

    if (focusSection) {
      setTimeout(() => {
        const target = this.cardEl.querySelector(`[data-mp-section="${focusSection}"]`);
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  }

  public hide() {
    this.el.classList.add('hidden');
  }

  public updateP2PStatus(status: WebRTCSessionStatus, role: 'host' | 'guest') {
    this.p2pRole = role;
    if (status === 'connected') {
      const isIt = getLang() === 'it';
      this.p2pFeedback = isIt
        ? '🟢 Connessione P2P attiva! La partita inizia ora.'
        : '🟢 P2P Connected! Starting live match now.';
      setTimeout(() => {
        this.hide();
      }, 750);
    }
    if (!this.el.classList.contains('hidden')) {
      this.render(false);
    }
  }

  private async fetchLanInfo() {
    try {
      const host = window.location.hostname || '127.0.0.1';
      const resp = await fetch(`http://${host}:8135/api/lan-info`);
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data.ips) && data.ips.length > 0) {
          this.lanIps = data.ips;
          this.lanPort = data.port || 8135;
          if (!this.customHostIp) {
            this.customHostIp = this.lanIps[0];
          }
          if (!this.el.classList.contains('hidden')) {
            this.render(false);
          }
        }
      }
    } catch {
      // Fallback if running in pure browser mode
    }
  }

  private render(resetScroll: boolean = false) {
    const tr = t();
    const isIt = getLang() === 'it';
    const savedScrollTop = resetScroll ? 0 : this.cardEl.scrollTop;

    if (!resetScroll) {
      this.cardEl.style.animation = 'none';
    } else {
      this.cardEl.style.animation = '';
    }

    const primaryIp = this.lanIps[0] || window.location.hostname || '192.168.1.x';
    const joinUrl = `http://${primaryIp}:${this.lanPort}/?room=${this.selectedWord}`;

    this.cardEl.innerHTML = `
      <div class="modal-header-row">
        <h2>${tr.mp.title}</h2>
        <button type="button" class="btn-icon close-mp-btn" title="${tr.cancel}">✕</button>
      </div>
      <p class="mp-subtitle">${tr.mp.subtitle}</p>

      <div class="mp-cards-grid">
        <!-- 1. PASS & PLAY (SAME SCREEN) -->
        <div class="mp-card" data-mp-section="pass">
          <div class="mp-card-header">
            <span class="mp-icon">🤝</span>
            <div>
              <h3>${tr.mp.passAndPlayTitle}</h3>
              <p>${tr.mp.passAndPlayDesc}</p>
            </div>
          </div>
          <button type="button" class="btn-primary mp-action-btn start-pass-play-btn">
            ${tr.mp.startPassAndPlay}
          </button>
        </div>

        <!-- 2. HOME WI-FI / LAN (ZERO CONFIG) -->
        <div class="mp-card" data-mp-section="lan">
          <div class="mp-card-header">
            <span class="mp-icon">🏠</span>
            <div>
              <h3>${tr.mp.lanTitle}</h3>
              <p>${tr.mp.lanDesc}</p>
            </div>
          </div>

          <div class="mp-word-picker">
            <span class="mp-word-label">1. ${tr.mp.roomWordLabel}</span>
            <div class="mp-word-chips">
              ${EASY_WORDS.map(
                (w) => `
                <button type="button" class="word-chip ${
                  this.selectedWord === w ? 'active' : ''
                }" data-word="${w}">
                  ${w}
                </button>
              `
              ).join('')}
            </div>
          </div>

          <div class="mp-lan-url-box">
            <div class="mp-lan-status">${tr.mp.lanActiveStatus} (IP: <b>${primaryIp}</b>)</div>
            <div style="font-size: 0.82rem; color: #cbd5e1; margin: 4px 0;">
              ${
                isIt
                  ? 'Sul 2° dispositivo (telefono, tablet o altro PC in casa) apri questo indirizzo nel browser:'
                  : 'On the 2nd device (phone, tablet, or another PC at home) open this link in any browser:'
              }
            </div>
            <div class="mp-lan-url">🌐 <strong>${joinUrl}</strong></div>
          </div>

          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);">
            <label style="display:block; font-size:0.82rem; color:#fde68a; margin-bottom:6px; font-weight:700;">
              ${
                isIt
                  ? 'Oppure se usi il programma .EXE su due PC diversi in casa, inserisci l’IP del PC che crea il tavolo:'
                  : 'Or if running the .EXE on two different PCs at home, enter the Host PC IP address:'
              }
            </label>
            <div class="mp-invite-row" style="margin-bottom: 10px;">
              <input
                type="text"
                class="mp-code-input lan-ip-input"
                placeholder="${isIt ? 'IP del PC Host (es. 192.168.1.15)' : 'Host PC IP (e.g. 192.168.1.15)'}"
                value="${this.customHostIp || primaryIp}"
              />
            </div>
          </div>

          <div class="mp-lan-actions" style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
            <button type="button" class="btn-primary host-lan-btn">
              🏠 ${isIt ? `Crea Tavolo "${this.selectedWord}" (Giocatore 1)` : `Host Table "${this.selectedWord}" (Player 1)`}
            </button>
            <button type="button" class="btn-secondary join-lan-btn">
              🔗 ${isIt ? `Entra in "${this.selectedWord}" (Giocatore 2)` : `Join "${this.selectedWord}" (Player 2)`}
            </button>
          </div>
        </div>

        <!-- 3. ONLINE P2P (LIVE WEBRTC + SNAPSHOT CODE) -->
        <div class="mp-card" data-mp-section="online">
          <div class="mp-card-header">
            <span class="mp-icon">🌍</span>
            <div>
              <h3>${
                isIt
                  ? 'Gioca Online in Tempo Reale (P2P Diretto senza Server)'
                  : 'Play Live Online (Direct Serverless WebRTC P2P)'
              }</h3>
              <p>${
                isIt
                  ? 'Gioca in diretta a distanza scambiando un codice su WhatsApp, Telegram o Email:'
                  : 'Play live over the internet by exchanging a quick connection code via WhatsApp or Email:'
              }</p>
            </div>
          </div>

          <!-- Role Switcher: Host (Player 1) vs Guest (Player 2) -->
          <div class="diff-row" style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:10px;">
            <button type="button" class="diff-btn ${
              this.p2pRole === 'host' ? 'selected' : ''
            }" data-p2p-role="host">
              👑 ${isIt ? 'Sono il Giocatore 1 (Crea Partita)' : 'I am Player 1 (Create Match)'}
            </button>
            <button type="button" class="diff-btn ${
              this.p2pRole === 'guest' ? 'selected' : ''
            }" data-p2p-role="guest">
              🤝 ${isIt ? 'Sono il Giocatore 2 (Partecipa)' : 'I am Player 2 (Join Match)'}
            </button>
          </div>

          ${
            this.p2pRole === 'host'
              ? `
            <div class="mp-lan-url-box" style="text-align:left;">
              <div style="font-weight:700; color:#fde68a; margin-bottom:6px;">
                ${
                  isIt
                    ? 'Passo 1: Genera il Codice Tavolo e invialo al Giocatore 2'
                    : 'Step 1: Generate Offer Code & send it to Player 2'
                }
              </div>
              <div class="mp-invite-row" style="margin-bottom:10px;">
                <button type="button" class="btn-primary p2p-create-offer-btn">
                  📤 ${isIt ? '1. Genera & Copia Codice Invito (Step 1)' : '1. Generate & Copy Offer Code (Step 1)'}
                </button>
              </div>
              ${
                this.generatedOfferCode
                  ? `
                <div style="margin-bottom:10px;">
                  <input type="text" readonly class="mp-code-input" value="${this.generatedOfferCode}" style="width:100%; font-size:0.78rem;" />
                </div>
              `
                  : ''
              }

              <div style="font-weight:700; color:#fde68a; margin:8px 0 6px;">
                ${
                  isIt
                    ? 'Passo 2: Incolla qui il Codice di Risposta ricevuto dal Giocatore 2'
                    : 'Step 2: Paste the Answer Code received back from Player 2'
                }
              </div>
              <div class="mp-invite-row">
                <input
                  type="text"
                  class="mp-code-input p2p-answer-input"
                  placeholder="${
                    isIt
                      ? 'Incolla qui il codice risposta del Giocatore 2...'
                      : 'Paste Player 2 Answer Code here...'
                  }"
                />
                <button type="button" class="btn-primary p2p-confirm-answer-btn">
                  🚀 ${isIt ? '2. Connetti e Gioca!' : '2. Connect & Play!'}
                </button>
              </div>
            </div>
          `
              : `
            <div class="mp-lan-url-box" style="text-align:left;">
              <div style="font-weight:700; color:#fde68a; margin-bottom:6px;">
                ${
                  isIt
                    ? 'Passo 1: Incolla il Codice ricevuto dal Giocatore 1'
                    : 'Step 1: Paste the Offer Code received from Player 1'
                }
              </div>
              <div class="mp-invite-row" style="margin-bottom:10px;">
                <input
                  type="text"
                  class="mp-code-input p2p-offer-input"
                  placeholder="${
                    isIt
                      ? 'Incolla qui il codice ricevuto dal Giocatore 1...'
                      : 'Paste Player 1 Offer Code here...'
                  }"
                />
                <button type="button" class="btn-primary p2p-accept-offer-btn">
                  🔑 ${isIt ? 'Genera Risposta' : 'Generate Answer'}
                </button>
              </div>

              ${
                this.generatedAnswerCode
                  ? `
                <div style="font-weight:700; color:#4ade80; margin:8px 0 6px;">
                  ${
                    isIt
                      ? '✅ Passo 2: Codice Risposta copiato! Invialo al Giocatore 1 e attendi che clicchi Connetti:'
                      : '✅ Step 2: Answer Code copied! Send it back to Player 1 and wait for connection:'
                  }
                </div>
                <div class="mp-invite-row">
                  <input type="text" readonly class="mp-code-input" value="${this.generatedAnswerCode}" style=" font-size:0.78rem;" />
                  <button type="button" class="btn-secondary p2p-copy-answer-btn">
                    📋 ${isIt ? 'Copia' : 'Copy'}
                  </button>
                </div>
              `
                  : ''
              }
            </div>
          `
          }

          <div class="mp-feedback-msg ${this.p2pFeedback ? '' : 'hidden'}">${this.p2pFeedback}</div>

          <!-- Snapshot Code Fallback -->
          <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1);">
            <div style="font-size:0.82rem; color:#cbd5e1; margin-bottom:6px;">
              📦 ${
                isIt
                  ? 'Condivisione Rapida Stato Partita (Asincrona a turni):'
                  : 'Quick Match Snapshot Code (Turn-by-Turn Share):'
              }
            </div>
            <div class="mp-invite-row">
              <button type="button" class="btn-secondary copy-invite-btn">
                📋 ${tr.mp.copyInviteBtn}
              </button>
              <input
                type="text"
                class="mp-code-input invite-code-input"
                placeholder="${tr.mp.pastePlaceholder}"
              />
              <button type="button" class="btn-secondary import-invite-btn">
                📥 ${tr.mp.connectInviteBtn}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Restore scrollTop immediately
    this.cardEl.scrollTop = savedScrollTop;

    this.cardEl.querySelector('.close-mp-btn')?.addEventListener('click', () => {
      audio.play('click');
      this.hide();
    });

    this.cardEl.querySelector('.start-pass-play-btn')?.addEventListener('click', () => {
      audio.play('click');
      this.hide();
      this.callbacks.onStartPassAndPlay();
    });

    this.cardEl.querySelectorAll('[data-word]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const ipInput = this.cardEl.querySelector('.lan-ip-input') as HTMLInputElement | null;
        if (ipInput) this.customHostIp = ipInput.value.trim();
        this.selectedWord = (btn as HTMLElement).dataset.word || 'SOLE';
        audio.play('click');
        this.render(false);
      });
    });

    this.cardEl.querySelector('.host-lan-btn')?.addEventListener('click', () => {
      audio.play('click');
      const ipInput = this.cardEl.querySelector('.lan-ip-input') as HTMLInputElement | null;
      const hostIp = ipInput?.value.trim() || primaryIp;
      this.hide();
      this.callbacks.onStartLanRoom(this.selectedWord, true, hostIp);
    });

    this.cardEl.querySelector('.join-lan-btn')?.addEventListener('click', () => {
      audio.play('click');
      const ipInput = this.cardEl.querySelector('.lan-ip-input') as HTMLInputElement | null;
      const hostIp = ipInput?.value.trim() || primaryIp;
      this.hide();
      this.callbacks.onStartLanRoom(this.selectedWord, false, hostIp);
    });

    // Online P2P Role Switcher
    this.cardEl.querySelectorAll('[data-p2p-role]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.p2pRole = (btn as HTMLElement).dataset.p2pRole as 'host' | 'guest';
        this.p2pFeedback = '';
        audio.play('click');
        this.render(false);
      });
    });

    // Step 1 Host: Create Offer
    this.cardEl.querySelector('.p2p-create-offer-btn')?.addEventListener('click', async () => {
      audio.play('click');
      this.p2pFeedback = isIt
        ? '⏳ Generazione codice P2P in corso...'
        : '⏳ Generating P2P Offer code...';
      this.render(false);
      try {
        const code = await this.callbacks.onCreateOnlineOffer();
        this.generatedOfferCode = code;
        await navigator.clipboard?.writeText(code).catch(() => {});
        this.p2pFeedback = isIt
          ? '✅ Codice Invito (Step 1) copiato! Invialo al Giocatore 2 e incolla sotto la sua risposta.'
          : '✅ Offer Code (Step 1) copied! Send it to Player 2 and paste their Answer code below.';
      } catch (e) {
        this.p2pFeedback = isIt
          ? '❌ Errore nella generazione del codice P2P.'
          : '❌ Failed to generate P2P offer code.';
      }
      this.render(false);
    });

    // Step 2 Host: Confirm Answer from Guest
    this.cardEl.querySelector('.p2p-confirm-answer-btn')?.addEventListener('click', async () => {
      const input = this.cardEl.querySelector('.p2p-answer-input') as HTMLInputElement | null;
      const code = input?.value.trim() || '';
      if (!code) return;
      audio.play('click');
      try {
        this.p2pFeedback = isIt ? '⏳ Connessione in corso...' : '⏳ Connecting to Player 2...';
        this.render(false);
        await this.callbacks.onAcceptOnlineAnswer(code);
      } catch {
        this.p2pFeedback = isIt
          ? '❌ Codice risposta non valido. Verifica di aver copiato il codice completo.'
          : '❌ Invalid Answer code. Make sure you pasted the full code from Player 2.';
        this.render(false);
      }
    });

    // Step 1 Guest: Accept Offer & Generate Answer
    this.cardEl.querySelector('.p2p-accept-offer-btn')?.addEventListener('click', async () => {
      const input = this.cardEl.querySelector('.p2p-offer-input') as HTMLInputElement | null;
      const offerCode = input?.value.trim() || '';
      if (!offerCode) return;
      audio.play('click');
      this.p2pFeedback = isIt
        ? '⏳ Creazione codice di risposta...'
        : '⏳ Creating Answer code...';
      this.render(false);
      try {
        const answerCode = await this.callbacks.onAcceptOnlineOffer(offerCode);
        this.generatedAnswerCode = answerCode;
        await navigator.clipboard?.writeText(answerCode).catch(() => {});
        this.p2pFeedback = isIt
          ? '✅ Codice Risposta copiato negli appunti! Invialo al Giocatore 1.'
          : '✅ Answer Code copied to clipboard! Send it back to Player 1.';
      } catch {
        this.p2pFeedback = isIt
          ? '❌ Codice invito non valido. Verifica di aver incollato il codice del Giocatore 1.'
          : '❌ Invalid Offer code. Please check the code from Player 1.';
      }
      this.render(false);
    });

    this.cardEl.querySelector('.p2p-copy-answer-btn')?.addEventListener('click', async () => {
      if (!this.generatedAnswerCode) return;
      audio.play('click');
      await navigator.clipboard?.writeText(this.generatedAnswerCode).catch(() => {});
      this.p2pFeedback = tr.mp.copiedSuccess;
      this.render(false);
    });

    // Snapshot Invite Code Copy/Import
    this.cardEl.querySelector('.copy-invite-btn')?.addEventListener('click', async () => {
      audio.play('click');
      const code = this.callbacks.onExportInviteCode();
      try {
        await navigator.clipboard.writeText(code);
      } catch {
        const input = this.cardEl.querySelector('.invite-code-input') as HTMLInputElement | null;
        if (input) {
          input.value = code;
          input.select();
        }
      }
      this.p2pFeedback = tr.mp.copiedSuccess;
      this.render(false);
    });

    this.cardEl.querySelector('.import-invite-btn')?.addEventListener('click', () => {
      const input = this.cardEl.querySelector('.invite-code-input') as HTMLInputElement | null;
      const code = input?.value.trim() || '';
      if (!code) return;
      const ok = this.callbacks.onImportInviteCode(code);
      if (ok) {
        audio.play('shuffle');
        this.hide();
      } else {
        this.p2pFeedback = isIt ? '❌ Codice non valido' : '❌ Invalid invite code';
        this.render(false);
      }
    });
  }
}
