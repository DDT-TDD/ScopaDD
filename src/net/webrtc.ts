export type WebRTCSessionStatus =
  | 'idle'
  | 'creating-offer'
  | 'waiting-for-answer'
  | 'creating-answer'
  | 'connecting'
  | 'connected'
  | 'disconnected';

export interface WebRTCSessionCallbacks {
  onStatusChange: (status: WebRTCSessionStatus, role: 'host' | 'guest') => void;
  onMessage: (data: string) => void;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

async function compressSdp(desc: RTCSessionDescriptionInit): Promise<string> {
  const payload = JSON.stringify({ t: desc.type === 'offer' ? 'o' : 'a', s: desc.sdp });
  try {
    if (typeof CompressionStream !== 'undefined') {
      const stream = new Blob([payload]).stream().pipeThrough(new CompressionStream('deflate'));
      const buf = await new Response(stream).arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      return 'Z1:' + btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
  } catch {
    // Fallback to plain base64
  }
  return 'B0:' + btoa(encodeURIComponent(payload));
}

async function decompressSdp(code: string): Promise<RTCSessionDescriptionInit> {
  const trimmed = code.trim();
  if (trimmed.startsWith('Z1:')) {
    const b64 = trimmed.slice(3).replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64 + '==='.slice((b64.length + 3) % 4);
    const binary = atob(pad);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
    const text = await new Response(stream).text();
    const parsed = JSON.parse(text);
    return { type: parsed.t === 'o' ? 'offer' : 'answer', sdp: parsed.s };
  }
  const rawB64 = trimmed.startsWith('B0:') ? trimmed.slice(3) : trimmed;
  const parsed = JSON.parse(decodeURIComponent(atob(rawB64)));
  return { type: parsed.t === 'o' ? 'offer' : 'answer', sdp: parsed.s };
}

function waitForIceGathering(pc: RTCPeerConnection, timeoutMs: number = 3500): Promise<void> {
  if (pc.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise<void>((resolve) => {
    const timer = window.setTimeout(() => {
      pc.removeEventListener('icegatheringstatechange', check);
      resolve();
    }, timeoutMs);
    function check() {
      if (pc.iceGatheringState === 'complete') {
        window.clearTimeout(timer);
        pc.removeEventListener('icegatheringstatechange', check);
        resolve();
      }
    }
    pc.addEventListener('icegatheringstatechange', check);
  });
}

export class WebRTCSession {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private role: 'host' | 'guest' = 'host';
  private status: WebRTCSessionStatus = 'idle';
  private callbacks: WebRTCSessionCallbacks;

  constructor(callbacks: WebRTCSessionCallbacks) {
    this.callbacks = callbacks;
  }

  public getStatus(): WebRTCSessionStatus {
    return this.status;
  }

  public getRole(): 'host' | 'guest' {
    return this.role;
  }

  private setStatus(next: WebRTCSessionStatus) {
    this.status = next;
    this.callbacks.onStatusChange(next, this.role);
  }

  private setupDataChannel(channel: RTCDataChannel) {
    this.dc = channel;
    channel.onopen = () => {
      this.setStatus('connected');
    };
    channel.onclose = () => {
      this.setStatus('disconnected');
    };
    channel.onerror = () => {
      if (this.status !== 'connected') {
        this.setStatus('disconnected');
      }
    };
    channel.onmessage = (ev) => {
      if (typeof ev.data === 'string') {
        this.callbacks.onMessage(ev.data);
      }
    };
  }

  /**
   * Step 1 (Host - Seat 0): Creates a P2P Offer code to share with Player 2.
   */
  public async createHostOffer(): Promise<string> {
    this.close();
    this.role = 'host';
    this.setStatus('creating-offer');

    const pc = new RTCPeerConnection(RTC_CONFIG);
    this.pc = pc;

    const channel = pc.createDataChannel('scopa-p2p', { ordered: true });
    this.setupDataChannel(channel);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await waitForIceGathering(pc, 3500);

    const localDesc = pc.localDescription;
    if (!localDesc) throw new Error('Failed to gather local SDP offer');

    const code = await compressSdp(localDesc);
    this.setStatus('waiting-for-answer');
    return code;
  }

  /**
   * Step 2 (Guest - Seat 1): Accepts the Host's Offer code and generates an Answer code to send back.
   */
  public async acceptOfferAndCreateAnswer(offerCode: string): Promise<string> {
    this.close();
    this.role = 'guest';
    this.setStatus('creating-answer');

    const offerDesc = await decompressSdp(offerCode);
    if (offerDesc.type !== 'offer') {
      throw new Error('Expected an Offer code from Player 1 (Host)');
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    this.pc = pc;

    pc.ondatachannel = (ev) => {
      this.setupDataChannel(ev.channel);
    };

    await pc.setRemoteDescription(offerDesc);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await waitForIceGathering(pc, 3500);

    const localDesc = pc.localDescription;
    if (!localDesc) throw new Error('Failed to gather local SDP answer');

    const answerCode = await compressSdp(localDesc);
    this.setStatus('connecting');
    return answerCode;
  }

  /**
   * Step 3 (Host - Seat 0): Pastes the Guest's Answer code to finalize the P2P connection.
   */
  public async acceptGuestAnswer(answerCode: string): Promise<void> {
    if (!this.pc) {
      throw new Error('Create a Host Offer first before pasting an Answer code');
    }
    const answerDesc = await decompressSdp(answerCode);
    if (answerDesc.type !== 'answer') {
      throw new Error('Expected an Answer code from Player 2 (Guest)');
    }
    this.setStatus('connecting');
    await this.pc.setRemoteDescription(answerDesc);
  }

  public send(data: string): boolean {
    if (this.dc && this.dc.readyState === 'open') {
      this.dc.send(data);
      return true;
    }
    return false;
  }

  public close() {
    if (this.dc) {
      try {
        this.dc.close();
      } catch {
        // ignore
      }
      this.dc = null;
    }
    if (this.pc) {
      try {
        this.pc.close();
      } catch {
        // ignore
      }
      this.pc = null;
    }
    this.status = 'idle';
  }
}
