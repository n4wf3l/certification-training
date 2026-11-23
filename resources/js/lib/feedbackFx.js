// Retour sonore et haptique du mode entrainement (correction immediate).
// Sons synthetises avec Web Audio : aucun fichier a charger, rien d'envoye.
// Le son se coupe depuis la barre de l'examen ; le choix reste dans le navigateur.

const KEY = 'certifloop.sound';
let ctx = null;

export function soundEnabled() {
    try { return window.localStorage.getItem(KEY) !== 'off'; } catch { return true; }
}

export function setSoundEnabled(on) {
    try { window.localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* stockage indisponible */ }
}

function audio() {
    if (typeof window === 'undefined') return null;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    if (!ctx) ctx = new Ctor();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
}

// Une note courte avec attaque et extinction douces (pas de clic audible).
function note(ac, freq, at, dur, { type = 'sine', gain = 0.07 } = {}) {
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    amp.gain.setValueAtTime(0.0001, at);
    amp.gain.exponentialRampToValueAtTime(gain, at + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(amp).connect(ac.destination);
    osc.start(at);
    osc.stop(at + dur + 0.02);
}

function play(notes) {
    if (!soundEnabled()) return;
    try {
        const ac = audio();
        if (!ac) return;
        const t0 = ac.currentTime + 0.01;
        notes.forEach(([freq, offset, dur, opts]) => note(ac, freq, t0 + offset, dur, opts));
    } catch { /* audio indisponible : on reste silencieux */ }
}

// Bonne reponse : deux notes montantes (mi, si).
export const playCorrect = () => play([[659.25, 0, 0.12], [987.77, 0.08, 0.18]]);

// Palier de serie (3, 5, 10...) : petit arpege majeur.
export const playCombo = () => play([[659.25, 0, 0.1], [830.61, 0.07, 0.1], [987.77, 0.14, 0.1], [1318.5, 0.21, 0.22]]);

// Mauvaise reponse : note grave et breve, sans agressivite.
export const playWrong = () => play([[233.08, 0, 0.16, { type: 'triangle', gain: 0.09 }], [196, 0.1, 0.2, { type: 'triangle', gain: 0.08 }]]);

// Fin de session : accord ascendant.
export const playFinish = () => play([[523.25, 0, 0.14], [659.25, 0.1, 0.14], [783.99, 0.2, 0.14], [1046.5, 0.3, 0.3]]);

// Vibration courte (Android ; iOS l'ignore). Suit le reglage du son.
export function haptic(pattern) {
    if (!soundEnabled()) return;
    try { window.navigator.vibrate?.(pattern); } catch { /* non supporte */ }
}
