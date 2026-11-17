// Generateur d'exercices de subnetting IPv4, illimite et toujours juste : chaque
// reponse est calculee, jamais saisie a la main. Les mauvaises reponses reprennent
// les erreurs classiques (bloc voisin, octet faux, broadcast confondu avec le
// dernier hote, hotes sans retirer reseau et broadcast...).
//
// Module pur (aucune dependance navigateur) : teste par tests/js/subnetting.test.mjs.

export const TYPES = [
    'network', 'broadcast', 'first', 'last', 'hosts', 'mask', 'prefix_from_mask',
    'wildcard', 'prefix_for_hosts', 'same_subnet', 'subnets_count',
];

export const LEVELS = {
    easy: { minPrefix: 24, maxPrefix: 30 },
    medium: { minPrefix: 16, maxPrefix: 30 },
    hard: { minPrefix: 8, maxPrefix: 30 },
};

// ── Arithmetique IPv4 (entiers non signes 32 bits) ──────────────────────
export const toInt = (ip) => ip.split('.').reduce((acc, o) => (acc * 256) + Number(o), 0) >>> 0;
export const toIp = (n) => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join('.');
export const maskInt = (p) => (p === 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0);
export const networkOf = (ip, p) => (toInt(ip) & maskInt(p)) >>> 0;
export const broadcastOf = (ip, p) => (networkOf(ip, p) | (~maskInt(p) >>> 0)) >>> 0;
export const usableHosts = (p) => (p >= 31 ? 0 : (2 ** (32 - p)) - 2);

/** Octet "interessant" (0-3) : celui ou le masque n'est ni 255 ni 0 (ou le premier 0 pour /8, /16, /24). */
export function interestingOctet(p) {
    return Math.min(3, Math.floor(p / 8));
}

/** Detail du calcul par la methode du "nombre magique". */
export function magic(ip, p) {
    const i = interestingOctet(p);
    const maskOctet = (maskInt(p) >>> (24 - 8 * i)) & 255;
    const block = 256 - maskOctet;
    const value = Number(ip.split('.')[i]);
    const start = Math.floor(value / block) * block;
    return { octet: i + 1, maskOctet, block, value, start, end: start + block - 1 };
}

