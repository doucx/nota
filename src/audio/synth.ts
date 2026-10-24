class SynthEngine {
  private ctx: AudioContext | null = null;

  private ensureContext() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public playPitch(midiPitch: number, enabled = true): void {
    if (!enabled) return;
    const ctx = this.ensureContext();
    const freq = 440 * 2 ** ((midiPitch - 69) / 12);
    const now = ctx.currentTime;

    // 低频阈值：< 200Hz 需要补偿（C3=131, A2=110, C2=65 都命中）
    const isLow = freq < 200;
    // C2(65Hz)→约 3.1x；C3(131Hz)→约 1.5x；封顶 4x 防削波
    const boost = isLow ? Math.min(4, 200 / freq) : 1;

    const osc1 = ctx.createOscillator();
    // 低频改用 sawtooth：谐波 1/n，让大脑重建基频
    osc1.type = isLow ? 'sawtooth' : 'triangle';
    osc1.frequency.setValueAtTime(freq, now);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    // 低频用 3f（sawtooth 已有 2f 偶次谐波），中高频仍用 2f
    osc2.frequency.setValueAtTime(freq * (isLow ? 3 : 2), now);

    const osc2Gain = ctx.createGain();
    // 低频时 3f 音量压一点，避免锯齿波形太刺
    osc2Gain.gain.setValueAtTime(isLow ? 0.35 : 1, now);

    const gain = ctx.createGain();
    const base = 0.3;
    const peak = Math.min(0.9, base * boost);
    const decay = isLow ? 1.8 : 1.1;

    // 8ms attack 防 click（exponential 不能从 0 起）
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + decay);

    // 低频 sawtooth 叠加谐波后容易削波，加 compressor 兜底
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-12, now);
    comp.knee.setValueAtTime(12, now);
    comp.ratio.setValueAtTime(4, now);
    comp.attack.setValueAtTime(0.003, now);
    comp.release.setValueAtTime(0.15, now);

    osc1.connect(gain);
    osc2.connect(osc2Gain);
    osc2Gain.connect(gain);
    gain.connect(comp);
    comp.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + decay);
    osc2.stop(now + decay);
  }

  public playError(enabled = true): void {
    if (!enabled) return;
    const ctx = this.ensureContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(90, now + 0.18);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }
}

export const soundEngine = new SynthEngine();
