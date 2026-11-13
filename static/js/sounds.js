// ---------- Sounds ----------
// Real kitten meows (recorded clips, all levelled to the same loudness) plus the
// synthesised trash "crumple + clunk" for deleting.
// The purr (3 purrs in one clip) is in the same random pool as the meows.
const MEOW_FILES = [
  ...["01", "02", "03", "04", "05", "06", "07"].map((n) => `meows/calling-${n}`),
  ...["01", "02", "03", "04", "05", "06", "07"].map((n) => `meows/stray-${n}`),
  ...["01", "02", "03", "04"].map((n) => `meows/dragon-${n}`),
  "meows/garage-01",
  "purr",
];
// Played through Web Audio rather than <audio> tags: Safari (iPad/iPhone) ignores preloading for
// <audio> and drops clips that get interrupted, which left some clicks silent. Every clip is
// downloaded and decoded up front, so it plays instantly, and overlapping sounds are fine.
// The context starts paused until the first click (browser autoplay rules); playRandomMeow resumes it.
// On iPad/iPhone, Web Audio is muted by silent mode unless the page says it plays media
// like a video does (Safari 16.4+; other browsers don't have navigator.audioSession).
if (navigator.audioSession) navigator.audioSession.type = "playback";
let audio = new (window.AudioContext || window.webkitAudioContext)();
// Every sound goes through this, so the mute button can silence them all at once
const master = audio.createGain();
master.connect(audio.destination);

const MUTE_KEY = "dentalKitten.muted";
let muted = false;
try { muted = localStorage.getItem(MUTE_KEY) === "1"; } catch { /* storage blocked */ }
master.gain.value = muted ? 0 : 1;

function setMuted(on) {
  muted = on;
  master.gain.value = on ? 0 : 1;
  try { localStorage.setItem(MUTE_KEY, on ? "1" : "0"); } catch { /* fine */ }
}
const meowBuffers = new Array(MEOW_FILES.length).fill(null);   // null until downloaded + decoded
MEOW_FILES.forEach((name, i) => {
  fetch(`/static/audio/${name}.mp3`)
    .then((res) => res.arrayBuffer())
    .then((data) => audio.decodeAudioData(data))
    .then((buffer) => { meowBuffers[i] = buffer; })
    .catch(() => { /* leave it out of the pool */ });
});

// Playback volume (1 = as recorded). The purr measures as loud as the meows, but as a 3-second
// rumble it sounds louder, so it gets turned down further to match them by ear.
const MEOW_VOLUME = 0.35;
const PURR_VOLUME = 0.2;

let lastMeow = -1;

// Pick a random meow (or the purr), never the same one twice in a row.
// Only clips that are ready are picked, so a click never lands on a silent one.
function playRandomMeow() {
  if (audio.state !== "running") audio.resume();
  const ready = meowBuffers.flatMap((buffer, i) => (buffer && i !== lastMeow ? [i] : []));
  if (!ready.length) return;
  const i = ready[Math.floor(Math.random() * ready.length)];
  lastMeow = i;
  const source = audio.createBufferSource();
  source.buffer = meowBuffers[i];
  const volume = audio.createGain();
  volume.gain.value = MEOW_FILES[i] === "purr" ? PURR_VOLUME : MEOW_VOLUME;
  source.connect(volume).connect(master);
  source.start();
}

// ---------- Trash sound: paper crumple, then a lid clunk ----------
function crumpleBuffer(ac, dur) {
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  let env = 0;
  for (let i = 0; i < len; i++) {
    if (Math.random() < 0.0025) env = 0.4 + Math.random() * 0.6;   // a new crackle
    env *= 0.9975;                                                  // each crackle dies fast
    data[i] = (Math.random() * 2 - 1) * env;
  }
  return buf;
}

function playTrashSound() {
  if (audio.state !== "running") audio.resume();
  const t = audio.currentTime + 0.01;

  // 1. Crumple
  const crumple = audio.createBufferSource();
  crumple.buffer = crumpleBuffer(audio, 0.28);
  const rustle = audio.createBiquadFilter();
  rustle.type = "bandpass";
  rustle.frequency.value = 2200;
  rustle.Q.value = 0.7;
  const cg = audio.createGain();
  cg.gain.setValueAtTime(0.7, t);
  cg.gain.linearRampToValueAtTime(0.0001, t + 0.28);
  crumple.connect(rustle).connect(cg).connect(master);
  crumple.start(t);

  // 2. Lid clunk: a low thud plus a short metal ping
  const tc = t + 0.24;
  const thud = audio.createOscillator();
  thud.frequency.setValueAtTime(160, tc);
  thud.frequency.exponentialRampToValueAtTime(55, tc + 0.15);
  const tg = audio.createGain();
  tg.gain.setValueAtTime(0.0001, tc);
  tg.gain.exponentialRampToValueAtTime(0.35, tc + 0.005);
  tg.gain.exponentialRampToValueAtTime(0.0001, tc + 0.18);
  thud.connect(tg).connect(master);
  thud.start(tc);
  thud.stop(tc + 0.2);

  const ping = audio.createOscillator();
  ping.type = "triangle";
  ping.frequency.value = 1250;
  const pg = audio.createGain();
  pg.gain.setValueAtTime(0.0001, tc);
  pg.gain.exponentialRampToValueAtTime(0.2, tc + 0.004);
  pg.gain.exponentialRampToValueAtTime(0.0001, tc + 0.12);
  ping.connect(pg).connect(master);
  ping.start(tc);
  ping.stop(tc + 0.14);
}