// ── Aleatoire ──────────────────────────────────────────────────────────
const rnd = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
function shuffle(rng, arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/** Adresse privee plausible selon le niveau, choisie pour etre un hote (ni reseau ni broadcast). */
function randomHost(rng, level, p) {
    for (;;) {
        let ip;
        if (level === 'easy') ip = `192.168.${rnd(rng, 0, 255)}.${rnd(rng, 1, 254)}`;
        else if (level === 'medium') ip = rng() < 0.5 ? `172.${rnd(rng, 16, 31)}.${rnd(rng, 0, 255)}.${rnd(rng, 1, 254)}` : `10.${rnd(rng, 0, 255)}.${rnd(rng, 0, 255)}.${rnd(rng, 1, 254)}`;
        else ip = pick(rng, [
            () => `10.${rnd(rng, 0, 255)}.${rnd(rng, 0, 255)}.${rnd(rng, 0, 255)}`,
            () => `172.${rnd(rng, 16, 31)}.${rnd(rng, 0, 255)}.${rnd(rng, 0, 255)}`,
            () => `192.168.${rnd(rng, 0, 255)}.${rnd(rng, 0, 255)}`,
        ])();
        const n = toInt(ip);
        if (n !== networkOf(ip, p) && n !== broadcastOf(ip, p)) return ip;
    }
}

/** Assemble 4 choix uniques (1 juste + 3 pieges) ; complete avec des valeurs proches si besoin. */
function options(rng, correct, traps, filler) {
    const seen = new Set([correct]);
    const wrong = [];
    for (const t of [...traps, ...filler]) {
        if (t == null || seen.has(t)) continue;
        seen.add(t);
        wrong.push(t);
        if (wrong.length === 3) break;
    }
    if (wrong.length < 3) throw new Error(`pas assez de pieges pour ${correct}`);
    const all = shuffle(rng, [correct, ...wrong]);
    return { options: all, answerIndex: all.indexOf(correct) };
}

const shift = (n, d) => toIp(((n + d) >>> 0));

// ── Generateurs par type ───────────────────────────────────────────────
const GEN = {
    network(rng, level, p) {
        const ip = randomHost(rng, level, p);
        const net = networkOf(ip, p), bc = broadcastOf(ip, p), size = 2 ** (32 - p);
        const correct = toIp(net);
        const o = options(rng, correct,
            [shift(net, -size), shift(net, size), toIp(net + 1), toIp(bc), toIp((toInt(ip) & maskInt(Math.floor(p / 8) * 8)) >>> 0)],
            [shift(net, 2 * size), shift(net, -2 * size), shift(net, -1)]);
        return { ...o, correct, prompt: { ip, prefix: p }, explain: { ...magic(ip, p), ip, prefix: p, mask: toIp(maskInt(p)), network: correct, broadcast: toIp(bc) } };
    },
    broadcast(rng, level, p) {
        const ip = randomHost(rng, level, p);
        const net = networkOf(ip, p), bc = broadcastOf(ip, p), size = 2 ** (32 - p);
        const correct = toIp(bc);
        const o = options(rng, correct,
            [toIp(bc - 1), shift(bc, size), shift(bc, -size), toIp(net)],
            [shift(bc, 2 * size), toIp(bc + 1)]);
        return { ...o, correct, prompt: { ip, prefix: p }, explain: { ...magic(ip, p), ip, prefix: p, mask: toIp(maskInt(p)), network: toIp(net), broadcast: correct } };
    },
    first(rng, level, p) {
        const ip = randomHost(rng, level, p);
        const net = networkOf(ip, p), bc = broadcastOf(ip, p), size = 2 ** (32 - p);
        const correct = toIp(net + 1);
        const o = options(rng, correct,
            [toIp(net), shift(net, size + 1), shift(net, -size + 1), toIp(net + 2)],
            [toIp(bc - 1), shift(net, 2 * size + 1)]);
        return { ...o, correct, prompt: { ip, prefix: p }, explain: { ...magic(ip, p), ip, prefix: p, mask: toIp(maskInt(p)), network: toIp(net), broadcast: toIp(bc), first: correct, last: toIp(bc - 1) } };
    },
    last(rng, level, p) {
        const ip = randomHost(rng, level, p);
        const net = networkOf(ip, p), bc = broadcastOf(ip, p), size = 2 ** (32 - p);
        const correct = toIp(bc - 1);
        const o = options(rng, correct,
            [toIp(bc), shift(bc, -size - 1), shift(bc, size - 1), toIp(bc - 2)],
            [toIp(net + 1), shift(bc, 2 * size - 1)]);
        return { ...o, correct, prompt: { ip, prefix: p }, explain: { ...magic(ip, p), ip, prefix: p, mask: toIp(maskInt(p)), network: toIp(net), broadcast: toIp(bc), first: toIp(net + 1), last: correct } };
    },
    hosts(rng, level, p) {
        const bits = 32 - p, total = 2 ** bits;
        const correct = String(total - 2);
        const o = options(rng, correct,
            [String(total), String(total - 1), String(total / 2 - 2), String(total * 2 - 2)],
            [String(total / 2), String(bits)]);
        return { ...o, correct, prompt: { prefix: p }, explain: { prefix: p, bits, total, usable: total - 2 } };
    },
    mask(rng, level, p) {
        const correct = toIp(maskInt(p));
        const o = options(rng, correct,
            [toIp(maskInt(p + 1)), toIp(maskInt(p - 1)), toIp((~maskInt(p)) >>> 0), toIp(maskInt(p + 2))],
            [toIp(maskInt(p - 2)), toIp(maskInt(Math.floor(p / 8) * 8))]);
        return { ...o, correct, prompt: { prefix: p }, explain: { ...magic('0.0.0.0', p), prefix: p, mask: correct } };
    },
    prefix_from_mask(rng, level, p) {
        const mask = toIp(maskInt(p));
        const correct = `/${p}`;
        const o = options(rng, correct, [`/${p + 1}`, `/${p - 1}`, `/${p + 2}`, `/${p - 2}`], [`/${32 - p}`]);
        return { ...o, correct, prompt: { mask }, explain: { ...magic('0.0.0.0', p), prefix: p, mask } };
    },
    wildcard(rng, level, p) {
        const correct = toIp((~maskInt(p)) >>> 0);
        const o = options(rng, correct,
            [toIp(maskInt(p)), toIp((~maskInt(p + 1)) >>> 0), toIp((~maskInt(p - 1)) >>> 0), toIp(((~maskInt(p)) >>> 0) - 1)],
            [toIp((~maskInt(p + 2)) >>> 0)]);
        return { ...o, correct, prompt: { prefix: p }, explain: { prefix: p, mask: toIp(maskInt(p)), wildcard: correct } };
    },
    prefix_for_hosts(rng, level, p) {
        // Un besoin en hotes qui tombe pile entre deux tailles : la bonne reponse est /p.
        const hosts = rnd(rng, usableHosts(p + 1) + 1, usableHosts(p));
        const correct = `/${p}`;
        const o = options(rng, correct, [`/${p + 1}`, `/${p - 1}`, `/${p + 2}`, `/${p - 2}`], [`/${32 - p}`]);
        return { ...o, correct, prompt: { hosts }, explain: { hosts, prefix: p, bits: 32 - p, usable: usableHosts(p), smaller: p + 1, smallerUsable: usableHosts(p + 1) } };
    },
    same_subnet(rng, level, p) {
        const ip = randomHost(rng, level, p);
        const net = networkOf(ip, p), bc = broadcastOf(ip, p), size = 2 ** (32 - p);
        // Un autre hote du meme sous-reseau, different de ip.
        let mate;
        do { mate = rnd(rng, net + 1, bc - 1); } while (mate === toInt(ip) && bc - net > 2);
        const correct = toIp(mate);
        const outside = (d) => shift(net, d);
        const o = options(rng, correct,
            [outside(size + 1), outside(-1), toIp(bc + 1), outside(size + rnd(rng, 1, Math.max(1, size - 2))), outside(-size + 1)],
            [outside(2 * size + 1), outside(-2)]);
        return { ...o, correct, prompt: { ip, prefix: p }, explain: { ...magic(ip, p), ip, prefix: p, mask: toIp(maskInt(p)), network: toIp(net), broadcast: toIp(bc), first: toIp(net + 1), last: toIp(bc - 1) } };
    },
    subnets_count(rng, level, p) {
        const from = Math.max(8, Math.min(p - 1, [8, 16, 24][rnd(rng, 0, 2)]));
        const base = p - from >= 1 ? from : p - 1;
        const bits = p - base, count = 2 ** bits;
        const correct = String(count);
        const o = options(rng, correct,
            [String(count - 2), String(count * 2), String(count / 2), String(bits)],
            [String(2 ** (32 - p)), String(count + 2)]);
        return { ...o, correct, prompt: { from: base, to: p }, explain: { from: base, to: p, bits, count } };
    },
};

/** Bornes de prefixe utiles par type (ex. pas de /30 pour "prefix_for_hosts" vers /31). */
function prefixFor(rng, type, level) {
    const { minPrefix, maxPrefix } = LEVELS[level];
    if (type === 'prefix_for_hosts') return rnd(rng, Math.max(minPrefix, 10), Math.min(maxPrefix, 29));
    if (type === 'subnets_count') return rnd(rng, Math.max(minPrefix, 9), Math.min(maxPrefix, 30));
    if (type === 'mask' || type === 'prefix_from_mask' || type === 'wildcard') return rnd(rng, Math.max(minPrefix, 10), Math.min(maxPrefix, 30));
    if (type === 'hosts') return rnd(rng, Math.max(minPrefix, 10), Math.min(maxPrefix, 30));
    return rnd(rng, minPrefix, maxPrefix);
}

/**
 * Un exercice : { type, level, prompt, options[4], answerIndex, correct, explain }.
 * `types` limite les types tires ; `rng` permet un tirage reproductible (tests).
 */
export function generate({ level = 'easy', types = TYPES, rng = Math.random } = {}) {
    const type = pick(rng, types);
    const p = prefixFor(rng, type, level);
    return { type, level, ...GEN[type](rng, level, p) };
}

/** Petit generateur pseudo-aleatoire reproductible (mulberry32). */
export function seeded(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
