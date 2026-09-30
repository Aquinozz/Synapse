/**
 * Web Audio API synthesized gentle Tibetan singing bowl / chime tones for breathing guidance
 */
class SoundService {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  playChime(type: 'breatheIn' | 'hold' | 'breatheOut' | 'success' | 'click' = 'breatheIn') {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';

      if (type === 'breatheIn') {
        osc.frequency.setValueAtTime(396, now); // Solfeggio frequency for liberation
        osc.frequency.exponentialRampToValueAtTime(528, now + 1.2); // Transformation & miracles
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 2.0);
      } else if (type === 'hold') {
        osc.frequency.setValueAtTime(432, now); // Natural tuning
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 1.2);
      } else if (type === 'breatheOut') {
        osc.frequency.setValueAtTime(528, now);
        osc.frequency.exponentialRampToValueAtTime(396, now + 1.5);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 2.2);
      } else if (type === 'success') {
        // Harmonious chord
        [528, 660, 792].forEach((freq, i) => {
          if (!this.ctx) return;
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = 'triangle';
          o.frequency.setValueAtTime(freq, now + i * 0.1);
          g.gain.setValueAtTime(0.001, now + i * 0.1);
          g.gain.linearRampToValueAtTime(0.08, now + i * 0.1 + 0.05);
          g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.1 + 1.5);
          o.connect(g);
          g.connect(this.ctx.destination);
          o.start(now + i * 0.1);
          o.stop(now + i * 0.1 + 1.5);
        });
      } else if (type === 'click') {
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    } catch {
      // Audio autoplay policy fallback
    }
  }
}

export const sound = new SoundService();
