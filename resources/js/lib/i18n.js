// t() helper minimaliste + hook useT() lisant la locale partagee par Inertia.
//
// Usage :
//   const t = useT();
//   t('nav.certifications')             // 'Certifications'
//   t('common.hello', { name: 'Nawfel' }) // 'Hello Nawfel' (placeholder :name)
//   t('unknown.key')                    // 'unknown.key' (fallback = la cle brute pour reperer les manquants)
//
// Les dictionnaires sont bundles cote client (2 langues x quelques centaines de
// cles = ~15 KB gzipped) plutot que serialises par requete Inertia. La locale
// courante vient de Inertia shared props (locale), resolue serveur par SetLocale.

import { usePage } from '@inertiajs/react';
import en from '@/i18n/en';
import fr from '@/i18n/fr';

const DICTS = { en, fr };
export const SUPPORTED_LOCALES = Object.keys(DICTS);
export const DEFAULT_LOCALE = 'en';

/** Resout un chemin en pointille sur l'objet dict, ou undefined si absent. */
function resolve(dict, key) {
    if (!dict || typeof key !== 'string') return undefined;
    return key.split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), dict);
}

/** Interpolation :param sur une string. Ignore silencieusement les placeholders absents. */
function interpolate(str, params) {
    if (!params || typeof str !== 'string') return str;
    return str.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (m, name) => (
        Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : m
    ));
}

/**
 * Fonction pure translate() : utile pour du code non-React (utils, contextes)
 * ou pour du SSR eventuel. Prend la locale en 1er argument.
 */
export function translate(locale, key, params) {
    const dict = DICTS[locale] || DICTS[DEFAULT_LOCALE];
    const value = resolve(dict, key);
    if (value === undefined) {
        // Fallback vers EN si la locale ne contient pas la cle (nouvelle string
        // pas encore traduite). Sinon on renvoie la cle brute pour debug visuel.
        const enValue = resolve(DICTS[DEFAULT_LOCALE], key);
        return enValue !== undefined ? interpolate(enValue, params) : key;
    }
    return interpolate(value, params);
}

/**
 * Hook React : recupere la locale via Inertia et renvoie une fonction t() liee.
 * L'appel est peu couteux ; usePage() est deja utilise partout dans l'app.
 */
export function useT() {
    const { props } = usePage();
    const locale = props?.locale && DICTS[props.locale] ? props.locale : DEFAULT_LOCALE;
    return (key, params) => translate(locale, key, params);
}

/** Hook complementaire : renvoie juste la locale courante (utile pour l'attr HTML lang). */
export function useLocale() {
    const { props } = usePage();
    return props?.locale && DICTS[props.locale] ? props.locale : DEFAULT_LOCALE;
}
