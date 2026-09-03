export class AudioManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgmOscillator: OscillatorNode | null = null;
  private bgmGain: GainNode | null = null;
  private bgmInterval: number | null = null;

  constructor() {
    this.isMuted = localStorage.getItem('uno_muted') === 'true';
  }

  public init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('uno_muted', this.isMuted.toString());
    
    if (this.isMuted) {
      this.stopBGM();
    } else {
      // We don't auto-resume BGM, but subsequent sound effects will play.
    }
    return this.isMuted;
  }

  public getMuted() {
    return this.isMuted;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, vol = 0.1) {
    if (this.isMuted || !this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  public playDrawCard() {
    this.playTone(300, 'sine', 0.1, 0.1);
    setTimeout(() => this.playTone(400, 'sine', 0.1, 0.1), 100);
  }

  public playPlayCard() {
    this.playTone(600, 'triangle', 0.15, 0.15);
  }

  public playActionCard() {
    this.playTone(800, 'square', 0.1, 0.1);
    setTimeout(() => this.playTone(1000, 'square', 0.2, 0.1), 100);
  }

  public playWildCard() {
    this.playTone(400, 'sawtooth', 0.1, 0.1);
    setTimeout(() => this.playTone(500, 'sawtooth', 0.1, 0.1), 100);
    setTimeout(() => this.playTone(600, 'sawtooth', 0.2, 0.1), 200);
  }

  public playWin() {
    if (this.isMuted || !this.ctx) return;
    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5 (A Major arpeggio)
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'square', 0.3, 0.15), i * 150);
    });
  }

  public playLose() {
    if (this.isMuted || !this.ctx) return;
    const notes = [300, 250, 200, 150];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'sawtooth', 0.3, 0.15), i * 200);
    });
  }

  public playUnoVoice() {
    if (this.isMuted) return;
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance("UNO!");
      utterance.pitch = 1.5;
      utterance.rate = 1.2;
      window.speechSynthesis.speak(utterance);
    } else {
      this.playTone(800, 'square', 0.5, 0.2);
    }
  }

  public startBGM() {
    if (this.isMuted || !this.ctx) return;
    if (this.bgmOscillator) return;

    // We'll create a looping sequence using a slightly more complex synth approach
    this.bgmOscillator = this.ctx.createOscillator();
    this.bgmGain = this.ctx.createGain();
    
    // Instead of a single drone, we'll use a sequence interval. 
    // We attach it to `window` for simple interval clearing.
    let step = 0;
    const melody = [
      { note: 523.25, time: 0.2 }, // C5
      { note: 659.25, time: 0.2 }, // E5
      { note: 783.99, time: 0.4 }, // G5
      { note: 659.25, time: 0.2 }, // E5
      { note: 880.00, time: 0.4 }, // A5
      { note: 783.99, time: 0.4 }, // G5
    ];

    const playStep = () => {
      if (!this.ctx || this.isMuted) return;
      const { note, time } = melody[step % melody.length];
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note, this.ctx.currentTime);
      
      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + time - 0.05);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + time);
      
      step++;
    };

    this.bgmInterval = setInterval(playStep, 300) as unknown as number;
  }

  public stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const audioManager = new AudioManager();
