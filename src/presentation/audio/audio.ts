import { Howl } from 'howler';

export type AudioCategory = 'sfx' | 'ui' | 'ambience';

export interface AudioSettings {
  sfxVolume: number;      // 0 - 100
  uiVolume: number;       // 0 - 100
  ambienceVolume: number; // 0 - 100
  enabled: boolean;
}

class AudioManager {
  private settings: AudioSettings = {
    sfxVolume: 80,
    uiVolume: 70,
    ambienceVolume: 40,
    enabled: true,
  };

  private soundSprite: Howl | null = null;
  private ambience: Howl | null = null;
  private synthCtx: AudioContext | null = null;

  constructor() {
    this.initHowler();
  }

  private initHowler() {
    try {
      this.soundSprite = new Howl({
        src: ['./audio/sprite.webm', './audio/sprite.mp3'],
        sprite: {
          shuffle: [0, 1200],
          deal: [1500, 400],
          play: [2200, 300],
          capture: [2800, 500],
          sweep: [3600, 1800],
          fanfare: [5600, 2500],
          click: [8300, 150],
        },
        volume: this.settings.sfxVolume / 100,
        onloaderror: () => {
          console.warn('Audio sprite failed to load, falling back to Web Audio synth');
          this.initSynth();
        },
      });

      this.ambience = new Howl({
        src: ['./audio/ambience.webm', './audio/ambience.mp3'],
        loop: true,
        volume: this.settings.ambienceVolume / 100,
      });
    } catch {
      this.initSynth();
    }
  }

  private initSynth() {
    if (!this.synthCtx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.synthCtx = new AudioCtx();
      }
    }
  }

  play(sound: 'shuffle' | 'deal' | 'play' | 'capture' | 'sweep' | 'fanfare' | 'click', pan: number = 0) {
    if (!this.settings.enabled) return;

    if (this.soundSprite) {
      try {
        const id = this.soundSprite.play(sound);
        if (id) {
          const clampedPan = Math.max(-1, Math.min(1, pan));
          this.soundSprite.stereo(clampedPan, id);
          const vol = (sound === 'click' ? this.settings.uiVolume : this.settings.sfxVolume) / 100;
          this.soundSprite.volume(vol, id);
        }
        return;
      } catch {
        // Fallback to synth
      }
    }

    this.playSynth(sound);
  }

  private playSynth(sound: string) {
    if (!this.synthCtx || this.synthCtx.state === 'suspended') {
      this.synthCtx?.resume();
    }
    if (!this.synthCtx) return;

    try {
      const now = this.synthCtx.currentTime;
      const osc = this.synthCtx.createOscillator();
      const gain = this.synthCtx.createGain();
      osc.connect(gain);
      gain.connect(this.synthCtx.destination);

      if (sound === 'play' || sound === 'deal') {
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (sound === 'sweep' || sound === 'fanfare') {
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else {
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    } catch {
      // AudioContext unavailable
    }
  }

  startAmbience() {
    if (!this.settings.enabled || this.settings.ambienceVolume <= 0) return;
    if (this.ambience && !this.ambience.playing()) {
      this.ambience.play();
    }
  }

  pauseAmbience() {
    if (this.ambience && this.ambience.playing()) {
      this.ambience.pause();
    }
  }

  setVolumes(sfx: number, ui: number, ambience: number) {
    this.settings.sfxVolume = sfx;
    this.settings.uiVolume = ui;
    this.settings.ambienceVolume = ambience;

    if (this.soundSprite) {
      this.soundSprite.volume(sfx / 100);
    }
    if (this.ambience) {
      this.ambience.volume(ambience / 100);
      if (ambience <= 0) {
        this.ambience.pause();
      } else if (!this.ambience.playing()) {
        this.ambience.play();
      }
    }
  }
}

export const audio = new AudioManager();
