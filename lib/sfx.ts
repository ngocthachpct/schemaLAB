/**
 * Tiny WebAudio helpers — no audio files needed (0 cost, spec section 2).
 * Only plays transform-of-state style cues; must not spam AudioContext nodes.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

type SoundKind = "pour" | "reveal" | "unlock";

export function playSound(kind: SoundKind, enabled: boolean): void {
  if (!enabled) return;
  const ac = getCtx();
  if (!ac) return;

  const now = ac.currentTime;
  if (kind === "pour") {
    // Soft filtered noise for ~0.9s
    const dur = 0.9;
    const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (0.25 - (i / data.length) * 0.2);
    }
    const src = ac.createBufferSource();
    src.buffer = buf;
    const filter = ac.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(500, now);
    filter.frequency.linearRampToValueAtTime(900, now + dur);
    filter.Q.value = 6;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0, now + dur);
    src.connect(filter).connect(gain).connect(ac.destination);
    src.start(now);
  } else {
    // A gentle two-note chime, lower for reveal, brighter for unlock
    const freqs = kind === "unlock" ? [740, 988] : [440, 554];
    freqs.forEach((f, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      const at = now + i * 0.12;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.08, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.25);
      osc.connect(gain).connect(ac.destination);
      osc.start(at);
      osc.stop(at + 0.3);
    });
  }
}
