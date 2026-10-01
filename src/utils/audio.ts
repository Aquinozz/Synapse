/**
 * Web Audio API synthesized gentle Tibetan singing bowl / chime tones for breathing guidance
 */
class SoundService {
  private ctx: AudioContext | null = null;
  private ambient: { gain: GainNode; sources: AudioScheduledSourceNode[] } | null = null;

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

  /** Loops a synthesized ambient soundscape until stopAmbient() is called */
  startAmbient(type: AmbientSound) {
    try {
      this.stopAmbient();
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const ctx = this.ctx;
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.connect(ctx.destination);
      const sources: AudioScheduledSourceNode[] = [];

      if (type === 'binaural') {
        // 200 Hz in one ear and 210 Hz in the other produce a 10 Hz (alpha) beat
        [
          { freq: 200, pan: -1 },
          { freq: 210, pan: 1 },
        ].forEach(({ freq, pan }) => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = freq;
          const panner = ctx.createStereoPanner();
          panner.pan.value = pan;
          osc.connect(panner);
          panner.connect(master);
          osc.start(now);
          sources.push(osc);
        });
        master.gain.exponentialRampToValueAtTime(0.06, now + 1.5);
      } else {
        const noise = ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(ctx, type === 'rain' ? 'pink' : 'brown');
        noise.loop = true;
        const filter = ctx.createBiquadFilter();

        if (type === 'rain') {
          filter.type = 'highpass';
          filter.frequency.value = 400;
          noise.connect(filter);
          filter.connect(master);
          master.gain.exponentialRampToValueAtTime(0.18, now + 1.5);
        } else {
          // Wind: low noise whose brightness and volume drift slowly
          filter.type = 'lowpass';
          filter.frequency.value = 500;
          const gust = ctx.createGain();
          gust.gain.value = 0.7;
          const lfo = ctx.createOscillator();
          lfo.frequency.value = 0.12;
          const lfoDepth = ctx.createGain();
          lfoDepth.gain.value = 0.3;
          const lfoCutoff = ctx.createGain();
          lfoCutoff.gain.value = 250;
          lfo.connect(lfoDepth);
          lfoDepth.connect(gust.gain);
          lfo.connect(lfoCutoff);
          lfoCutoff.connect(filter.frequency);
          noise.connect(filter);
          filter.connect(gust);
          gust.connect(master);
          lfo.start(now);
          sources.push(lfo);
          master.gain.exponentialRampToValueAtTime(0.5, now + 1.5);
        }

        noise.start(now);
        sources.push(noise);
      }

      this.ambient = { gain: master, sources };
    } catch {
      // Audio autoplay policy fallback
    }
  }

  stopAmbient() {
    if (!this.ambient || !this.ctx) return;
    const { gain, sources } = this.ambient;
    this.ambient = null;
    try {
      const now = this.ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      sources.forEach((source) => source.stop(now + 0.45));
    } catch {
      // Already stopped
    }
  }

  private createNoiseBuffer(ctx: AudioContext, color: 'pink' | 'brown') {
    const length = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    if (color === 'brown') {
      let last = 0;
      for (let i = 0; i < length; i++) {
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        data[i] = last * 3.5;
      }
    } else {
      // Paul Kellet's economy pink noise filter
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + white * 0.099046;
        b1 = 0.963 * b1 + white * 0.2965164;
        b2 = 0.57 * b2 + white * 1.0526913;
        data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.2;
      }
    }
    return buffer;
  }
}

export type AmbientSound = 'binaural' | 'rain' | 'forest';

export const sound = new SoundService();
