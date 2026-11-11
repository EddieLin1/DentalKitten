// ---------- Meows, synthesised with the Web Audio API (no audio files) ----------
// Each mew is a pitch contour (start → peak → end) shaped by a "mouth" filter that
// sweeps m → ee → oo ("mew"). Extra knobs: vibrato (vib/vibDepth) and purr-like trill.
// Kitten mews are high, short and soft, so pitches are ~800–1800 Hz and under ~0.5s.
const MEOWS = [
  { name: "classic mew",  start: 1000, peak: 1300, end: 900,  dur: .30, peakAt: .35 },
  { name: "tiny squeak",  start: 1400, peak: 1700, end: 1500, dur: .15, peakAt: .4 },
  { name: "long mew",     start: 900,  peak: 1200, end: 800,  dur: .50, peakAt: .3,  vib: 7,  vibDepth: 20 },
  { name: "question",     start: 950,  peak: 1050, end: 1400, dur: .30, peakAt: .3 },
  { name: "sad",          start: 1250, peak: 1280, end: 850,  dur: .45, peakAt: .1 },
  { name: "mrrp",         start: 800,  peak: 1000, end: 950,  dur: .28, peakAt: .6,  trill: 30 },
  { name: "itty bitty",   start: 1600, peak: 1800, end: 1550, dur: .12, peakAt: .5 },
  { name: "low mew",      start: 700,  peak: 900,  end: 650,  dur: .35, peakAt: .4 },
  { name: "chirp",        start: 1200, peak: 1700, end: 1500, dur: .12, peakAt: .7 },
  { name: "wobbly",       start: 1050, peak: 1300, end: 1000, dur: .45, peakAt: .4,  vib: 10, vibDepth: 40 },
  { name: "needy",        start: 1100, peak: 1450, end: 1000, dur: .30, peakAt: .25 },
  { name: "sleepy",       start: 950,  peak: 1100, end: 750,  dur: .55, peakAt: .5,  vib: 4,  vibDepth: 12 },
  { name: "trill up",     start: 900,  peak: 1250, end: 1250, dur: .30, peakAt: .7,  trill: 26 },
  { name: "squeaky",      start: 1350, peak: 1650, end: 1200, dur: .40, peakAt: .3 },
  { name: "short mew",    start: 1150, peak: 1300, end: 1150, dur: .16, peakAt: .5 },
  { name: "soft mew",     start: 850,  peak: 1050, end: 800,  dur: .30, peakAt: .2 },
  { name: "excited",      start: 1200, peak: 1600, end: 1350, dur: .25, peakAt: .5,  vib: 13, vibDepth: 35 },
  { name: "whiny",        start: 1000, peak: 1150, end: 900,  dur: .50, peakAt: .6 },
  { name: "tiny trill",   start: 1350, peak: 1550, end: 1450, dur: .22, peakAt: .5,  trill: 32 },
  { name: "hello",        start: 950,  peak: 1400, end: 1100, dur: .30, peakAt: .45 },
];

let audio;
let lastMeow = -1;

function playMeow(m) {
  audio ??= new (window.AudioContext || window.webkitAudioContext)();
  if (audio.state === "suspended") audio.resume();

  const t = audio.currentTime + 0.01;
  const d = m.dur;
  const k = Math.min(1.25, Math.max(0.85, m.peak / 1300)); // smaller kitten = higher "mouth"

  // Voice
  const osc = audio.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(m.start, t);
  osc.frequency.linearRampToValueAtTime(m.peak, t + d * m.peakAt);
  osc.frequency.exponentialRampToValueAtTime(m.end, t + d);

  const extras = [];
  if (m.vib) {                                       // vibrato
    const lfo = audio.createOscillator();
    const depth = audio.createGain();
    lfo.frequency.value = m.vib;
    depth.gain.value = m.vibDepth;
    lfo.connect(depth).connect(osc.frequency);
    extras.push(lfo);
  }

  // Mouth: two formant filters sweeping m → ee → oo ("mew"). The mouth stays fairly
  // closed (low F1) so it never opens into a long "ow", plus a little soft body.
  const f1 = audio.createBiquadFilter();
  const f2 = audio.createBiquadFilter();
  const body = audio.createBiquadFilter();
  f1.type = f2.type = "bandpass";
  f1.Q.value = 5;
  f2.Q.value = 7;
  body.type = "lowpass";
  body.frequency.value = 2000;

  f1.frequency.setValueAtTime(300 * k, t);
  f1.frequency.linearRampToValueAtTime(520 * k, t + d * .3);
  f1.frequency.linearRampToValueAtTime(380 * k, t + d);
  f2.frequency.setValueAtTime(2700 * k, t);
  f2.frequency.linearRampToValueAtTime(2200 * k, t + d * .35);
  f2.frequency.linearRampToValueAtTime(1300 * k, t + d);

  const g1 = audio.createGain();   g1.gain.value = .8;
  const g2 = audio.createGain();   g2.gain.value = .9;
  const gb = audio.createGain();   gb.gain.value = .25;

  // Trill (rolling "mrrrp")
  const am = audio.createGain();
  am.gain.value = 1;
  if (m.trill) {
    am.gain.value = .6;
    const lfo = audio.createOscillator();
    const depth = audio.createGain();
    lfo.frequency.value = m.trill;
    depth.gain.value = .4;
    lfo.connect(depth).connect(am.gain);
    extras.push(lfo);
  }

  // Volume envelope: soft "m" onset, then a gentle fade
  const env = audio.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(0.5, t + Math.min(.05, d * .35));
  env.gain.setValueAtTime(0.5, t + d * .55);
  env.gain.exponentialRampToValueAtTime(0.0001, t + d);

  // Take the buzzy edge off so it sounds soft and kitten-like
  const soften = audio.createBiquadFilter();
  soften.type = "lowpass";
  soften.frequency.value = 3800;

  const master = audio.createGain();
  master.gain.value = 0.7;

  osc.connect(f1).connect(g1).connect(am);
  osc.connect(f2).connect(g2).connect(am);
  osc.connect(body).connect(gb).connect(am);
  am.connect(env).connect(soften).connect(master).connect(audio.destination);

  [osc, ...extras].forEach((node) => { node.start(t); node.stop(t + d + .05); });
}

// Pick a random meow, never the same one twice in a row
function playRandomMeow() {
  let i;
  do { i = Math.floor(Math.random() * MEOWS.length); } while (i === lastMeow);
  lastMeow = i;
  playMeow(MEOWS[i]);
}
