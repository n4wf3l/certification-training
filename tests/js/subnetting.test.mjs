// Verifie le generateur de subnetting sur des dizaines de milliers de tirages :
// la bonne reponse est recalculee ici par une methode independante (masques bit a
// bit, sans la "methode du nombre magique" du generateur), les 4 choix sont uniques
// et un seul est juste.
//   node tests/js/subnetting.test.mjs
import { generate, seeded, TYPES, LEVELS } from '../../resources/js/lib/subnetting.js';

const ip2n = (ip) => ip.split('.').map(Number).reduce((a, o) => a * 256 + o, 0);
const n2ip = (n) => [Math.floor(n / 16777216) % 256, Math.floor(n / 65536) % 256, Math.floor(n / 256) % 256, n % 256].join('.');
const size = (p) => 2 ** (32 - p);
const net = (ip, p) => Math.floor(ip2n(ip) / size(p)) * size(p);
const mask = (p) => n2ip(2 ** 32 - size(p));

function expected(q) {
    const { ip, prefix: p } = q.prompt;
    switch (q.type) {
        case 'network': return n2ip(net(ip, p));
        case 'broadcast': return n2ip(net(ip, p) + size(p) - 1);
        case 'first': return n2ip(net(ip, p) + 1);
        case 'last': return n2ip(net(ip, p) + size(p) - 2);
        case 'hosts': return String(size(p) - 2);
        case 'mask': return mask(p);
        case 'prefix_from_mask': return '/' + (32 - Math.log2(2 ** 32 - ip2n(q.prompt.mask)));
        case 'wildcard': return n2ip(size(p) - 1);
        case 'prefix_for_hosts': { let b = 2; while (2 ** b - 2 < q.prompt.hosts) b++; return '/' + (32 - b); }
        case 'subnets_count': return String(2 ** (q.prompt.to - q.prompt.from));
        case 'same_subnet': return null; // verifie a part
        default: throw new Error('type inconnu ' + q.type);
    }
}

let checked = 0;
const failures = [];
for (const level of Object.keys(LEVELS)) {
    for (const type of TYPES) {
        const rng = seeded(level.length * 1000 + TYPES.indexOf(type));
        for (let i = 0; i < 3000; i++) {
            const q = generate({ level, types: [type], rng });
            const fail = (m) => failures.push(`${level}/${type}: ${m} ${JSON.stringify(q.prompt)} -> ${JSON.stringify(q.options)}`);
            if (q.options.length !== 4) fail('pas 4 choix');
            if (new Set(q.options).size !== 4) fail('choix en double');
            if (q.options[q.answerIndex] !== q.correct) fail('answerIndex incoherent');
            if (q.type === 'same_subnet') {
                const n = net(q.prompt.ip, q.prompt.prefix);
                const inside = q.options.filter((o) => net(o, q.prompt.prefix) === n && ip2n(o) !== n && ip2n(o) !== n + size(q.prompt.prefix) - 1);
                if (inside.length !== 1 || inside[0] !== q.correct) fail('same_subnet : un seul hote du sous-reseau attendu');
            } else {
                const exp = expected(q);
                if (q.correct !== exp) fail(`attendu ${exp}, obtenu ${q.correct}`);
                if (q.options.filter((o) => o === exp).length !== 1) fail('la bonne valeur doit apparaitre une fois');
            }
            if (q.prompt.prefix !== undefined) {
                const { minPrefix, maxPrefix } = LEVELS[level];
                if (q.prompt.prefix < minPrefix || q.prompt.prefix > maxPrefix) fail('prefixe hors niveau');
            }
            checked++;
        }
    }
}

if (failures.length) {
    console.error(`${failures.length} echec(s) sur ${checked} exercices :`);
    for (const f of failures.slice(0, 20)) console.error(' - ' + f);
    process.exit(1);
}
console.log(`OK : ${checked} exercices verifies (${TYPES.length} types x ${Object.keys(LEVELS).length} niveaux).`);
